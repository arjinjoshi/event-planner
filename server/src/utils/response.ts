import { Response } from "express";
import httpCodes from "../constants/httpCodes";

interface SuccessParams {
  status?: number;
  message?: string | null;
  meta?: any;
  data?: any;
}

interface ErrorParams {
  status?: number;
  message?: string | null;
  code?: string;
  details?: any;
}

export const successResponse = (
  res: Response,
  {
    status = httpCodes.OK.statusCode,
    message = null,
    meta = null,
    data = null,
  }: SuccessParams = {}
) => {
  return res.status(status).json({
    success: true,
    data,
    message,
    meta,
  });
};

export const errorResponse = (
  res: Response,
  {
    status = httpCodes.INTERNAL_SERVER_ERROR.statusCode,
    message = "Something went wrong",
    code = httpCodes.INTERNAL_SERVER_ERROR.message,
    details = null,
  }: ErrorParams = {}
) => {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: {
      code,
      details,
    },
  });
};
