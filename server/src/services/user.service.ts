import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import {
  UserResponse,
  UpdateProfileRequest,
  UserWithEventCountResponse,
  PaginatedResponse,
  GetUsersQuery,
} from "../interfaces/user.interface";
import { uploadMedia, deleteMedia } from "./cloudinary.service";
import { db } from "../configurations/db";

// Sanitizes user objects before returning to controllers
export const sanitizeUser = (user: Record<string, any>): UserResponse => {
  const { password_hash, two_factor_secret, avatar_public_id, ...sanitized } = user;
  return sanitized as UserResponse;
};

export const userService = {
  /**
   * Get all users with search, pagination, and event count
   */
  getAllUsers: async (
    queryParams: GetUsersQuery
  ): Promise<PaginatedResponse<UserWithEventCountResponse>> => {
    const page = Math.max(1, Number(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryParams.limit) || 10));
    const offset = (page - 1) * limit;
    const search = queryParams.search?.trim();

    // Base query builder for filtering
    const baseQuery = () =>
      db("users").modify((query) => {
        if (search) {
          query.where((builder) => {
            builder
              .whereILike("users.name", `%${search}%`)
              .orWhereILike("users.email", `%${search}%`);
          });
        }
      });

    // 1. Get total record count for pagination metadata (Safely typed with .first())
    const countRow = await baseQuery()
      .count<{ count: string | number }>("* as count")
      .first();
    const total = Number(countRow?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // 2. Fetch paginated users with subquery counting created events
    const users = await baseQuery()
      .select([
        "users.id",
        "users.email",
        "users.name",
        "users.phone_number",
        "users.avatar_url",
        "users.is_email_verified",
        "users.is_two_factor_enabled",
        "users.created_at",
        "users.updated_at",
        db.raw(
          "(SELECT COUNT(*)::integer FROM events WHERE events.creator_id = users.id) as events_count"
        ),
      ])
      .orderBy("users.created_at", "desc")
      .limit(limit)
      .offset(offset);

    // Explicitly type `user` in map callback
    const sanitizedUsers: UserWithEventCountResponse[] = users.map((user: Record<string, any>) => ({
      ...sanitizeUser(user),
      events_count: Number(user.events_count || 0),
    }));

    return {
      data: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Get all events created by a specific user
   */
  getUserEvents: async (
    userId: string,
    pageVal: number = 1,
    limitVal: number = 10
  ): Promise<PaginatedResponse<any>> => {
    // 1. Check if user exists
    const user = await db("users").where({ id: userId }).first();
    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    const page = Math.max(1, Number(pageVal) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitVal) || 10));
    const offset = (page - 1) * limit;

    // 2. Count user's total events (Safely typed with .first())
    const countRow = await db("events")
      .where({ creator_id: userId })
      .count<{ count: string | number }>("* as count")
      .first();

    const total = Number(countRow?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // 3. Fetch events with media items attached
    const events = await db("events")
      .where({ creator_id: userId })
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    // Optional: Fetch media attachments for returned events
    // Fetch media attachments for returned events
    const eventIds = events.map((event: Record<string, any>) => event.id);
    let mediaMap: Record<string, any[]> = {};

    if (eventIds.length > 0) {
      const mediaList = await db("event_media")
        .whereIn("event_id", eventIds)
        .orderBy("sort_order", "asc");

      mediaMap = mediaList.reduce((acc: Record<string, any[]>, media: Record<string, any>) => {
        (acc[media.event_id] ??= []).push(media);
        return acc;
      }, {});
    }

    const eventsWithMedia = events.map((event: Record<string, any>) => ({
      ...event,
      media: mediaMap[event.id] || [],
    }));

    return {
      data: eventsWithMedia,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Get logged-in user profile
   */
  getProfile: async (userId: string): Promise<UserResponse> => {
    const user = await db("users").where({ id: userId }).first();

    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    return sanitizeUser(user);
  },

  /**
   * Get public details of a user by ID
   */
  getUserById: async (userId: string): Promise<UserResponse> => {
    const user = await db("users").where({ id: userId }).first();

    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    return sanitizeUser(user);
  },

  /**
   * Update profile text fields and/or avatar via Cloudinary
   */
  updateProfile: async (
    userId: string,
    data: UpdateProfileRequest,
    file?: Express.Multer.File
  ): Promise<UserResponse> => {
    const user = await db("users").where({ id: userId }).first();

    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    const updateData: Record<string, any> = {};

    if (data.name) updateData.name = data.name;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;

    if (file) {
      try {
        if (user.avatar_public_id) {
          await deleteMedia(user.avatar_public_id, "image");
        }

        const uploadResult = await uploadMedia(file, "avatars");
        updateData.avatar_url = uploadResult.secure_url;
        updateData.avatar_public_id = uploadResult.public_id;
      } catch (error: any) {
        throw new AppError(
          `Failed to upload avatar: ${error.message}`,
          httpCodes.INTERNAL_SERVER_ERROR.statusCode
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(
        "No valid fields provided for update",
        httpCodes.BAD_REQUEST.statusCode
      );
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db("users")
      .where({ id: userId })
      .update(updateData)
      .returning("*");

    return sanitizeUser(updatedUser);
  },

  /**
   * Remove avatar URL and delete file from Cloudinary
   */
  removeAvatar: async (userId: string): Promise<UserResponse> => {
    const user = await db("users").where({ id: userId }).first();

    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    if (user.avatar_public_id) {
      await deleteMedia(user.avatar_public_id, "image");
    }

    const [updatedUser] = await db("users")
      .where({ id: userId })
      .update({
        avatar_url: null,
        avatar_public_id: null,
        updated_at: new Date(),
      })
      .returning("*");

    return sanitizeUser(updatedUser);
  },
};