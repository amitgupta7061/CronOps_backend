import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { config } from '../utils/config.js';
import { generateOTP, getOTPExpiry, isOTPExpired } from '../utils/otp.js';
import { sendOTPEmail } from './emailService.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors.js';

const SALT_ROUNDS = 12;

/**
 * Generates JWT access and refresh tokens
 */
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

/**
 * Registers a new user (sends OTP for verification)
 */
export async function signup(email, password, name) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // If user exists but not verified, allow re-registration with new OTP
    if (!existingUser.isVerified) {
      const otp = generateOTP();
      const otpExpiresAt = getOTPExpiry(config.otp.expiryMinutes);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: await bcrypt.hash(password, SALT_ROUNDS),
          name,
          otp,
          otpExpiresAt,
        },
      });

      // Send OTP email
      await sendOTPEmail(email, otp, name);

      return {
        message: 'Verification code sent to your email',
        email,
        requiresVerification: true,
      };
    }
    throw new ConflictError('User with this email already exists');
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry(config.otp.expiryMinutes);

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user (unverified)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      isVerified: false,
      otp,
      otpExpiresAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  // Send OTP email
  await sendOTPEmail(email, otp, name);

  return {
    message: 'Verification code sent to your email',
    email: user.email,
    requiresVerification: true,
  };
}

/**
 * Verify user's email with OTP
 */
export async function verifyOTP(email, otp) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isVerified) {
    throw new BadRequestError('Email already verified');
  }

  if (!user.otp || !user.otpExpiresAt) {
    throw new BadRequestError('No OTP found. Please request a new one.');
  }

  if (isOTPExpired(user.otpExpiresAt)) {
    throw new BadRequestError('OTP has expired. Please request a new one.');
  }

  if (user.otp !== otp) {
    throw new BadRequestError('Invalid OTP');
  }

  // Mark user as verified and clear OTP
  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokens(verifiedUser.id);

  // Store refresh token
  await prisma.user.update({
    where: { id: verifiedUser.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: verifiedUser,
    ...tokens,
  };
}

/**
 * Resend OTP for verification
 */
export async function resendOTP(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isVerified) {
    throw new BadRequestError('Email already verified');
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry(config.otp.expiryMinutes);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiresAt,
    },
  });

  // Send OTP email
  await sendOTPEmail(email, otp, user.name);

  return {
    message: 'New verification code sent to your email',
    email,
  };
}

/**
 * Authenticates a user
 */
export async function login(email, password) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is verified
  if (!user.isVerified) {
    // Generate new OTP and send it
    const otp = generateOTP();
    const otpExpiresAt = getOTPExpiry(config.otp.expiryMinutes);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    });

    await sendOTPEmail(email, otp, user.name);

    throw new UnauthorizedError('Please verify your email first. A new verification code has been sent.', {
      requiresVerification: true,
      email: user.email,
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user.id);

  // Store refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    ...tokens,
  };
}

/**
 * Refreshes access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Find user and verify stored refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Update stored refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Logs out a user by invalidating refresh token
 */
export async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

/**
 * Gets user profile
 */
export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Generates a secure random token for password reset
 */
function generateResetToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Initiates password reset by sending email with reset token
 */
export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Don't reveal if user exists or not for security
  if (!user) {
    return {
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Store hashed token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiresAt,
    },
  });

  // Send password reset email
  const { sendPasswordResetEmail } = await import('./emailService.js');
  await sendPasswordResetEmail(email, resetToken, user.name);

  return {
    message: 'If an account exists with this email, you will receive a password reset link.',
  };
}

/**
 * Resets user password using reset token
 */
export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
      refreshToken: null, // Invalidate all sessions
    },
  });

  return {
    message: 'Password reset successfully. Please login with your new password.',
  };
}

/**
 * Change password for authenticated user
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully.',
  };
}

export default {
  signup,
  verifyOTP,
  resendOTP,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};


