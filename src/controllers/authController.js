import authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/auth/signup
 * Register a new user and send OTP for verification
 */
export const signup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const result = await authService.signup(email, password, name);

  res.status(201).json({
    success: true,
    message: result.message,
    data: {
      email: result.email,
      requiresVerification: result.requiresVerification,
    },
  });
});

/**
 * POST /api/auth/verify-otp
 * Verify user's email with OTP
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await authService.verifyOTP(email, otp);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.resendOTP(email);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      email: result.email,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens,
  });
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export default {
  signup,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyOTP,
  resendOTP,
};
