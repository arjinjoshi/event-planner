import morgan, { StreamOptions } from "morgan";
import { logger } from "../configurations/logger";

// Stream Morgan output directly into Winston's 'http' severity log
const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

// Skip HTTP request logging during test runs to keep test output clean
const skip = (): boolean => {
  const env = process.env.NODE_ENV || "development";
  return env === "test";
};

// Morgan format string for method, route path, status code, response time, and content length
export const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);
