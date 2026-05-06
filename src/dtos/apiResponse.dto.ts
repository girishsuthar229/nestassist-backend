export interface APIResponse<T> {
  success: boolean;
  data?: T;
  meta?: IMetaTokenResponse | IMetaPaginationResponse;
  pagination?: IMetaPaginationResponse;
  message?: string;
  error?: string;
}

export interface IMetaTokenResponse {
  token?: string;
}

export interface IMetaPaginationResponse {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}
