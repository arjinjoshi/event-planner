import { z } from "zod";

/**
 * Base Event Schema
 */
const BaseEventObject = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  start_time: z.iso.datetime({
    message: "Invalid start time date format (ISO 8601 required)",
  }),
  end_time: z.iso.datetime({
    message: "Invalid end time date format (ISO 8601 required)",
  }),
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
    }, z.array(z.string()))
    .optional(),
});

export const CreateEventSchema = BaseEventObject.extend({
  is_private: BaseEventObject.shape.is_private.default(false),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: "End time must be strictly after start time",
  path: ["end_time"],
});

export const UpdateEventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    start_time: z.iso.datetime({
      message: "Invalid start time date format (ISO 8601 required)",
    }),
    end_time: z.iso.datetime({
      message: "Invalid end time date format (ISO 8601 required)",
    }),
    location: z.string().min(2, "Location is required"),
    capacity: z.coerce
      .number()
      .int("Capacity must be an integer")
      .positive("Capacity must be greater than 0"),
    is_private: z.preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return val;
    }, z.boolean()),
    tags: z
      .preprocess((val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      }, z.array(z.string().min(1)))
      .default([]),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "End time must be strictly after start time",
    path: ["end_time"],
  });

export type UpdateEventDTO = z.infer<typeof UpdateEventSchema>;

/**
 * Query Filter Schema - Updated is_private preprocessor
 */
export const FilterEventSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  tag: z.string().optional(),
  is_private: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  sort_by: z
    .enum(["start_time", "created_at", "capacity", "popularity"])
    .default("start_time"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export const EventIdParamSchema = z.object({
  id: z.string({ message: "Invalid Event ID format" }),
});

export type CreateEventDTO = z.infer<typeof CreateEventSchema>;
export type FilterEventDTO = z.infer<typeof FilterEventSchema>;
export type EventIdParamDTO = z.infer<typeof EventIdParamSchema>;