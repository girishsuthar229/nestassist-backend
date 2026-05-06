export interface AdminUserFilterQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string; // corresponds to isActive
  search?: string; // search by name or email
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  mobileNumber: string;
  password?: string;
  confirmPassword?: string;
  isActive?: boolean;
}

export interface UpdateAdminPayload {
  name?: string;
  email?: string;
  mobileNumber?: string;
  isActive?: boolean;
}
