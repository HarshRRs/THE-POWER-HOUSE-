import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { generateAccessToken, generateRefreshTokenValue, hashToken, REFRESH_TOKEN_DURATION_MS } from '../utils/jwt.util.js';
import { BCRYPT_ROUNDS } from '../config/constants.js';
import { ApiError } from '../utils/responses.util.js';
import { sendEmail } from './notifications/email.service.js';
import logger from '../utils/logger.util.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

  // Send verification email (fire-and-forget)
  sendVerificationEmail(user.email, emailVerificationToken).catch((err) => {
    logger.error('Failed to send verification email:', err);
  });

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

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal if email exists
    return;
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

  // Send password reset email
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  sendEmail({
    to: user.email,
    subject: 'RDVPriority - Réinitialisation de votre mot de passe',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #000091; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Réinitialisation du mot de passe</h1>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe RDVPriority.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      <a href="${resetUrl}" style="display: inline-block; background: #e1000f; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0;">
        Réinitialiser mon mot de passe
      </a>
      <p style="color: #888; font-size: 14px;">Ce lien expire dans 1 heure.</p>
      <p style="color: #888; font-size: 14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </div>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">RDVPriority.fr - Votre assistant rendez-vous préfecture</p>
    </div>
  </div>
</body>
</html>`,
  }).catch((err) => {
    logger.error('Failed to send password reset email:', err);
  });
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

export async function resendVerificationEmail(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerificationToken: token },
    select: { email: true, emailVerified: true },
  });

  if (user.emailVerified) {
    throw new ApiError('Email is already verified', 400);
  }

  // Send verification email
  await sendVerificationEmail(user.email, token);
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

/**
 * Send email verification link to user
 */
async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}/api`;
  const verifyUrl = `${apiBase}/auth/verify-email/${token}`;
  await sendEmail({
    to: email,
    subject: 'RDVPriority - Vérifiez votre adresse email',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #000091; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Vérification de votre email</h1>
    </div>
    <div style="padding: 30px;">
      <p>Bienvenue sur RDVPriority !</p>
      <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #000091; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0;">
        Vérifier mon email
      </a>
      <p style="color: #888; font-size: 14px;">Si vous n'avez pas créé de compte sur RDVPriority, ignorez cet email.</p>
    </div>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">RDVPriority.fr - Votre assistant rendez-vous préfecture</p>
    </div>
  </div>
</body>
</html>`,
  });
}
