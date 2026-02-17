import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateToken } from '../utils/jwt.util.js';
import { BCRYPT_ROUNDS } from '../config/constants.js';
import { ApiError } from '../utils/responses.util.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    plan: string;
    planExpiresAt: Date | null;
  };
  token: string;
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

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
    },
    token,
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

  const token = generateToken({
    id: user.id,
    email: user.email,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
    },
    token,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      telegramChatId: true,
      plan: true,
      planExpiresAt: true,
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
