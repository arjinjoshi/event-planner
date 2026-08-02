import { Router } from "express";
import { rsvpController } from "../controllers/rsvp.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireEmailVerified } from "../middleware/requiredEmailVerified.middleware";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { CreateRsvpSchema, EventIdParamSchema } from "../schemas/rsvp.schema";

const router = Router();

// Require authentication and verified email for all RSVP endpoints
router.use(authenticate, requireEmailVerified);

/**
 * @openapi
 * /rsvps/me:
 *   get:
 *     summary: Get RSVPs for the logged-in user
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User RSVP history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Email not verified)
 */
router.get("/me", rsvpController.getUserRsvps);

/**
 * @openapi
 * /rsvps/events/{eventId}:
 *   post:
 *     summary: RSVP to an event
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [YES, MAYBE, NO] }
 *     responses:
 *       201:
 *         description: RSVP recorded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Email not verified)
 *       409:
 *         description: RSVP already exists for this event
 */
router.post(
  "/events/:eventId",
  validateRequest(EventIdParamSchema, "params"),
  validateRequest(CreateRsvpSchema, "body"),
  rsvpController.createRsvp
);

/**
 * @openapi
 * /rsvps/events/{eventId}:
 *   patch:
 *     summary: Update existing RSVP status
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: RSVP updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Email not verified)
 */
router.patch(
  "/events/:eventId",
  validateRequest(EventIdParamSchema, "params"),
  validateRequest(CreateRsvpSchema, "body"),
  rsvpController.updateRsvp
);

/**
 * @openapi
 * /rsvps/events/{eventId}:
 *   get:
 *     summary: Get all RSVPs for an event
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event attendees list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Email not verified)
 */
router.get(
  "/events/:eventId",
  validateRequest(EventIdParamSchema, "params"),
  rsvpController.getEventRsvps
);

/**
 * @openapi
 * /rsvps/events/{eventId}:
 *   delete:
 *     summary: Cancel RSVP for an event
 *     tags: [RSVPs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: RSVP canceled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Email not verified)
 */
router.delete(
  "/events/:eventId",
  validateRequest(EventIdParamSchema, "params"),
  rsvpController.cancelRsvp
);

export default router;