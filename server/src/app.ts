import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index";
import { AppError } from "./utils/customError";
import httpCodes from "./constants/httpCodes";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { swaggerSpec } from "./configurations/swagger";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { morganMiddleware } from "./middleware/morgan.middleware";

const app: Application = express();

// Enable reverse proxy support (required for Cloudflare, Nginx, Render, Heroku to extract real IPs)
app.set("trust proxy", 1);

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging Middleware (Morgan + Winston)
app.use(morganMiddleware);

// Global Rate Limiting (100 requests per 15 minutes across all /api routes)
app.use("/api", apiLimiter);

// API Documentation Endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Central API Routes
app.use("/api/v1", routes);

// 404 Handler for Unmatched Routes
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", httpCodes.NOT_FOUND.statusCode));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
