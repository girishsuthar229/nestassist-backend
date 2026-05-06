export interface CreateServiceRequestDto {
  name: string;
  price: number;
  duration?: number;
  commission?: number;
  availability?: boolean;
  includeServices?: string[] | string;
  excludeServices?: string[] | string;
}

export interface UpdateServiceRequestDto {
  name?: string;
  price?: number;
  duration?: number;
  commission?: number;
  availability?: boolean;
  subCategoryId?: number;
  includeServices?: string[] | string;
  excludeServices?: string[] | string;
  deletedImages?: string[] | string;
}

export interface FormatOptions {
  includeYear?: boolean;
  includeComma?: boolean;
};
