import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireEmailVerified } from "../middleware/requiredEmailVerified.middleware";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { upload } from "../middleware/multerUpload.middleware";
import {
  CreateEventSchema,
  FilterEventSchema,
  EventIdParamSchema,
  UpdateEventSchema,
} from "../schemas/event.schema";
import { isOwner } from "../middleware/authorization.middleware";

const router = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List, filter, and paginate events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: is_private
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [start_time, created_at, capacity, popularity], default: start_time }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of events
 */
router.get("/", validateRequest(FilterEventSchema, "query"), eventController.getEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get(
  "/:id",
  validateRequest(EventIdParamSchema, "params"),
  eventController.getEventById
);

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, location, start_time, end_time]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *               capacity: { type: integer }
 *               is_private: { type: boolean, default: false }
 *               tags: { type: array, items: { type: string } }
 *               media:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Event created
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Email not verified)
 */
router.post(
  "/",
  authenticate,
  requireEmailVerified,
  upload.array("media", 5),
  validateRequest(CreateEventSchema, "body"),
  eventController.createEvent
);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     summary: Replace event (Creator only - full replacement)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, location, start_time, end_time, capacity, is_private]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *               capacity: { type: integer, minimum: 1 }
 *               is_private: { type: boolean }
 *               tags: { type: array, items: { type: string } }
 *               media:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Event replaced successfully
 *       400:
 *         description: Bad request (Missing required fields)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not event creator OR email not verified)
 */
 router.put(
  "/:id",
  authenticate,
  requireEmailVerified,
  isOwner("events", "creator_id"),
  upload.array("media", 5),
  validateRequest(UpdateEventSchema, "body"),
  eventController.updateEvent
);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     summary: Delete event (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event deleted
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Not event creator OR email not verified)
 */
router.delete(
  "/:id",
  authenticate,
  requireEmailVerified,
  isOwner("events", "creator_id"),
  eventController.deleteEvent
);

export default router;
