import { Router } from "express";
import authRoutes from "./auth.routes";
import eventRoutes from "./event.routes";
import rsvpRoutes from "./rsvp.routes";
import userRoutes from "./user.routes";

const router = Router();

// Root API Healthcheck
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Authentication Routes
router.use("/auth", authRoutes);

// User Profile Routes
router.use("/users", userRoutes);

// Event Management & Search Routes
router.use("/events", eventRoutes);

// RSVP Management & Attendees Routes
router.use("/rsvps", rsvpRoutes);

export default router;