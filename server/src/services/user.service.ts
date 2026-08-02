import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import { UserResponse, UpdateProfileRequest } from "../interfaces/user.interface";
import { uploadMedia, deleteMedia } from "./cloudinary.service";
import { db } from "../configurations/db";

// Sanitizes user objects before returning to controllers
export const sanitizeUser = (user: any): UserResponse => {
  const { password_hash, two_factor_secret, avatar_public_id, ...sanitized } = user;
  return sanitized;
};

export const userService = {
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
        // Delete existing avatar from Cloudinary using saved avatar_public_id
        if (user.avatar_public_id) {
          await deleteMedia(user.avatar_public_id, "image");
        }

        // Upload new avatar buffer to Cloudinary
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
