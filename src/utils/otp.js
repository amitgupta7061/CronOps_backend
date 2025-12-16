import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate OTP expiry time (default: 10 minutes from now)
 */
export function getOTPExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

export default {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
};
