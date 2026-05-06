import { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";
import * as service from "@/services/adminBookingManagement.service";
import * as detailsService from "@/services/adminBookingDetailsPage.service";
import { clearBookingManagementCache } from "@/utils/caching-utils/bookingManagementCache.util";
import { clearDashboardCache } from "@/utils/caching-utils/dashboardCache.util";
import { sendResponse } from "@/utils/response.util";
import { getErrorMessage } from "@/utils/common.utils";
import { MESSAGES } from "@/constants/messages";
import { ApiError } from "@/utils/apiError.util";
import { STATUS_CODE } from "@/enums";
import { BOOKING } from "@/constants/messages/booking.messages";

export const getAdminBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // For GET endpoints, apicache short-circuits the handler on cache hits.
    logger.info("AdminBookingManagementController: list bookings");
    const result = await service.getAdminBookings(
      req.query as Record<string, unknown>,
    );
    return sendResponse(res, {
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:getAdminBookings error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Writes must clear any dependent caches (booking-management list + dashboard KPIs).
    const bookingId = Number(req.params.bookingId);
    const { status, cancellationReason } = req.body || {};
    const userId = req.user?.id || req.user?.sub;
    logger.info(
      `AdminBookingManagementController:updateBookingStatus bookingId=${bookingId} status=${status} cancellationReason=${cancellationReason}`,
    );

    await service.updateBookingStatus(
      bookingId,
      Number(userId),
      status,
      cancellationReason,
    );
    clearBookingManagementCache();
    clearDashboardCache();
    return sendResponse(res, MESSAGES.BOOKING.STATUS_UPDATED);
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:updateBookingStatus error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    logger.info(
      `AdminBookingManagementController:deleteBooking bookingId=${bookingId}`,
    );
    await service.deleteBooking(bookingId);
    clearBookingManagementCache();
    clearDashboardCache();
    return sendResponse(res, MESSAGES.BOOKING.DELETED);
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:deleteBooking error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const changeBookingExpert = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const { servicePartnerId } = req.body || {};
    logger.info(
      `AdminBookingManagementController:changeBookingExpert bookingId=${bookingId} servicePartnerId=${servicePartnerId}`,
    );

    await service.changeBookingExpert(
      bookingId,
      Number(servicePartnerId),
      req.user?.id,
    );
    clearBookingManagementCache();
    clearDashboardCache();
    return sendResponse(res, MESSAGES.BOOKING.EXPERT_ASSIGNED);
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:changeBookingExpert error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const getExpertsByBookingId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as Record<string, unknown>;
    const booking_id = query.booking_id;

    if (!booking_id) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, BOOKING.ID_REQUIRED);
    }

    logger.info(
      `AdminBookingManagementController:getExpertsByBookingId booking_id=${booking_id}`,
    );
    const experts = await service.getVerifiedExpertsByBookingId(
      booking_id as string,
    );
    return sendResponse(res, MESSAGES.EXPERT.EXPERT_FETCHED, experts);
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:getExpertsByBookingId error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const getBookingFilters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    logger.info("AdminBookingManagementController:getBookingFilters");
    const filters = await service.getAdminBookingFilters();
    return sendResponse(res, MESSAGES.BOOKING.FILTERS_FETCHED, filters);
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:getBookingFilters error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const getAdminBookingDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    logger.info(
      `AdminBookingManagementController:getAdminBookingDetails bookingId=${bookingId}`,
    );
    const details = await detailsService.getAdminBookingDetails(bookingId);
    return sendResponse(
      res,
      MESSAGES.BOOKING.FETCHED_WITH_PAYMENT_DETAILS,
      details,
    );
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:getAdminBookingDetails error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};

export const getAdminBookingDetailsPageData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const query = req.query as Record<string, any>;
    logger.info(
      `AdminBookingManagementController:getAdminBookingDetailsPageData bookingId=${bookingId} query=${JSON.stringify(query)}`,
    );

    const pageData = await detailsService.getAdminBookingDetailsPageData({
      bookingId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return sendResponse(res, {
      data: pageData.data,
      errors: pageData.errors,
      message: MESSAGES.BOOKING.FETCHED_WITH_PAYMENT_DETAILS,
    });
  } catch (error: unknown) {
    logger.error(
      `AdminBookingManagementController:getAdminBookingDetailsPageData error: ${getErrorMessage(error)}`,
    );
    next(error);
  }
};
