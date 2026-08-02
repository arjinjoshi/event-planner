import { db } from "../configurations/db";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { mailService } from "../services/mail.service";
import { NUMBER_OF_SALT_ROUNDS } from "../constants/auth";
import { Knex } from "knex";

/**
 * Generates and sends a 6-digit OTP for Email Verification
 */
export const sendVerificationToken = async (
  userId: string,
  email: string,
  trx?: Knex.Transaction
) => {
  const dbClient = trx || db;

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Hash the OTP for secure storage
  const hashedOtp = await bcrypt.hash(otp, NUMBER_OF_SALT_ROUNDS);

  // 3. Set a 15-minute expiration time
  const expires_at = new Date();
  expires_at.setMinutes(expires_at.getMinutes() + 15);

  // 4. Clear old pending OTPs for this user
  await dbClient("email_verifications").where({ user_id: userId }).delete();

  // 5. Store the hashed OTP in DB
  await dbClient("email_verifications").insert({
    user_id: userId,
    token: hashedOtp, // Now storing hashed 6-digit OTP
    expires_at,
  });

  // 6. Send the plain-text 6-digit OTP via email
  await mailService.sendVerificationEmail(email, otp);
};

// 2. Your existing 2FA OTP function left untouched
export const generateAndSend2FAOtp = async (userId: string, email: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const hashedOtp = await bcrypt.hash(otp, NUMBER_OF_SALT_ROUNDS);

  // Store hashed OTP in user's two_factor_secret column
  await db("users").where({ id: userId }).update({
    two_factor_secret: hashedOtp,
  });

  await mailService.send2FAOtpEmail(email, otp);
};
