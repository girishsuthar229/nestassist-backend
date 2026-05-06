import multer from "multer";
import os from "os";
import { ApiError } from "../utils/apiError.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import {
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
  ALLOWED_IMAGE_AND_DOC_TYPES,
  IMAGE_FILE_SIZE,
} from "@/constants";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_COUNT,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ALLOWED_IMAGE_AND_DOC_TYPES;
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(
          STATUS_CODE.BAD_REQUEST,
          MESSAGES.COMMON.ONLY_IMAGES_PDFS_AND_WORD_DOCS_ALLOWED
        ) as any,
        false
      );
    }
    cb(null, true);
  },
});

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: IMAGE_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(
          STATUS_CODE.BAD_REQUEST,
          MESSAGES.COMMON.ONLY_IMAGES_JPG_PNG_AND_SVG_ALLOWED
        ) as any,
        false
      );
    }
    cb(null, true);
  },
});
