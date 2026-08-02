import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { rsvpService } from "../services/rsvp.service";
import { successResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import { CreateRsvpDTO, EventIdParamDTO } from "../schemas/rsvp.schema";
import { AppError } from "../utils/customError";

export const rsvpController = {
  /**
   * Create a new RSVP
   */
  createRsvp: async (
    req: ValidatedRequest<CreateRsvpDTO, unknown, EventIdParamDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const eventId = req.validated?.params?.eventId || (req.params.eventId as string);
      if (!eventId) {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const result = await rsvpService.createRsvp(
        eventId,
        req.user.id,
        req.validated!.body!
      );

      return successResponse(res, {
        status: httpCodes.CREATED.statusCode,
        message: "RSVP created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing RSVP
   */
  updateRsvp: async (
    req: ValidatedRequest<CreateRsvpDTO, unknown, EventIdParamDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const eventId = req.validated?.params?.eventId || (req.params.eventId as string);
      if (!eventId) {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const result = await rsvpService.updateRsvp(
        eventId,
        req.user.id,
        req.validated!.body!
      );

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "RSVP updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all RSVPs for an event
   */
  getEventRsvps: async (
    req: ValidatedRequest<unknown, unknown, EventIdParamDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const eventId = req.validated?.params?.eventId || (req.params.eventId as string);
      if (!eventId) {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const result = await rsvpService.getEventRsvps(eventId);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Event RSVPs retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all RSVPs for the logged-in user
   */
  getUserRsvps: async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const result = await rsvpService.getUserRsvps(req.user.id);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "User RSVPs retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel an RSVP
   */
  cancelRsvp: async (
    req: ValidatedRequest<unknown, unknown, EventIdParamDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const eventId = req.validated?.params?.eventId || (req.params.eventId as string);
      if (!eventId) {
        throw new AppError("Event ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const result = await rsvpService.cancelRsvp(eventId, req.user.id);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: result.message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
