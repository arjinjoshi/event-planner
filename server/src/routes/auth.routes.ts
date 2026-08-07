import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/multerUpload.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  ResendVerificationEmailSchema,
  Verify2FAOtpSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  Toggle2FASchema,
} from "../schemas/auth.schema";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               name: { type: string }
 *               phone_number: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Account successfully registered
 *       400:
 *         description: Validation error or duplicate email
 */
router.post(
  "/register",
  authLimiter,
  upload.single("avatar"),
  validateRequest(RegisterSchema),
  authController.register
);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Request/Resend email verification OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Verification OTP sent successfully
 *       400:
 *         description: Email is already verified
 */
router.post(
  "/resend-verification",
  authLimiter,
  validateRequest(ResendVerificationEmailSchema),
  authController.resendVerificationEmail
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address with 6-digit OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token]
 *             properties:
 *               email: { type: string, format: email }
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/verify-email",
  authLimiter,
  validateRequest(VerifyEmailSchema),
  authController.verifyEmail
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in to account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful (returns tokens or 2FA challenge)
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, validateRequest(LoginSchema), authController.login);

/**
 * @openapi
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify 2FA OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: 2FA challenge passed and tokens issued
 */
router.post(
  "/verify-2fa",
  authLimiter,
  validateRequest(Verify2FAOtpSchema),
  authController.verify2FAOtp
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access token generated
 */
router.post(
  "/refresh",
  authLimiter,
  validateRequest(RefreshTokenSchema),
  authController.refreshToken
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Session terminated successfully
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/toggle-2fa:
 *   patch:
 *     summary: Enable or disable 2FA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enable]
 *             properties:
 *               enable: { type: boolean }
 *     responses:
 *       200:
 *         description: 2FA settings toggled
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/toggle-2fa",
  authenticate,
  validateRequest(Toggle2FASchema),
  authController.toggle2FA
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post(
  "/change-password",
  authenticate,
  validateRequest(ChangePasswordSchema),
  authController.changePassword
);

export default router;