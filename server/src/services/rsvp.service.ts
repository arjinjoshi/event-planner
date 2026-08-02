import { db } from "../configurations/db";
import { CreateRsvpDTO } from "../schemas/rsvp.schema";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";

export const rsvpService = {
  /**
   * Create a new RSVP for an event
   */
  createRsvp: async (eventId: string, userId: string, data: CreateRsvpDTO) => {
    return await db.transaction(async (trx) => {
      // Lock event row for update to prevent concurrent overbooking
      const event = await trx("events").where({ id: eventId }).forUpdate().first();
      if (!event) {
        throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
      }

      if (data.status === "YES") {
        const attendingResult = await trx("event_rsvps")
          .where({ event_id: eventId, status: "YES" })
          .count("* as count")
          .first();

        const currentAttendingCount = parseInt(
          (attendingResult?.count as string) || "0",
          10
        );

        if (currentAttendingCount >= event.capacity) {
          throw new AppError(
            "Event is fully booked. No remaining spots available.",
            httpCodes.BAD_REQUEST.statusCode
          );
        }
      }

      try {
        const [rsvp] = await trx("event_rsvps")
          .insert({
            event_id: eventId,
            user_id: userId,
            status: data.status,
          })
          .returning("*");

        return rsvp;
      } catch (error: any) {
        if (error.code === "23505") {
          throw new AppError(
            "RSVP already exists for this event. Use PATCH to update your status.",
            httpCodes.CONFLICT.statusCode
          );
        }
        throw error;
      }
    });
  },

  /**
   * Update an existing RSVP status for an event
   */
  updateRsvp: async (eventId: string, userId: string, data: CreateRsvpDTO) => {
    return await db.transaction(async (trx) => {
      const event = await trx("events").where({ id: eventId }).forUpdate().first();
      if (!event) {
        throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
      }

      const existingRsvp = await trx("event_rsvps")
        .where({ event_id: eventId, user_id: userId })
        .first();

      if (!existingRsvp) {
        throw new AppError(
          "No existing RSVP found for this event. Use POST to create one.",
          httpCodes.NOT_FOUND.statusCode
        );
      }

      if (data.status === "YES" && existingRsvp.status !== "YES") {
        const attendingResult = await trx("event_rsvps")
          .where({ event_id: eventId, status: "YES" })
          .count("* as count")
          .first();

        const currentAttendingCount = parseInt(
          (attendingResult?.count as string) || "0",
          10
        );

        if (currentAttendingCount >= event.capacity) {
          throw new AppError(
            "Event is fully booked. No remaining spots available.",
            httpCodes.BAD_REQUEST.statusCode
          );
        }
      }

      const [rsvp] = await trx("event_rsvps")
        .where({ event_id: eventId, user_id: userId })
        .update({
          status: data.status,
          updated_at: trx.fn.now(),
        })
        .returning("*");

      return rsvp;
    });
  },

  /**
   * Get all RSVPs for a specific event
   */
  getEventRsvps: async (eventId: string) => {
    const event = await db("events").where({ id: eventId }).first();
    if (!event) {
      throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
    }

    return await db("event_rsvps")
      .join("users", "event_rsvps.user_id", "users.id")
      .where({ event_id: eventId })
      .select(
        "event_rsvps.id",
        "event_rsvps.status",
        "event_rsvps.created_at",
        "users.id as user_id",
        "users.name as user_name",
        "users.email as user_email"
      );
  },

  /**
   * Get all RSVPs for the authenticated user
   */
  getUserRsvps: async (userId: string) => {
    return await db("event_rsvps")
      .join("events", "event_rsvps.event_id", "events.id")
      .where({ "event_rsvps.user_id": userId })
      .select(
        "event_rsvps.id as rsvp_id",
        "event_rsvps.status",
        "events.id as event_id",
        "events.title",
        "events.start_time",
        "events.end_time",
        "events.location"
      );
  },

  /**
   * Cancel an existing RSVP for an event
   */
  cancelRsvp: async (eventId: string, userId: string) => {
    const deletedCount = await db("event_rsvps")
      .where({ event_id: eventId, user_id: userId })
      .del();

    if (!deletedCount) {
      throw new AppError(
        "RSVP not found or already cancelled",
        httpCodes.NOT_FOUND.statusCode
      );
    }

    return { message: "RSVP cancelled successfully" };
  },
};
