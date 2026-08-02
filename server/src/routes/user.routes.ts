import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { upload } from "../middleware/multerUpload.middleware";
import { UpdateProfileSchema, UserIdParamSchema } from "../schemas/user.schema";

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, userController.getMe);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone_number: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  "/me",
  authenticate,
  upload.single("avatar"),
  validateRequest(UpdateProfileSchema, "body"),
  userController.updateProfile
);

/**
 * @openapi
 * /users/me/avatar:
 *   delete:
 *     summary: Remove user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 */
router.delete("/me/avatar", authenticate, userController.removeAvatar);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get public profile by user ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authenticate,
  validateRequest(UserIdParamSchema, "params"),
  userController.getUserById
);

export default router;
