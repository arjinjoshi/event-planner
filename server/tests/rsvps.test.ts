import request from "supertest";
import app from "../src/app";
import { db } from "../src/configurations/db";

const API_PREFIX = "/api/v1";

describe("RSVP Routes", () => {
  let userToken: string;
  let userId: string;
  let eventId: string;

  beforeAll(async () => {
    const userPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const userRes = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        email: `rsvp_user_${Date.now()}@example.com`,
        password: "SecurePass123!",
        name: "RSVP Tester",
        phone_number: userPhone,
      });

    userId = userRes.body.data.user.id;
    userToken = userRes.body.data.tokens?.accessToken || userRes.body.data.accessToken;

    // Verify user in database to satisfy requireEmailVerified guard
    await db("users").where({ id: userId }).update({ is_email_verified: true });

    const eventRes = await request(app)
      .post(`${API_PREFIX}/events`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "RSVP Test Conference",
        description: "Testing RSVP state management.",
        location: "Virtual",
        start_time: "2026-11-01T10:00:00Z",
        end_time: "2026-11-01T12:00:00Z",
        capacity: 10,
        is_private: false,
      });

    const eventData = eventRes.body.data.event || eventRes.body.data;
    eventId = eventData.id;
  });

  afterAll(async () => {
    if (eventId) {
      await db("event_rsvps").where({ event_id: eventId }).del();
      await db("events").where({ id: eventId }).del();
    }
    if (userId) await db("users").where({ id: userId }).del();
  });

  describe(`POST ${API_PREFIX}/rsvps/events/:eventId (Strict Create)`, () => {
    it("should successfully create an RSVP", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/rsvps/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "YES" });

      expect([200, 201]).toContain(res.status);

      const rsvpData = res.body.data.rsvp || res.body.data;
      expect(rsvpData.status).toBe("YES");
    });

    it("should return 400 or 409 Conflict if user tries to POST twice for the same event", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/rsvps/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "YES" });

      expect([400, 409]).toContain(res.status);
    });
  });

  describe(`PATCH ${API_PREFIX}/rsvps/events/:eventId (Strict Update)`, () => {
    it("should update existing RSVP status from YES to MAYBE", async () => {
      const res = await request(app)
        .patch(`${API_PREFIX}/rsvps/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "MAYBE" });

      expect(res.status).toBe(200);

      const rsvpData = res.body.data.rsvp || res.body.data;
      expect(rsvpData.status).toBe("MAYBE");
    });
  });

  describe(`GET ${API_PREFIX}/rsvps/me`, () => {
    it("should list logged-in user RSVPs", async () => {
      const res = await request(app)
        .get(`${API_PREFIX}/rsvps/me`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe(`DELETE ${API_PREFIX}/rsvps/events/:eventId`, () => {
    it("should cancel/delete user RSVP", async () => {
      const res = await request(app)
        .delete(`${API_PREFIX}/rsvps/events/${eventId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });
});