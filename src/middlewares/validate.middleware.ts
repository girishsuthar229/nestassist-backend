import { ObjectSchema } from "joi";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { sanitizeWithDOMPurify } from "@/utils/sanitizeWithDOMPurify";

export const validate = (schema: ObjectSchema) => {
  return (req: any, _res: any, next: any) => {
    // Normalize common multipart "array field" naming (`field[]`) into `field`
    // so clients can use either style.
    const normalizedBody: Record<string, unknown> = { ...(req.body ?? {}) };
    for (const key of Object.keys(normalizedBody)) {
      if (!key.endsWith("[]")) continue;

      const baseKey = key.slice(0, -2);
      const value = normalizedBody[key];
      delete normalizedBody[key];

      const incomingValues = Array.isArray(value) ? value : [value];
      const existing = normalizedBody[baseKey];
      const existingValues =
        existing === undefined
          ? []
          : Array.isArray(existing)
            ? existing
            : [existing];

      normalizedBody[baseKey] = [...existingValues, ...incomingValues];
    }

    // Combine body, file, and files into a single validation object
    const dataToValidate = {
      ...normalizedBody,
      ...(req.file ? { [req.file.fieldname]: req.file } : {}),
      ...(Array.isArray(req.files)
        ? req.files.length
          ? { [req.files[0].fieldname]: req.files }
          : {}
        : Object.keys(req.files || {}).reduce((acc: any, key: string) => {
            acc[key] = req.files[key];
            return acc;
          }, {})),
    };

    const { error, value } = schema.validate(dataToValidate, { abortEarly: false });
    if (error) {
      error.message = "Validation failed.";
      return next(error);
    }
    const sanitizedData = sanitizeWithDOMPurify(value);
    req.body = sanitizedData;
    next();
  };
};
