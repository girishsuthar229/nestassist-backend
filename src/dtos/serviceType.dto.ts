export interface CreateServiceTypeDto {
  name: string;
  image?: string;
}

export interface UpdateServiceTypeDto {
  name?: string;
  image?: string;
}

export interface PublicServiceListQuery {
  q?: string;
  subCategoryId?: number;
  offset?: number;
  limit?: number;
}

export interface PublicServiceResponse {
  id: number;
  name: string;
  price: string;
  duration: number | null;
  images: string[];
  includeServices: string[];
  excludeServices: string[];
}

import { IMetaPaginationResponse } from "./apiResponse.dto";

export interface ServiceListResponse {
  data: PublicServiceResponse[];
  hasMore: boolean;
  nextOffset?: number;
  pagination?: IMetaPaginationResponse;
}

export interface PublicAllServiceType {
  id: number;
  name: string;
  image: string | null;
  bannerImage?: string | null;
  bookings: number;
  createdAt: Date;
  updatedAt: Date;
}
