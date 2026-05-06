import { NextFunction, Request, Response } from "express";
import { sendResponse } from "@/utils/response.util";
import asyncErrorHandler from "@/utils/asyncErrorHandler";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import {
  convertObjToCamelCase,
  createOfferService,
  deleteOfferService,
  getOfferService,
  getOffersService,
  updateOfferService,
  updateOfferUsedCountService,
} from "@/services/offer.service";
import { CreateOfferDto, UpdateOfferDto } from "@/dtos/offer.dto";

/**
 * Route: GET /offers
 * Returns the offer list, optionally filtered and paginated.
 */
export const getOffers = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getOffersService(req.query);
    return sendResponse(res, {
      message: MESSAGES.OFFER.FETCHED,
      ...result,
    });
  },
);

/**
 * Route: GET /offers/:offerId
 * Returns a single offer by id.
 */
export const getOffer = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const offer = await getOfferService(Number(req.params.offerId));
    const message = offer.is_deleted
      ? MESSAGES.OFFER.NO_LONGER_AVAILABLE
      : MESSAGES.OFFER.FETCHED;

    return sendResponse(res, message, offer);
  },
);

/**
 * Route: POST /offers
 * Creates a new offer from the validated request body.
 */
export const createOffer = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = convertObjToCamelCase(req.body);
    const offer = await createOfferService(body as unknown as CreateOfferDto);
    return sendResponse(
      res,
      MESSAGES.OFFER.CREATED,
      offer,
      STATUS_CODE.CREATED,
    );
  },
);

/**
 * Route: PUT /offers/:offerId
 * Updates offer fields, including `isActive`.
 */
export const updateOffer = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = convertObjToCamelCase(req.body);
    const offer = await updateOfferService(
      Number(req.params.offerId),
      body as unknown as UpdateOfferDto,
    );
    return sendResponse(res, MESSAGES.OFFER.UPDATED, offer);
  },
);

/**
 * Route: PATCH /offers/:offerId/used-count
 * Updates only the `usedCount` field for a single offer.
 */
export const updateOfferUsedCount = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const offer = await updateOfferUsedCountService(Number(req.params.offerId));
    return sendResponse(res, MESSAGES.OFFER.USED_COUNT_UPDATED, offer);
  },
);

/**
 * Route: DELETE /offers/:offerId
 * Soft deletes an offer.
 */
export const deleteOffer = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await deleteOfferService(Number(req.params.offerId));
    return sendResponse(res, MESSAGES.OFFER.DELETED);
  },
);
