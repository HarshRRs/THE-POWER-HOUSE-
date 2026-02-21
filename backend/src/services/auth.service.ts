import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { generateAccessToken, generateRefreshTokenValue, hashToken, REFRESH_TOKEN_DURATION_MS } from '../utils/jwt.util.js';
import { BCRYPT_ROUNDS } from '../config/constants.js';
import { ApiError } from '../utils/responses.util.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
    plan: string;
    planExpiresAt: Date | null;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRefreshTokenValue();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_MS);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const { email, password, phone } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
      emailVerified: false,
      emailVerificationToken,
    },
  });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  const refreshToken = await createRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new ApiError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  const refreshToken = await createRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    // Clean up expired token if found
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw new ApiError('Invalid or expired refresh token', 401);
  }

  // Rotate: delete old token, create new one
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = storedToken.user;

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function forgotPassword(email: string): Promise<{ resetToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal if email exists
    return { resetToken: '' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  return { resetToken };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ApiError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  // Invalidate all refresh tokens on password change
  await revokeAllUserTokens(user.id);
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new ApiError('Invalid verification token', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  });
}

export async function resendVerificationEmail(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerificationToken: token },
  });

  return token;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      telegramChatId: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      emailVerified: true,
      notifyEmail: true,
      notifyTelegram: true,
      notifySms: true,
      notifyFcm: true,
      createdAt: true,
      _count: {
        select: {
          alerts: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return user;
}
