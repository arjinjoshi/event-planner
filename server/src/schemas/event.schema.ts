import { z } from "zod";

/**
 * Base Event Schema - Defensively defined without .nullable()
 * Any explicit null sent for these fields will trigger an immediate Zod validation error.
 */
const BaseEventObject = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),

  description: z.string().min(10, "Description must be at least 10 characters"),

  start_time: z.iso.datetime({
    message: "Invalid start time date format (ISO 8601 required)",
  }),

  end_time: z
    .iso
    .datetime({ message: "Invalid end time date format (ISO 8601 required)" }),

  location: z.string().min(2, "Location is required"),

  capacity: z.coerce
    .number()
    .int("Capacity must be an integer")
    .positive("Capacity must be greater than 0")
    .optional(),

  is_private: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return val;
    }, z.boolean())
    .default(false),
  tags: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      },
      z.array(z.string().min(1))
    )
    .optional(),

  deleted_media_ids: z
    .preprocess((val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.array(z.string().uuid()))
    .optional(),
});

/**
 * Create Event Schema
 * Requires all non-optional base fields and sets is_private default to false
 */
export const CreateEventSchema = BaseEventObject.extend({
  is_private: BaseEventObject.shape.is_private.default(false),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: "End time must be strictly after start time",
  path: ["end_time"],
});

/**
 * Update Event Schema (PUT)
 */
// For PUT requests: both start_time and end_time are guaranteed to exist
export const UpdateEventSchema = BaseEventObject.refine(
  (data) => new Date(data.end_time) > new Date(data.start_time),
  {
    message: "End time must be strictly after start time",
    path: ["end_time"],
  }
);

/**
 * Query Filter Schema
 */
export const FilterEventSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  tag: z.string().optional(),
  is_private: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  sort_by: z
    .enum(["start_time", "created_at", "capacity", "popularity"])
    .default("start_time"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export const EventIdParamSchema = z.object({
  id: z.uuid({ message: "Invalid Event ID format" }),
});

// Inferred DTO Types
export type CreateEventDTO = z.infer<typeof CreateEventSchema>;
export type UpdateEventDTO = z.infer<typeof UpdateEventSchema>;
export type FilterEventDTO = z.infer<typeof FilterEventSchema>;
export type EventIdParamDTO = z.infer<typeof EventIdParamSchema>;
