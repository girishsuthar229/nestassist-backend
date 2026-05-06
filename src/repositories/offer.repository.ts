import {
  CreateOfferDto,
  GetOffersQueryDto,
  UpdateOfferDto,
} from "@/dtos/offer.dto";
import { Offer } from "@/models";
import { Op, WhereOptions, col, where } from "sequelize";

/**
 * Persists a new offer record.
 */
export const createOffer = async (data: CreateOfferDto) => {
  return await Offer.create(data);
};

/**
 * Finds a single active offer by primary key.
 * Soft-deleted offers are excluded from this query.
 */
export const findOfferById = async (offerId: number) => {
  return await Offer.findByPk(offerId);
};

/**
 * Finds a single offer by primary key, including soft-deleted rows.
 * Use this only for read-only lookups where deleted offers must still be visible.
 */
export const findOfferByIdIncludingDeleted = async (offerId: number) => {
  return await Offer.findByPk(offerId, { paranoid: false });
};

/**
 * Finds a single offer by coupon code.
 */
export const findOfferByCouponCode = async (
  couponCode: string,
  includeDeleted: boolean = false,
) => {
  return await Offer.findOne({
    where: { couponCode },
    paranoid: !includeDeleted,
  });
};

/**
 * Returns all offers with dynamic filtering and pagination support.
 */
export const findAllOffers = async ({
  isActive,
  page,
  per_page,
  discount,
  min_applied,
  max_applied,
  min_usage_limit,
  max_usage_limit,
  search,
  sort_by,
  sort_order,
  min_discount,
  max_discount,
  created_from,
  created_to,
  is_applicable,
}: GetOffersQueryDto) => {
  const whereClause: WhereOptions = {};

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  if (search) {
    (whereClause as any)[Op.or] = [
      { couponCode: { [Op.iLike]: `%${search}%` } },
      { couponDescription: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (discount !== undefined) {
    whereClause.discountPercentage = discount;
  } else if (min_discount !== undefined || max_discount !== undefined) {
    whereClause.discountPercentage = {};
    if (min_discount !== undefined) {
      whereClause.discountPercentage[Op.gte] = min_discount;
    }
    if (max_discount !== undefined) {
      whereClause.discountPercentage[Op.lte] = max_discount;
    }
  }

  if (min_applied !== undefined || max_applied !== undefined) {
    whereClause.usedCount = {};
    if (min_applied !== undefined) {
      whereClause.usedCount[Op.gte] = min_applied;
    }
    if (max_applied !== undefined) {
      whereClause.usedCount[Op.lte] = max_applied;
    }
  }

  if (min_usage_limit !== undefined || max_usage_limit !== undefined) {
    whereClause.maxUsage = {};
    if (min_usage_limit !== undefined) {
      whereClause.maxUsage[Op.gte] = min_usage_limit;
    }
    if (max_usage_limit !== undefined) {
      whereClause.maxUsage[Op.lte] = max_usage_limit;
    }
  }

  if (created_from || created_to) {
    whereClause.createdAt = {};
    if (created_from) {
      whereClause.createdAt[Op.gte] = created_from;
    }
    if (created_to) {
      whereClause.createdAt[Op.lte] = created_to;
    }
  }

  if (is_applicable === true) {
    whereClause.isActive = true;
    whereClause.usedCount = { [Op.lt]: col("max_usage") };
  }

  const limit = per_page ? Number(per_page) : undefined;
  const offset = page && limit ? (Number(page) - 1) * limit : undefined;

  const order: any = [];
  if (sort_by) {
    order.push([sort_by, sort_order || "DESC"]);
  } else {
    order.push(["createdAt", "DESC"]);
  }

  return await Offer.findAndCountAll({
    where: whereClause,
    order,
    limit,
    offset,
  });
};

/**
 * Updates only the usage counter for an active offer instance.
 */
export const updateOfferUsedCount = async (offer: Offer, usedCount: number) => {
  return await offer.update({ usedCount });
};

/**
 * Updates editable fields on an active offer instance.
 */
export const updateOffer = async (offer: Offer, data: UpdateOfferDto) => {
  return await offer.update(data);
};

/**
 * Soft deletes an active offer instance.
 */
export const softDeleteOffer = async (offer: Offer) => {
  return await offer.destroy();
};
