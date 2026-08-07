import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/configurations/db";

// Mock Cloudinary service using Vitest
vi.mock("../src/services/cloudinary.service", () => ({
  uploadMedia: vi.fn().mockResolvedValue({
    secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    public_id: "avatars/sample_id",
  }),
  deleteMedia: vi.fn().mockResolvedValue({ result: "ok" }),
}));

const API_PREFIX = "/api/v1";

describe("User Profile Routes", () => {
  let accessToken: string;
  let testUserId: string;

  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const initialPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const testUser = {
    email: `user_test_${uniqueId}@example.com`,
    password: "SecurePass123!",
    name: "John Profile",
    phone_number: initialPhone,
  };

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send(testUser);

    if (res.body.data) {
      accessToken = res.body.data.tokens?.accessToken || res.body.data.accessToken;
      testUserId = res.body.data.user?.id || res.body.data.id;
    } else {
      throw new Error(`User registration failed during beforeAll: ${JSON.stringify(res.body)}`);
    }
  });

  afterAll(async () => {
    if (testUserId) {
      await db("users").where({ id: testUserId }).del();
    }
    await db.destroy();
  });

  describe("GET /users/me", () => {
    it("should retrieve current logged-in user profile", async () => {
      const res = await request(app)
        .get(`${API_PREFIX}/users/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data).not.toHaveProperty("password_hash");
    });

    it("should return 401 when token is missing", async () => {
      const res = await request(app).get(`${API_PREFIX}/users/me`);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /users/:id", () => {
    it("should retrieve public profile by user ID", async () => {
      const res = await request(app)
        .get(`${API_PREFIX}/users/${testUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
    });

    it("should return 404 for non-existent user UUID", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await request(app)
        .get(`${API_PREFIX}/users/${fakeUuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /users/me", () => {
    it("should update profile text fields", async () => {
      const updatedPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const res = await request(app)
        .patch(`${API_PREFIX}/users/me`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Jane Updated",
          phone_number: updatedPhone,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Jane Updated");
    });
  });

  describe("DELETE /users/me/avatar", () => {
    it("should successfully process avatar removal", async () => {
      const res = await request(app)
        .delete(`${API_PREFIX}/users/me/avatar`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar_url).toBeNull();
    });
  });
});