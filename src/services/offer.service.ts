import { SORT_ORDER } from "@/constants";
import { MESSAGES } from "@/constants/messages";
import {
  CreateOfferDto,
  GetOffersQueryDto,
  OfferResponseDto,
  TSortOrder,
  UpdateOfferDto,
} from "@/dtos/offer.dto";
import { STATUS_CODE } from "@/enums";
import { Offer } from "@/models";
import {
  createOffer,
  findAllOffers,
  findOfferByCouponCode,
  findOfferById,
  softDeleteOffer,
  updateOffer,
  updateOfferUsedCount,
} from "@/repositories/offer.repository";
import { ApiError } from "@/utils/apiError.util";

/**
 * Converts an Offer model into a plain response DTO so controllers return a
 * stable API shape instead of raw Sequelize instances.
 */
const toOfferResponseDto = (offer: Offer): OfferResponseDto => ({
  id: Number(offer.id),
  coupon_code: offer.couponCode,
  coupon_description: offer.couponDescription ?? null,
  discount_percentage: Number(offer.discountPercentage),
  discount_percentage_text: offer.discountPercentage ? `${Number(offer.discountPercentage).toFixed(0)}%` : "0%",
  max_usage: Number(offer.maxUsage ?? 0),
  used_count: Number(offer.usedCount ?? 0),
  times_applied: Number(offer.usedCount ?? 0),
  times_applied_text: offer.usedCount ? `${offer.usedCount} times` : "0 times",
  is_active: Boolean(offer.isActive),
  status_label: offer.isActive ? "Active" : "Inactive"
});

/**
 * Normalizes the optional `isActive` query parameter so the list endpoint can
 * accept common boolean-like string values from query strings.
 */
const parseIsActiveFilter = (isActive: unknown): boolean | undefined => {
  if (typeof isActive === "boolean") {
    return isActive;
  }

  if (typeof isActive !== "string") {
    return undefined;
  }

  const normalizedIsActive = isActive.trim().toLowerCase();

  if (["true", "1", "yes", "active"].includes(normalizedIsActive)) {
    return true;
  }

  if (["false", "0", "no", "inactive"].includes(normalizedIsActive)) {
    return false;
  }

  return undefined;
};

/**
 * Creates a new offer after normalizing the coupon code and checking for
 * duplicates.
 */
export const createOfferService = async (
  body: CreateOfferDto,
): Promise<OfferResponseDto> => {
  const couponCode = body.couponCode.trim().toUpperCase();
  const existingOffer = await findOfferByCouponCode(couponCode);

  if (existingOffer) {
    throw new ApiError(STATUS_CODE.CONFLICT, MESSAGES.OFFER.COUPON_CODE_EXISTS);
  }

  const offer = await createOffer({
    couponCode: couponCode,
    couponDescription: body.couponDescription?.trim() || null,
    discountPercentage: body.discountPercentage,
    maxUsage: body.maxUsage ?? 0,
    usedCount: body.usedCount ?? 0,
  });

  return toOfferResponseDto(offer);
};

/**
 * Returns all offers, optionally filtered and paginated.
 */
export const getOffersService = async (query: {
  page?: string;
  per_page?: string;
  discount?: string;
  min_applied?: string;
  max_applied?: string;
  min_usage_limit?: string;
  max_usage_limit?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  min_discount?: string;
  max_discount?: string;
  created_from?: string;
  created_to?: string;
  is_applicable?: boolean;
}) => {
  const safePage = Math.max(1, Number(query.page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(query.per_page) || 10));

  const filters: GetOffersQueryDto = {
    isActive: parseIsActiveFilter(query.status),
    page: safePage,
    per_page: safeLimit,
    discount: query.discount ? Number(query.discount) : undefined,
    min_applied: query.min_applied ? Number(query.min_applied) : undefined,
    max_applied: query.max_applied ? Number(query.max_applied) : undefined,
    min_usage_limit: query.min_usage_limit ? Number(query.min_usage_limit) : undefined,
    max_usage_limit: query.max_usage_limit ? Number(query.max_usage_limit) : undefined,
    search: query.search?.trim(),
    sort_by: query.sort_by,
    sort_order: (query.sort_order?.toUpperCase() === SORT_ORDER.ASC ? SORT_ORDER.ASC : SORT_ORDER.DESC) as TSortOrder | undefined,
    min_discount: query.min_discount ? Number(query.min_discount) : undefined,
    max_discount: query.max_discount ? Number(query.max_discount) : undefined,
    created_from: query.created_from ? new Date(query.created_from) : undefined,
    created_to: query.created_to ? new Date(query.created_to) : undefined,
    is_applicable: parseIsActiveFilter(query.is_applicable),
   };

  const { rows, count } = await findAllOffers(filters);

  if (!rows.length) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.OFFER.NOT_FOUND);
  }

  const offers = rows.map(toOfferResponseDto);

  return {
    data: offers,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / safeLimit),
      currentPage: safePage,
      limit: safeLimit,
    },
  };
};

/**
 * Returns a single offer by its id, including soft-deleted offers when the
 * caller requests a direct lookup by identifier.
 */
export const getOfferService = async (
  offerId: number,
): Promise<OfferResponseDto> => {
  if (!offerId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.REQUIRED_OFFER_ID,
    );
  }

  const offer = await findOfferById(offerId);

  if (!offer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.OFFER.NOT_FOUND_OFFER);
  }

  return toOfferResponseDto(offer);
};

/**
 * Updates editable offer fields, including active status, while preserving
 * coupon uniqueness among non-deleted offers.
 */
export const updateOfferService = async (
  offerId: number,
  body: UpdateOfferDto,
): Promise<OfferResponseDto> => {
  if (!offerId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.REQUIRED_OFFER_ID,
    );
  }

  const offer = await findOfferById(offerId);

  if (!offer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.OFFER.NOT_FOUND_OFFER);
  }

  const nextCouponCode =
    body.couponCode !== undefined
      ? body.couponCode.trim().toUpperCase()
      : offer.couponCode;

  if (nextCouponCode !== offer.couponCode) {
    const existingOffer = await findOfferByCouponCode(nextCouponCode);

    if (existingOffer && Number(existingOffer.id) !== Number(offer.id)) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        MESSAGES.OFFER.COUPON_CODE_EXISTS,
      );
    }
  }

  const nextMaxUsage = body.maxUsage ?? Number(offer.maxUsage ?? 0);
  const nextUsedCount = body.usedCount ?? Number(offer.usedCount ?? 0);

  if (nextMaxUsage > 0 && nextUsedCount > nextMaxUsage) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.USED_COUNT_EXCEEDS_MAX_USAGE,
    );
  }

  const payload: UpdateOfferDto = {};

  if (body.couponCode !== undefined) {
    payload.couponCode = nextCouponCode;
  }

  if (body.couponDescription !== undefined) {
    payload.couponDescription = body.couponDescription?.trim() || null;
  }

  if (body.discountPercentage !== undefined) {
    payload.discountPercentage = body.discountPercentage;
  }

  if (body.maxUsage !== undefined) {
    payload.maxUsage = body.maxUsage;
  }

  if (body.usedCount !== undefined) {
    payload.usedCount = body.usedCount;
  }

  if (body.isActive !== undefined) {
    payload.isActive = body.isActive;
  }

  await updateOffer(offer, payload);

  return toOfferResponseDto(offer);
};

/**
 * Soft deletes an offer so it is hidden from standard list queries while still
 * remaining available for direct lookups when needed.
 */
export const deleteOfferService = async (offerId: number): Promise<void> => {
  if (!offerId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.REQUIRED_OFFER_ID,
    );
  }

  const offer = await findOfferById(offerId);

  if (!offer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.OFFER.NOT_FOUND_OFFER);
  }

  await softDeleteOffer(offer);
};

/**
 * Updates only the `usedCount` field while ensuring the new value does not
 * exceed the configured maximum usage limit.
 */
export const updateOfferUsedCountService = async (
  offerId: number,
): Promise<OfferResponseDto | {}> => {
  if (!offerId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.REQUIRED_OFFER_ID,
    );
  }

  const offer = await findOfferById(offerId);

  if (!offer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.OFFER.NOT_FOUND_OFFER);
  }

  const updatedUsedCount = offer.usedCount + 1;

  if (offer.maxUsage >= 0 && updatedUsedCount > offer.maxUsage) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.OFFER.USED_COUNT_EXCEEDS_MAX_USAGE,
    );
  }

  await updateOfferUsedCount(offer, updatedUsedCount);

  return toOfferResponseDto(offer);
};

export const convertObjToCamelCase = <T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> => {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
      );

      acc[camelKey] = obj[key as keyof T];
      return acc;
    },
    {} as Record<string, unknown>,
  );
};
