import multer from "multer";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";

const storage = multer.memoryStorage();

// File size limits in bytes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30 MB

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Set Multer max limit to the higher bound (30MB)
  },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      return cb(
        new AppError(
          "Invalid file type. Only images and videos are allowed!",
          httpCodes.BAD_REQUEST.statusCode
        )
      );
    }

    // Check size limit per specific file type
    const fileSize = parseInt(_req.headers["content-length"] || "0", 10);

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      return cb(
        new AppError(
          `Image size exceeds the 5 MB limit.`,
          httpCodes.BAD_REQUEST.statusCode
        )
      );
    }

    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      return cb(
        new AppError(
          `Video size exceeds the 30 MB limit.`,
          httpCodes.BAD_REQUEST.statusCode
        )
      );
    }

    cb(null, true);
  },
});
