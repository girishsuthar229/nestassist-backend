import { Response } from "express";
import {
  IMetaPaginationResponse,
  IMetaTokenResponse,
} from "@/dtos/apiResponse.dto";
import { STATUS_CODE } from "@/enums";

/**
 * Standard API Response Options
 */
interface SendResponseParams<T> {
  statusCode?: number;
  success?: boolean;
  message?: string | null;
  data?: T;
  meta?: IMetaTokenResponse | IMetaPaginationResponse;
  pagination?: IMetaPaginationResponse;
  error?: string;
  [key: string]: unknown;
}

/**
 * @name sendResponse
 * @description
 * Standard API Response (Unified Helper)
 * Helper to send API responses in a consistent format across the application.
 * Supports both success and error responses with flexible parameters.
 * @access Public
 */
export const sendResponse = <T>(
  res: Response,
  messageOrParams: string | SendResponseParams<T> | null = null,
  data?: T,
  statusCode: number = STATUS_CODE.OK,
  extra: Record<string, unknown> = {}
): Response => {
  let params: SendResponseParams<T>;

  if (typeof messageOrParams === "object" && messageOrParams !== null) {
    params = messageOrParams as SendResponseParams<T>;
  } else {
    params = {
      message: messageOrParams as string | null,
      data,
      statusCode,
      ...extra,
    };
  }

  const {
    statusCode: finalStatusCode = params.statusCode || STATUS_CODE.OK,
    success = params.success ??
    (finalStatusCode >= STATUS_CODE.OK && finalStatusCode < STATUS_CODE.BAD_REQUEST),
    message,
    data: finalData,
    meta,
    pagination,
    error,
    ...rest
  } = params;

  const responseJson: Record<string, unknown> = {
    success,
    message: message || undefined,
    data: finalData === undefined ? undefined : finalData,
    meta,
    pagination,
    error,
    ...(rest as Record<string, unknown>),
  };

  // Remove undefined fields
  Object.keys(responseJson).forEach((key) => {
    if (responseJson[key] === undefined) delete responseJson[key];
  });

  return res.status(finalStatusCode).json(responseJson);
};


/**
 * @name sendError
 * @description
 * Helper to send error responses in a consistent format. Can be used for both expected and unexpected errors.
 * @access Public
 */
export const sendError = (
  res: Response,
  message?: string,
  statusCode: number = STATUS_CODE.INTERNAL_SERVER_ERROR,
  extra: Record<string, unknown> = {}
): Response => {
  return sendResponse(res, {
    statusCode,
    success: false,
    message,
    error: message, // backwards compatibility if someone uses error field
    ...extra,
  });
};
