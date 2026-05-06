import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Centralized folder names
export const CLOUDINARY_FOLDERS = {
    SERVICE_TYPE: `${process.env.CLOUDINARY_FOLDER}/service-types`,
    SERVICE: `${process.env.CLOUDINARY_FOLDER}/services`,
    SERVICE_PARTNER: `${process.env.CLOUDINARY_FOLDER}/service_partners`,
    ADMIN: `${process.env.CLOUDINARY_FOLDER}/admin`,
  };
export default cloudinary;
