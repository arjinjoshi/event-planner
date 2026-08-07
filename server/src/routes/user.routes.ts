import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { upload } from "../middleware/multerUpload.middleware";
import {
  UpdateProfileSchema,
  UserIdParamSchema,
  GetUsersQuerySchema,
  GetUserEventsQuerySchema,
} from "../schemas/user.schema";

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users with search, pagination, and event counts
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user name or email
 *     responses:
 *       200:
 *         description: List of users with events count
 */
router.get(
  "/",
  authenticate,
  validateRequest(GetUsersQuerySchema, "query"),
  userController.getAllUsers
);

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

/**
 * @openapi
 * /users/{id}/events:
 *   get:
 *     summary: Get all events created by a specific user
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of events created by user
 *       404:
 *         description: User not found
 */
router.get(
  "/:id/events",
  authenticate,
  validateRequest(UserIdParamSchema, "params"),
  validateRequest(GetUserEventsQuerySchema, "query"),
  userController.getUserEvents
);

export default router;