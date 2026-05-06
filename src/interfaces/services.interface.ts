export type ServiceListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  subCategoryId?: number;
  priceMin?: number;
  priceMax?: number;
  availability?: boolean;
  commission?: number;
};