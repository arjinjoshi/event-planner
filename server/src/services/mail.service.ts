import { sendEmail } from "../configurations/mailer";
import { config } from "../config";

export const mailService = {
  /**
   * Send Email Verification Link during User Registration
   */
  sendVerificationEmail: async (email: string, token: string) => {
    const verificationUrl = `${config.APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to Event Platform!</h2>
        <p style="color: #555; font-size: 16px;">Thank you for registering. Please verify your email address to activate your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" target="_blank" style="background-color: #4CAF50; color: white; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Or copy and paste this verification code manually:</p>
        <p style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px; word-break: break-all;">${token}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">This verification link will expire in 24 hours. If you did not request this, please ignore this email.</p>
      </div>
    `;

    return sendEmail(email, "Verify Your Email Address", html);
  },

  /**
   * Send 6-Digit Two-Factor Authentication (2FA) Code during Login
   */
  send2FAOtpEmail: async (email: string, otp: string) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Two-Factor Authentication</h2>
        <p style="color: #555; font-size: 16px;">Use the following 6-digit verification code to log in to your account:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2196F3; background-color: #eef7ff; padding: 10px 24px; border-radius: 6px; border: 1px dashed #2196F3;">
            ${otp}
          </span>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>
    `;

    return sendEmail(email, "Your 2FA Verification Code", html);
  },
};
