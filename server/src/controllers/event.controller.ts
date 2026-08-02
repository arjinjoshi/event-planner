import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { eventService } from "../services/event.service";
import { successResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import { CreateEventDTO, FilterEventDTO, UpdateEventDTO } from "../schemas/event.schema";
import { AppError } from "../utils/customError";

export const eventController = {
  /**
   * Create a new event
   */
  createEvent: async (
    req: ValidatedRequest<CreateEventDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const result = await eventService.createEvent(
        req.user.id,
        req.validated!.body!,
        files
      );

      return successResponse(res, {
        status: httpCodes.CREATED.statusCode,
        message: "Event created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve paginated & filtered events
   */
  getEvents: async (
    req: ValidatedRequest<unknown, FilterEventDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters = req.validated?.query || {};
      const result = await eventService.getEvents(filters, req.user?.id);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Events retrieved successfully",
        data: result.events,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve single event details
   */
  getEventById: async (
    req: ValidatedRequest<unknown, unknown, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const eventId = req.validated?.params?.id;
      if (!eventId) {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const result = await eventService.getEventById(eventId);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Event details retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Replace/Update event details
   */
  updateEvent: async (
    req: ValidatedRequest<UpdateEventDTO, unknown, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const rawId = req.validated?.params?.id || req.params.id;
      const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!eventId || typeof eventId !== "string") {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const bodyData = req.validated?.body || req.body;
      if (!bodyData) {
        throw new AppError(
          "Event details are required",
          httpCodes.BAD_REQUEST.statusCode
        );
      }

      const files = req.files as Express.Multer.File[] | undefined;

      const result = await eventService.updateEvent(eventId, bodyData, files);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Event updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an event
   */
  deleteEvent: async (
    req: ValidatedRequest<unknown, unknown, { id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const rawId = req.validated?.params?.id || req.params.id;

      const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!eventId || typeof eventId !== "string") {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      await eventService.deleteEvent(eventId);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Event deleted successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
