import { Readable } from 'stream';
import fs from 'fs';
import cloudinary, { CLOUDINARY_FOLDERS } from '../configs/cloudnary';
import { ProfileImageResponse } from '@/interfaces/servicePartner.interface';


const getResourceType = (file: Express.Multer.File | string): "image" | "video" | "raw" => {
  if (typeof file !== "string" && file.mimetype) {
    if (file.mimetype.startsWith("image/")) return "image";
    if (file.mimetype.startsWith("video/")) return "video";
    return "raw"; // pdf, doc, csv, xml, etc.
  }
  return "raw";
};

export const uploadImage = async (
  file: Express.Multer.File | Readable | string,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    // Always treat SVG as image for display
    let resourceType: "image" | "video" | "raw" = "raw";

    if (typeof file !== "string" && "mimetype" in file) {
      resourceType = getResourceType(file);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result!.secure_url, publicId: result!.public_id });
      }
    );

    // Handle different file inputs
    if (typeof file === "string") {
      fs.createReadStream(file).pipe(uploadStream);
    } else if (file instanceof Readable) {
      file.pipe(uploadStream);
    } else if ((file as Express.Multer.File).buffer) {
      uploadStream.end((file as Express.Multer.File).buffer);
    } else if ((file as Express.Multer.File).path) {
      fs.createReadStream((file as Express.Multer.File).path).pipe(uploadStream);
    } else {
      reject(new Error("Invalid file format: No buffer, path or stream found"));
    }
  });
};

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return result;
  } catch (err) {
    throw new Error('Failed to delete image from Cloudinary');
  }
};

export const getCloudinaryThumbnail = (
  url: string,
  width = 150,
  height = 150
): string => {
  return url.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_fill/`
  );
};

export { CLOUDINARY_FOLDERS };