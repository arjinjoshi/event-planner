import request from "supertest";
import app from "../src/app";
import { db } from "../src/configurations/db";

const API_PREFIX = "/api/v1";

describe("Event Routes", () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let createdEventId: string;

  beforeAll(async () => {
    const phoneA = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const phoneB = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    // Setup User A (Owner)
    const userARes = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        email: `event_creator_${Date.now()}_a@example.com`,
        password: "SecurePass123!",
        name: "Creator User",
        phone_number: phoneA,
      });

    userAId = userARes.body.data.user.id;
    userAToken = userARes.body.data.tokens?.accessToken || userARes.body.data.accessToken;

    // Setup User B (Non-Owner)
    const userBRes = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        email: `non_owner_${Date.now()}_b@example.com`,
        password: "SecurePass123!",
        name: "Other User",
        phone_number: phoneB,
      });

    userBId = userBRes.body.data.user.id;
    userBToken = userBRes.body.data.tokens?.accessToken || userBRes.body.data.accessToken;

    // Verify both users in database to satisfy requireEmailVerified guard
    await db("users").whereIn("id", [userAId, userBId]).update({ is_email_verified: true });
  }, 20000);

  afterAll(async () => {
    if (createdEventId) await db("events").where({ id: createdEventId }).del();
    if (userAId) await db("users").where({ id: userAId }).del();
    if (userBId) await db("users").where({ id: userBId }).del();
  });

  describe(`POST ${API_PREFIX}/events`, () => {
    it("should create a new event when authenticated and verified", async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 172800000).toISOString();

      const res = await request(app)
        .post(`${API_PREFIX}/events`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          title: "Tech Developers Summit 2026",
          description: "Annual conference for modern backend engineering.",
          location: "Tech Park Convention Center, Hall A",
          start_time: startTime,
          end_time: endTime,
          capacity: 10,
          is_private: false,
          tags: ["tech", "backend"],
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);

      const eventData = res.body.data.event || res.body.data;
      createdEventId = eventData.id;
      expect(createdEventId).toBeDefined();
    });
  });

  describe(`GET ${API_PREFIX}/events`, () => {
    it("should list filtered & paginated events (Public)", async () => {
      const res = await request(app)
        .get(`${API_PREFIX}/events`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe(`GET ${API_PREFIX}/events/:id`, () => {
    it("should retrieve a single event by ID (Public)", async () => {
      expect(createdEventId).toBeDefined();

      const res = await request(app).get(`${API_PREFIX}/events/${createdEventId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const eventData = res.body.data.event || res.body.data;
      expect(eventData.id).toBe(createdEventId);
    });
  });

  describe(`PUT ${API_PREFIX}/events/:id (Ownership Guard)`, () => {
    it("should block non-owner (User B) from updating Event created by User A with 403", async () => {
      expect(createdEventId).toBeDefined();

      const res = await request(app)
        .put(`${API_PREFIX}/events/${createdEventId}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          title: "Hacked Title Attempt",
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 172800000).toISOString(),
          description: "Attempting illegal edit.",
          location: "Unknown Location",
        });

      expect(res.status).toBe(403);
    });

    it("should allow owner (User A) to update Event", async () => {
      expect(createdEventId).toBeDefined();

      const startTime = new Date(Date.now() + 86400000).toISOString();
      const endTime = new Date(Date.now() + 172800000).toISOString();

      const res = await request(app)
        .put(`${API_PREFIX}/events/${createdEventId}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          title: "Tech Developers Summit 2026 - Extended Edition",
          description: "Online live coding and architecture session.",
          location: "Zoom Meeting Link",
          start_time: startTime,
          end_time: endTime,
          capacity: 15,
          is_private: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedData = res.body.data.event || res.body.data;
      expect(updatedData.id).toBe(createdEventId);
      expect(updatedData.title).toBe("Tech Developers Summit 2026 - Extended Edition");
    });
  });
});