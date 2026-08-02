import winston from "winston";
import path from "path";

// Define log levels and associated colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Determine current environment log level
const level = (): string => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "warn";
};

// Custom log format for readable output
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)
);

// Define log storage locations
const transports = [
  // Output colorized logs to console
  new winston.transports.Console(),
  // Write all error logs to logs/error.log
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
  }),
  // Write all system logs to logs/combined.log
  new winston.transports.File({
    filename: path.join("logs", "combined.log"),
  }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});
