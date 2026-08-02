// Import the base UserResponse directly from auth interface
import { UserResponse } from "./auth.interface";

export type { UserResponse };

/**
 * Payload interface for updating user profile
 */
export interface UpdateProfileRequest {
  name?: string;
  phone_number?: string | null;
}

/**
 * Parameter interface for user ID routes (e.g. GET /users/:id)
 */
export interface UserIdParam {
  id: string;
}

/**
 * Extended response interface
 */
export interface ExtendedUserResponse extends UserResponse {
  updated_at: string;
}
