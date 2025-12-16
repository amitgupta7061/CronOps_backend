import nodemailer from 'nodemailer';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

// Create reusable transporter
let transporter;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  // Use environment variables for email config
  // For development, you can use services like Mailtrap, Ethereal, or Gmail
  if (config.email?.host) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port || 587,
      secure: config.email.secure || false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    // Fallback: Create a test account on Ethereal for development
    logger.warn('Email not configured. Using console output for OTPs in development.');
    transporter = null;
  }

  return transporter;
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email, otp, name) {
  const transport = getTransporter();

  const mailOptions = {
    from: config.email?.from || '"CronOps" <noreply@cronops.com>',
    to: email,
    subject: 'Verify Your CronOps Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin-bottom: 20px;">
                      <span style="font-size: 28px;">⏰</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b;">CronOps</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">Verify Your Email</h2>
                    <p style="margin: 0 0 24px; font-size: 16px; color: #52525b; line-height: 1.6;">
                      Hi${name ? ` ${name}` : ''},<br><br>
                      Thanks for signing up for CronOps! Please use the verification code below to complete your registration:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                      <p style="margin: 0 0 8px; font-size: 14px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                    </div>
                    
                    <p style="margin: 0 0 16px; font-size: 14px; color: #71717a; line-height: 1.6;">
                      This code will expire in <strong>10 minutes</strong>. If you didn't create an account with CronOps, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px 40px; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                      © ${new Date().getFullYear()} CronOps. All rights reserved.<br>
                      This is an automated message, please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
CronOps - Email Verification

Hi${name ? ` ${name}` : ''},

Thanks for signing up for CronOps! Please use the verification code below to complete your registration:

Verification Code: ${otp}

This code will expire in 10 minutes.

If you didn't create an account with CronOps, you can safely ignore this email.

© ${new Date().getFullYear()} CronOps. All rights reserved.
    `,
  };

  if (transport) {
    try {
      const info = await transport.sendMail(mailOptions);
      logger.info(`OTP email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      throw error;
    }
  } else {
    // Development fallback - log OTP to console
    logger.info('='.repeat(50));
    logger.info(`📧 OTP EMAIL (Development Mode)`);
    logger.info(`To: ${email}`);
    logger.info(`OTP: ${otp}`);
    logger.info(`Expires in: 10 minutes`);
    logger.info('='.repeat(50));
    return { success: true, development: true };
  }
}

/**
 * Send password reset email (for future use)
 */
export async function sendPasswordResetEmail(email, resetToken, name) {
  // Placeholder for password reset functionality
  logger.info(`Password reset email would be sent to ${email}`);
  return { success: true };
}

export default {
  sendOTPEmail,
  sendPasswordResetEmail,
};
