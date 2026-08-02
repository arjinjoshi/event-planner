// vitest.global-setup.ts
import { db } from "./src/configurations/db";

export function setup() {
  // runs before all test files start
}

export async function teardown() {
  // Runs after all test files finish
  await db.destroy();
}