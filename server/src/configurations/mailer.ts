import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "./logger";

/**
 * Configure Nodemailer Transporter using Google OAuth2 credentials
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: config.EMAIL_USER,
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    refreshToken: config.REFRESH_TOKEN,
  },
});

/**
 * Verify Gmail OAuth2 connection on startup
 */
transporter.verify((error, _success) => {
  if (error) {
    logger.error(`Gmail OAuth2 connection failed: ${error.message}`);
  } else {
    logger.info("Gmail OAuth2 email server ready to send messages");
  }
});

/**
 * Core helper function to dispatch emails
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  return await transporter.sendMail({
    from: `"Event Management Platform" <${config.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
