import request from "supertest";
import app from "../src/app";
import { db } from "../src/configurations/db";

const API_PREFIX = "/api/v1";

describe("Health Check & Auth Routes", () => {
  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;

  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const randomPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const testUser = {
    email: `auth_test_${uniqueId}@example.com`,
    password: "SecurePass123!",
    name: "John Test",
    phone_number: randomPhone,
  };

  afterAll(async () => {
    if (testUserId) {
      // Clean up child tables first to respect FK constraints
      await db("email_verifications").where({ user_id: testUserId }).del();
      await db("refresh_tokens").where({ user_id: testUserId }).del();
      await db("users").where({ id: testUserId }).del();
    }
    await db.destroy(); // Close DB connection pool after tests
  });

  describe(`GET ${API_PREFIX}/health`, () => {
    it("should return 200 OK for health check", async () => {
      const res = await request(app).get(`${API_PREFIX}/health`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
    });
  });

  describe(`POST ${API_PREFIX}/auth/register`, () => {
    it("should successfully register a new user", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/register`)
        .send(testUser);

      expect([200, 201]).toContain(res.status);
      expect(res.body.data.user).toHaveProperty("id");
      expect(res.body.data.user.email).toBe(testUser.email);

      testUserId = res.body.data.user.id;
      accessToken = res.body.data.tokens?.accessToken || res.body.data.accessToken;
      refreshToken = res.body.data.tokens?.refreshToken || res.body.data.refreshToken;
    });

    it("should return 400 or 409 Bad Request on duplicate email", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/register`)
        .send(testUser);

      expect([400, 409]).toContain(res.status);
    });
  });

  describe(`POST ${API_PREFIX}/auth/resend-verification`, () => {
    it("should successfully trigger a resend verification email request", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/resend-verification`)
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it("should return 200 generic message even if email does not exist (anti-enumeration)", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/resend-verification`)
        .send({ email: `nonexistent_${uniqueId}@example.com` });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("If an account exists");
    });
  });

  describe(`POST ${API_PREFIX}/auth/verify-email`, () => {
    it("should return 400 when an invalid OTP token is passed", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/verify-email`)
        .send({
          email: testUser.email,
          token: "000000",
        });

      expect(res.status).toBe(400);
    });
  });

  describe(`POST ${API_PREFIX}/auth/login`, () => {
    it("should successfully log in with valid credentials", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      const tokens = res.body.data.tokens || res.body.data;
      expect(tokens).toHaveProperty("accessToken");
    });

    it("should return 401 Unauthorized for wrong password", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: testUser.email,
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
    });
  });

  describe(`POST ${API_PREFIX}/auth/refresh`, () => {
    it("should issue a new access token using valid refresh token", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      const tokenData = res.body.data.tokens || res.body.data;
      expect(tokenData).toHaveProperty("accessToken");
    });
  });

  describe(`PATCH ${API_PREFIX}/auth/toggle-2fa`, () => {
    it("should return 401 Unauthorized if no Bearer token is provided", async () => {
      const res = await request(app)
        .patch(`${API_PREFIX}/auth/toggle-2fa`)
        .send({ enable: true });

      expect(res.status).toBe(401);
    });

    it("should toggle 2FA setting when authenticated", async () => {
      const res = await request(app)
        .patch(`${API_PREFIX}/auth/toggle-2fa`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ enable: true });

      expect(res.status).toBe(200);
    });
  });
});