import { db } from "../configurations/db";
import { CreateEventDTO, UpdateEventDTO, FilterEventDTO } from "../schemas/event.schema";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import { uploadMedia, deleteMedia } from "./cloudinary.service"; // <--- Import deleteMedia
import { EventWithDetails, PaginatedEventsResponse } from "../interfaces/event.interface";

export const eventService = {
  /**
   * Create a new event with optional media files and tags
   */
  createEvent: async (
    creatorId: string,
    data: CreateEventDTO,
    files?: Express.Multer.File[]
  ) => {
    const { tags, ...eventData } = data;

    return await db.transaction(async (trx) => {
      // Insert core event details into `events` table
      const [event] = await trx("events")
        .insert({
          ...eventData,
          creator_id: creatorId,
        })
        .returning("*");

      // Upload to Cloudinary in parallel and insert into `event_media` table
      let mediaRecords: Array<{
        event_id: string;
        url: string;
        public_id: string;
        type: "IMAGE" | "VIDEO";
        sort_order: number;
      }> = [];

      if (files && files.length > 0) {
        mediaRecords = await Promise.all(
          files.map(async (file, index) => {
            const uploadResult = await uploadMedia(file, "events");
            const resourceType =
              uploadResult.resource_type === "video" ? "VIDEO" : "IMAGE";

            return {
              event_id: event.id,
              url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              type: resourceType,
              sort_order: index,
            };
          })
        );

        await trx("event_media").insert(mediaRecords);
      }

      // Handle tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const normalizedTag = tagName.toLowerCase().trim();
          let tag = await trx("tags").where({ name: normalizedTag }).first();

          if (!tag) {
            [tag] = await trx("tags").insert({ name: normalizedTag }).returning("*");
          }

          await trx("event_tags").insert({
            event_id: event.id,
            tag_id: tag.id,
          });
        }
      }

      return {
        ...event,
        media: mediaRecords,
      };
    });
  },

  /**
   * Retrieve paginated, filtered, and sorted list of events
   */
  getEvents: async (
    filters: Partial<FilterEventDTO> = {},
    currentUserId?: string
  ): Promise<PaginatedEventsResponse> => {
    const {
      search,
      location,
      tag,
      sort_by = "start_time",
      order = "asc",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    let query = db("events")
      .select(
        "events.*",
        db.raw(
          "count(DISTINCT CASE WHEN event_rsvps.status = 'GOING' THEN event_rsvps.id END)::integer as attending_count"
        )
      )
      .leftJoin("event_rsvps", "events.id", "event_rsvps.event_id")
      .groupBy("events.id");

    // Privacy Guard
    if (currentUserId) {
      query = query.where((builder) => {
        builder.where("is_private", false).orWhere("creator_id", currentUserId);
      });
    } else {
      query = query.where("is_private", false);
    }

    // Filters
    if (search) {
      query = query.andWhere((builder) => {
        builder
          .whereILike("events.title", `%${search}%`)
          .orWhereILike("events.description", `%${search}%`);
      });
    }

    if (location) {
      query = query.andWhereILike("events.location", `%${location}%`);
    }

    if (tag) {
      query = query
        .join("event_tags", "events.id", "event_tags.event_id")
        .join("tags", "event_tags.tag_id", "tags.id")
        .andWhere("tags.name", tag.toLowerCase());
    }

    // Dynamic Sorting Logic matching API options
    if (sort_by === "popularity") {
      query = query.orderBy("attending_count", order);
    } else if (sort_by === "created_at") {
      query = query.orderBy("events.created_at", order);
    } else if (sort_by === "capacity") {
      query = query.orderBy("events.capacity", order);
    } else {
      query = query.orderBy("events.start_time", order);
    }

    // Execute Main Event Fetch Query
    const rawEvents = await query.limit(limit).offset(offset);

    // Fetch associated media for retrieved events
    const eventIds = rawEvents.map((e) => e.id);
    const allMedia = eventIds.length
      ? await db("event_media").whereIn("event_id", eventIds).orderBy("sort_order", "asc")
      : [];

    const events: EventWithDetails[] = rawEvents.map((event) => {
      const attendingCount = parseInt(event.attending_count || "0", 10);
      const capacity = event.capacity || 0;
      const media = allMedia.filter((m) => m.event_id === event.id);

      return {
        ...event,
        media,
        attending_count: attendingCount,
        remaining_spots: capacity ? Math.max(0, capacity - attendingCount) : null,
        is_full: capacity ? attendingCount >= capacity : false,
      };
    });

    // Accurate Filtered Count
    let countQuery = db("events");
    if (currentUserId) {
      countQuery = countQuery.where((builder) => {
        builder.where("is_private", false).orWhere("creator_id", currentUserId);
      });
    } else {
      countQuery = countQuery.where("is_private", false);
    }
    if (search) {
      countQuery = countQuery.andWhere((builder) => {
        builder
          .whereILike("title", `%${search}%`)
          .orWhereILike("description", `%${search}%`);
      });
    }
    if (location) {
      countQuery = countQuery.andWhereILike("location", `%${location}%`);
    }
    if (tag) {
      countQuery = countQuery
        .join("event_tags", "events.id", "event_tags.event_id")
        .join("tags", "event_tags.tag_id", "tags.id")
        .andWhere("tags.name", tag.toLowerCase());
    }

    const totalCountResult = await countQuery.count("events.id as count").first();
    const total = parseInt((totalCountResult?.count as string) || "0", 10);

    return {
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get detailed single event by ID along with tags, media & attending stats
   */
  getEventById: async (eventId: string): Promise<EventWithDetails> => {
    const event = await db("events").where({ id: eventId }).first();
    if (!event) {
      throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
    }

    const media = await db("event_media")
      .where({ event_id: eventId })
      .orderBy("sort_order", "asc");

    const tags = await db("tags")
      .join("event_tags", "tags.id", "event_tags.tag_id")
      .where("event_tags.event_id", eventId)
      .select("tags.id", "tags.name");

    const rsvpsCount = await db("event_rsvps")
      .where({ event_id: eventId, status: "YES" })
      .count("* as count")
      .first();

    const attendingCount = parseInt((rsvpsCount?.count as string) || "0", 10);
    const capacity = event.capacity || 0;

    return {
      ...event,
      media,
      tags,
      attending_count: attendingCount,
      remaining_spots: capacity ? Math.max(0, capacity - attendingCount) : null,
      is_full: capacity ? attendingCount >= capacity : false,
    };
  },

  /**
   * Update existing event details and handle media (PUT)
   */
  updateEvent: async (
    eventId: string,
    data: UpdateEventDTO,
    files?: Express.Multer.File[]
  ) => {
    const { tags, deleted_media_ids, ...eventData } = data as UpdateEventDTO & {
      deleted_media_ids?: string[];
    };

    return await db.transaction(async (trx) => {
      // Replace event details in database
      const [updatedEvent] = await trx("events")
        .where({ id: eventId })
        .update({
          ...eventData,
          updated_at: db.fn.now(),
        })
        .returning("*");

      if (!updatedEvent) {
        throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
      }

      // Handle specific media removals requested by user
      if (
        deleted_media_ids &&
        Array.isArray(deleted_media_ids) &&
        deleted_media_ids.length > 0
      ) {
        const mediaToDelete = await trx("event_media")
          .whereIn("id", deleted_media_ids)
          .andWhere({ event_id: eventId });

        for (const item of mediaToDelete) {
          if (item.public_id) {
            await deleteMedia(item.public_id, item.type === "VIDEO" ? "video" : "image");
          }
        }

        await trx("event_media")
          .whereIn("id", deleted_media_ids)
          .andWhere({ event_id: eventId })
          .delete();
      }

      // Re-sync tags (Clear old tags and map new tags list)
      if (tags && Array.isArray(tags)) {
        await trx("event_tags").where({ event_id: eventId }).delete();

        for (const tagName of tags) {
          const normalizedTag = tagName.trim().toLowerCase();
          if (!normalizedTag) continue;

          let tagRecord = await trx("tags").where({ name: normalizedTag }).first();
          if (!tagRecord) {
            [tagRecord] = await trx("tags")
              .insert({ name: normalizedTag })
              .returning("*");
          }

          await trx("event_tags").insert({
            event_id: eventId,
            tag_id: tagRecord.id,
          });
        }
      }

      // Append newly uploaded media items concurrently
      if (files && files.length > 0) {
        const maxSortResult = await trx("event_media")
          .where({ event_id: eventId })
          .max("sort_order as maxOrder")
          .first();

        const startOrder = (maxSortResult?.maxOrder ?? -1) + 1;

        const mediaRecords = await Promise.all(
          files.map(async (file, index) => {
            const uploadResult = await uploadMedia(file, "events");
            const resourceType =
              uploadResult.resource_type === "video" ? "VIDEO" : "IMAGE";

            return {
              event_id: eventId,
              url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              type: resourceType,
              sort_order: startOrder + index,
            };
          })
        );

        await trx("event_media").insert(mediaRecords);
      }

      // Retrieve updated event with sorted media for response
      const media = await trx("event_media")
        .where({ event_id: eventId })
        .orderBy("sort_order", "asc");

      return {
        ...updatedEvent,
        media,
      };
    });
  },

  /**
   * Delete an event and clean up associated Cloudinary assets
   */
  deleteEvent: async (eventId: string) => {
    return await db.transaction(async (trx) => {
      // Fetch all associated media to retrieve Cloudinary public IDs
      const mediaList = await trx("event_media").where({ event_id: eventId });

      // Delete each media file from Cloudinary
      for (const item of mediaList) {
        if (item.public_id) {
          await deleteMedia(item.public_id, item.type === "VIDEO" ? "video" : "image");
        }
      }

      // Delete the event from DB (Cascades down to event_media, event_tags, event_rsvps)
      const deleted = await trx("events").where({ id: eventId }).del();

      if (!deleted) {
        throw new AppError("Event not found", httpCodes.NOT_FOUND.statusCode);
      }

      return { message: "Event deleted successfully" };
    });
  },
};
