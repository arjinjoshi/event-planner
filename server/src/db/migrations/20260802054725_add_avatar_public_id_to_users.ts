import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table: Knex.CreateTableBuilder) => {
    table.string("avatar_public_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table: Knex.CreateTableBuilder) => {
    table.dropColumn("avatar_public_id");
  });
}
