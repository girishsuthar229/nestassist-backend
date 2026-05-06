export interface OfferAttributes {
  id: number;
  couponCode: string;
  couponDescription?: string | null;
  discountPercentage: number;
  maxUsage?: number;
  usedCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateOfferDto {
  couponCode: string;
  couponDescription?: string | null;
  discountPercentage: number;
  maxUsage?: number;
  usedCount?: number;
}

export interface UpdateOfferDto {
  couponCode?: string;
  couponDescription?: string | null;
  discountPercentage?: number;
  maxUsage?: number;
  usedCount?: number;
  isActive?: boolean;
}

export interface UpdateOfferUsedCountDto {
  usedCount: number;
}

export type TSortOrder = "ASC" | "DESC";

export interface GetOffersQueryDto {
  isActive?: boolean;
  page?: number;
  per_page?: number;
  discount?: number;
  min_discount?: number;
  max_discount?: number;
  min_applied?: number;
  max_applied?: number;
  min_usage_limit?: number;
  max_usage_limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: TSortOrder;
  created_from?: Date;
  created_to?: Date;
  is_applicable?: boolean;
}

export interface OfferResponseDto {
  id: number;
  coupon_code: string;
  coupon_description: string | null;
  discount_percentage: number;
  discount_percentage_text?: string;
  max_usage: number;
  used_count: number;
  times_applied?: number;
  times_applied_text?: string;
  is_active: boolean;
  status_label?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  is_deleted?: boolean;
}
