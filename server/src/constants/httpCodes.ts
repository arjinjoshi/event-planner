export const httpCodes = {
  OK: { statusCode: 200, message: "OK" },
  CREATED: { statusCode: 201, message: "Created" },
  BAD_REQUEST: { statusCode: 400, message: "Bad Request" },
  UNAUTHORIZED: { statusCode: 401, message: "Unauthorized" },
  FORBIDDEN: { statusCode: 403, message: "Forbidden" },
  NOT_FOUND: { statusCode: 404, message: "Not Found" },
  CONFLICT: { statusCode: 409, message: "Conflict" },
  TOO_MANY_REQUESTS: { statusCode: 429, message: "Too Many Requests" },
  INTERNAL_SERVER_ERROR: { statusCode: 500, message: "Internal Server Error" },
} as const;

export default httpCodes;
