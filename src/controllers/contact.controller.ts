import { Request, Response, NextFunction } from "express";
import * as ContactService from "../services/contact.service";
import logger from "../utils/logger";
import { sendResponse } from "../utils/response.util";
import { MESSAGES } from "../constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name getContacts
 * @description
 * Fetch contacts with pagination, filtering and sorting.
 * Supports filtering by name (partial match) and submission date (exact day).
 * @access Private
 */
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, name, submissionDate, sortBy, sortOrder } = req.query;
    const result = await ContactService.getContacts({
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
      name: name as string,
      submissionDate: submissionDate as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "ASC" | "DESC") || "DESC",
    });
    return sendResponse(res, { ...result });
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name createContact
 * @description
 * Create a new contact entry with the provided details.
 * Validates the input and saves the contact information to the database.
 * @access Public
 */
export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Create Contact request");
    const { firstName, lastName, email, mobile, description } = req.body;
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    const data = await ContactService.createContact(
      String(name || ""),
      String(email || "").trim(),
      String(mobile || "").trim(),
      String(description || "").trim()
    );

    return sendResponse(res, MESSAGES.CONTACT.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};
