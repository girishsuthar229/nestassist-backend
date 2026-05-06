import { Request, Response } from "express";
import * as service from "../services/serviceBookingCheckout.service";
import asyncErrorHandler from "@/utils/asyncErrorHandler";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

/**
 * POST /service/checkout/pay
 * Process service booking payment (cash or card)
 */
export const processPayment = asyncErrorHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body || {};
    const tax = Number(body.tax || 0);

    const result = await service.processBookingPayment({
      userId: req.user?.id ?? body.userId,
      serviceId: body.serviceId,
      addressId: body.addressId,
      slot: body.slot,
      paymentMethod: body.paymentMethod,
      paymentGateway: body.paymentGateway || null,
      couponId: body.couponId,
      tax,
    });

    return sendResponse(res, MESSAGES.PAYMENT.PROCESSED, result);
  },
);

/**
 * GET /service/checkout/:bookingId
 * Retrieve a specific booking and its associated payment information.
 */
export const getBookingWithPayment = asyncErrorHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = Number(req.params.bookingId);
    const booking = await service.getBookingWithPaymentService(bookingId);
    return sendResponse(
      res,
      MESSAGES.BOOKING.FETCHED_WITH_PAYMENT_DETAILS,
      booking
    );
  }
);

/**
 * PUT /service/checkout/:bookingId
 * Retry a failed service booking payment.
 */
export const retryBookingPayment = asyncErrorHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentMethod, paymentGateway } = req.body || {};
    const booking = await service.retryBookingPaymentService({
      bookingId,
      paymentMethod,
      paymentGateway,
    });
    return sendResponse(res, MESSAGES.PAYMENT.RETRIED, booking);
  }
);
