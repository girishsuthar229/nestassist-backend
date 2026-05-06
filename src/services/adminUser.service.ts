import bcrypt from "bcrypt";
import { Op, WhereOptions } from "sequelize";
import { AdminUserFilterQuery, CreateAdminPayload, UpdateAdminPayload } from "@/interfaces/adminUser.interface";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { sendAdminCredentials } from "../utils/mail.util";
import * as AdminUserRepository from "../repositories/adminUser.repository";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { Admin, User } from "@/models";

/**
 * @name listAdminUsers
 * @description
 * List admin users with pagination, filtering and sorting.
 * Supports searching by name or email.
 * @access Private | Role-based
 */
export const listAdminUsers = async (query: AdminUserFilterQuery) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit || 10)));
  const offset = (page - 1) * limit;

  const where: WhereOptions = {};

  // Search by name or email
  if (query.search?.trim()) {
    const search = `%${query.search.trim()}%`;
    Object.assign(where, {
      [Op.or]: [
        { name: { [Op.iLike]: search } },
        { email: { [Op.iLike]: search } },
      ]
    });
  }

  if (query.status !== undefined) {
    where.isActive = query.status === "active";
  }

  // Sorting
  const allowedSortFields = ["id", "name", "email", "createdAt", "status"];
  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy === "status"
      ? "isActive"
      : query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";

  const adminRoleId = await AdminUserRepository.getAdminRoleId();
  if (!adminRoleId) {
    throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, MESSAGES.USER.ADMIN_ROLE_NOT_CONFIGURED);
  }

  logger.info(
    `AdminUserService: Fetching admins with page: ${page}, limit: ${limit}, filtering: ${JSON.stringify(
      where
    )}, sorting: ${sortBy} ${sortOrder}`
  );

  const { rows, count } = await AdminUserRepository.findAllAdmins({
    page,
    limit,
    offset,
    where,
    sortBy: sortBy as string,
    sortOrder,
    adminRoleId,
  });

  return {
    data: rows,
    pagination: {
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * @name createAdminUser
 * @description
 * Create admin user with unique email and mobile number.
 * @access Private | Role-based
 */
export const createAdminUser = async (payload: CreateAdminPayload) => {
  const { email } = payload;

  const adminRoleId = await AdminUserRepository.getAdminRoleId();
  if (!adminRoleId) {
    throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, MESSAGES.USER.ADMIN_ROLE_NOT_CONFIGURED);
  }

  const activeUser = await AdminUserRepository.findAdminByEmail(email, true);
  if (activeUser && activeUser.getDataValue("deletedAt") === null) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.USER.ALREADY_EXISTS);
  }

  const deletedUser = await AdminUserRepository.findAdminByEmail(email, false);
  if (deletedUser && deletedUser.getDataValue("deletedAt") !== null) {
    await AdminUserRepository.hardDeleteAdmin(deletedUser.id);
  }

  const { confirmPassword, password, ...rest } = payload;
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  let hashedPassword = await bcrypt.hash(password, 10);

  // Laravel expects $2y$ prefix for Bcrypt hashes (Node uses $2b$ by default)
  hashedPassword = hashedPassword.replace(/^\$2[ab]\$/, "$2y$");

  const admin = await AdminUserRepository.createAdmin({
    ...rest,
    password: hashedPassword,
    roleId: adminRoleId,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  });

  // we use the original 'password' from the payload, not the hashed one
  try {
    await sendAdminCredentials(admin.email, admin.name, password);
  } catch (emailError) {
    logger.error("Failed to send welcome email to new admin:", emailError);
    // Continue despite email failure
  }

  const adminData = admin.toJSON();
  delete (adminData as { password?: string }).password;
  return adminData;
};

/**
 * @name updateAdminUser
 * @description
 * Update admin user with name, email and mobile number.
 * @access Private | Role-based
 */
export const updateAdminUser = async (id: string, payload: UpdateAdminPayload) => {
  const admin = await AdminUserRepository.findAdminById(id);
  if (!admin) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.ADMIN_NOT_FOUND);
  }

  if (payload.email && payload.email !== admin.email) {
    const { email } = payload;

    const activeUser = await AdminUserRepository.findAdminByEmail(email, true);
    if (activeUser && activeUser.getDataValue("deletedAt") === null) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.USER.USER_EMAIL_EXISTS);
    }

    const deletedUser = await AdminUserRepository.findAdminByEmail(email, false);
    if (deletedUser && deletedUser.getDataValue("deletedAt") !== null) {
      await AdminUserRepository.hardDeleteAdmin(deletedUser.id);
    }
  }

  const updatedAdmin = await AdminUserRepository.updateAdmin(id, payload);

  const adminData = updatedAdmin?.toJSON();
  if (adminData) {
    delete (adminData as { password?: string }).password;
  }
  return adminData;
};

/**
 * @name deleteAdminUser
 * @description
 * Delete admin user by id.
 * This is a soft delete, so the record will be marked as deleted but not removed from the database.
 * @access Private | Role-based
 */
export const deleteAdminUser = async (id: string) => {
  const admin = await AdminUserRepository.findAdminById(id);
  if (!admin) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.ADMIN_NOT_FOUND);
  }
  await AdminUserRepository.deleteAdmin(id);
};
