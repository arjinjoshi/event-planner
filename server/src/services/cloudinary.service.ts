import cloudinary from "../configurations/cloudinary";

export type UploadFolder = "events" | "avatars";

export interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
}

export const uploadMedia = async (
  file: Express.Multer.File,
  folder: UploadFolder = "events"
): Promise<UploadResult> => {
  const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new Error(`Cloudinary Upload Failed: ${error?.message || "Unknown error"}`)
          );
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteMedia = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
