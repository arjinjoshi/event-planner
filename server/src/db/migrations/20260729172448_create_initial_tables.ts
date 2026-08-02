import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Users Table
  await knex.schema.createTable("users", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("name").notNullable();
    table.string("avatar_url").nullable();
    table.string("phone_number", 20).nullable();

    // Advanced Auth Flags
    table.boolean("is_email_verified").defaultTo(false);
    table.boolean("is_two_factor_enabled").defaultTo(false);
    table.string("two_factor_secret").nullable();

    table.timestamps(true, true);
  });

  // 2. Refresh Tokens Table
  await knex.schema.createTable("refresh_tokens", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("token_hash").notNullable().unique();
    table.boolean("is_revoked").defaultTo(false);
    table.timestamp("expires_at").notNullable();
    table.timestamps(true, true);
  });

  // 3. Email Verification Tokens Table
  await knex.schema.createTable(
    "email_verifications",
    (table: Knex.CreateTableBuilder) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.string("token").notNullable().unique();
      table.timestamp("expires_at").notNullable();
      table.timestamps(true, true);
    }
  );

  // 4. Events Table
  await knex.schema.createTable("events", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("creator_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title").notNullable();
    table.text("description").notNullable();
    table.timestamp("start_time").notNullable();
    table.timestamp("end_time").notNullable();
    table.string("location").notNullable();
    table.integer("capacity").notNullable();
    table.boolean("is_private").defaultTo(false);
    table.timestamps(true, true);

    table.index(["start_time"], "idx_events_start_time");
    table.index(["is_private"], "idx_events_is_private");
    table.index(["created_at"], "idx_events_created_at");
  });

  // 5. Event Media Table (Multiple Images / Short Videos per Event)
  await knex.schema.createTable("event_media", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("event_id")
      .notNullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table.string("url").notNullable();
    table.enum("type", ["IMAGE", "VIDEO"]).notNullable().defaultTo("IMAGE");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(["event_id"], "idx_event_media_event_id");
  });

  // 6. Event RSVPs Table
  await knex.schema.createTable("event_rsvps", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("event_id")
      .notNullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.enum("status", ["YES", "NO", "MAYBE"]).notNullable();
    table.timestamps(true, true);

    table.unique(["event_id", "user_id"]);
  });

  // 7. Tags Table
  await knex.schema.createTable("tags", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable().unique();
  });

  // 8. Event_Tags Junction Table
  await knex.schema.createTable("event_tags", (table: Knex.CreateTableBuilder) => {
    table
      .uuid("event_id")
      .notNullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table
      .uuid("tag_id")
      .notNullable()
      .references("id")
      .inTable("tags")
      .onDelete("CASCADE");
    table.primary(["event_id", "tag_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("event_tags");
  await knex.schema.dropTableIfExists("tags");
  await knex.schema.dropTableIfExists("event_rsvps");
  await knex.schema.dropTableIfExists("event_media");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("email_verifications");
  await knex.schema.dropTableIfExists("refresh_tokens");
  await knex.schema.dropTableIfExists("users");
}
