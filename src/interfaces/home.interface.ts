export type ServiceListParams = {
  limit?: number;
};

export type HomeServiceDto = {
  id: number;
  name: string;
  price: string;
  image: string;
};

export type HomeServiceTypeDto = {
  id: number;
  name: string;
  image: string;
};

export type HomePublicStatsDto = {
  customersGlobally: number;
  servicesCount: number;
  servicesPartnerCount: number;
};