import { UserResponse } from "./auth.interface";

export type { UserResponse };

/**
 * User object returned in list queries with event counts included
 */
export interface UserWithEventCountResponse extends UserResponse {
  events_count: number;
}

/**
 * Generic Paginated Response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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
 * Query interface for user search and pagination
 */
export interface GetUsersQuery {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
}

/**
 * Extended response interface
 */
export interface ExtendedUserResponse extends UserResponse {
  updated_at: string;
}