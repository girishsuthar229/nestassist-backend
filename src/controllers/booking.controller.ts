import { Request, Response, NextFunction } from "express";
import * as BookingService from "../services/booking.service";
import logger from "../utils/logger";
import { generateInvoicePDF } from "../utils/pdf.util";
import asyncErrorHandler from "@/utils/asyncErrorHandler";
import { sendResponse } from "@/utils/response.util";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { ApiError } from "@/utils/apiError.util";
import { AuthenticatedRequest, MyBookingsQuery } from "@/interfaces/booking.interface";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * GET /bookings/:bookingId/success-details
 */
export const getBookingSuccessDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    logger.info(`BookingController: Get success details for booking ${bookingId}`);

    if (!bookingId) throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.ID_REQUIRED);

    const data = await BookingService.getBookingSuccessDetails(Number(bookingId));

    return sendResponse(res, MESSAGES.BOOKING.SUCCESS_DETAILS_FETCHED, data);
  } catch (error: any) {
    logger.error(`BookingController: Error fetching success details: ${error.message}`);
    next(error);
  }
};

/**
 * GET /bookings/invoice/:invoiceNumber
 */
export const downloadInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { invoiceNumber } = req.params;
    logger.info(`BookingController: Download invoice ${invoiceNumber}`);

    const userId = req.user?.sub;
    if (!userId) throw new ApiError(STATUS_CODE.UNAUTHORIZED, MESSAGES.COMMON.UNAUTHORIZED);

    const data = await BookingService.getInvoiceData(invoiceNumber as string, +userId);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNumber}.pdf"`
    );

    // Generate and stream the PDF directly to the response
    generateInvoicePDF(data, res);

  } catch (error: any) {
    logger.error(`BookingController: Error downloading invoice: ${error.message}`);
    next(error);
  }
};

export const getAvailabilitySlots = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { serviceId } = req.params;
  logger.info(`BookingController: Get availability slots for service ${serviceId}`);
  if (!serviceId) throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.ID_REQUIRED);
  const data = await BookingService.getAvailabilitySlotsByService(Number(serviceId));

  return sendResponse(res, MESSAGES.SERVICE.SLOTS_FETCHED, data);
});

/**
 * @name getMyBookings
 * @description Fetch logged-in customer's bookings based on tab filter.
 * @access Private (Requires Authentication)
 * @queryParam tab - upcoming | completed (default: upcoming)
 */
export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, tab, page, limit } = (req.body as MyBookingsQuery) || {};
    if (!userId) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        MESSAGES.BOOKING.USER_ID_REQUIRED
      );
    }
    const bookings = await BookingService.getMyBookings(
      Number(userId) ,
      tab || undefined,
      Number(page) || 1,
      Number(limit) || 10
    );

    return sendResponse(res, MESSAGES.BOOKING.FETCHED, bookings);
  } catch (error: unknown) {
    logger.error(
      `BookingController:getMyBookings error: ${getErrorMessage(error)}`
    );
    next(error);
  }
};
