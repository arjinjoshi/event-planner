import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_media", (table: Knex.CreateTableBuilder) => {
    // Add nullable public_id column so existing records won't break
    table.string("public_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_media", (table: Knex.CreateTableBuilder) => {
    table.dropColumn("public_id");
  });
}
