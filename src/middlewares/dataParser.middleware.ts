import { Request, Response, NextFunction } from "express";
import { parseJsonArray, parseNumber } from "@/utils/common.utils";

/**
 * Middleware to parse stringified JSON arrays and numbers from FormData.
 * This should be placed AFTER multer but BEFORE validation.
 */
export const partnerDataParser = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    // Parse arrays
    if (req.body.education) req.body.education = parseJsonArray(req.body.education);
    if (req.body.professional) req.body.professional = parseJsonArray(req.body.professional);
    if (req.body.skills) req.body.skills = parseJsonArray(req.body.skills);
    if (req.body.servicesOffered) req.body.servicesOffered = parseJsonArray(req.body.servicesOffered);
    if (req.body.languages) req.body.languages = parseJsonArray(req.body.languages);

    // Parse numbers
    if (req.body.applyingFor) {
      const raw = req.body.applyingFor;
      req.body.applyingFor = Array.isArray(raw)
        ? raw.map(Number)
        : (parseJsonArray(raw) ?? []).map(Number);
    }
  }
  next();
};


/**
 * Middleware factory to parse a stringified JSON array from a request body field.
 * Useful for multipart/form-data where arrays are sent as JSON strings.
 * @param fieldName The name of the field to parse
 */
export const parseBodyJson = (fieldName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // If the entire body is an array (common in raw JSON requests like Postman),
    // wrap it into the expected field name so validation and controllers work.
    if (Array.isArray(req.body)) {
      req.body = { [fieldName]: req.body };
      return next();
    }

    if (req.body[fieldName] && typeof req.body[fieldName] === 'string') {
      try {
        req.body[fieldName] = parseJsonArray(req.body[fieldName]);
      } catch (error) {
        // We let the validation middleware or controller handle empty/invalid data later
      }
    }
    next();
  };
};