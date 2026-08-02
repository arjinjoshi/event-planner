import knex from "knex";
import config from "../../knexfile";
import { logger } from "./logger";

const environment = process.env.NODE_ENV || "development";
const dbConfig = config[environment] ?? config["development"];

if (!dbConfig) {
  throw new Error(`Knex configuration for environment "${environment}" was not found.`);
}

export const db = knex(dbConfig);

// Function to test connection and exit if it fails
export const connectDB = async () => {
  try {
    // Run a basic ping query to test PostgreSQL connectivity
    await db.raw("SELECT 1");
    logger.info("Connected to PostgreSQL DB successfully");
  } catch (error) {
    logger.error("Error connecting to PostgreSQL Database:", error);
    process.exit(1); // Stop Node.js process immediately
  }
};
