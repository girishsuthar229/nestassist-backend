import { User, Role } from "../models";
import logger from "../utils/logger";
import { WhereOptions } from "sequelize";

/**
 * @name getAdminRoleId
 * @description
 * Fetches the ID of the "ADMIN" role from the database. This is used to ensure that all admin-related operations are performed on users with the correct role.
 * If the "ADMIN" role is not found, it logs an error and returns null, which should be handled by the calling service to prevent further issues.
 * @access Private
 */
export const getAdminRoleId = async (): Promise<number | null> => {
  const role = await Role.findOne({ where: { name: "ADMIN" } });
  if (!role) {
    logger.error("ADMIN role not found in the database.");
    return null;
  }
  return role.id;
};

/**
 * @name findAllAdmins
 * @description
 * Fetches a paginated list of admin users based on the provided query parameters.
 * It ensures that only users with the "ADMIN" role are included in the results.
 * @access Private | Role-based
 */
export const findAllAdmins = async (query: {
  page: number;
  limit: number;
  offset: number;
  where: WhereOptions;
  sortBy: string;
  sortOrder: string;
  adminRoleId: number;
}) => {
  const finalWhere = {
    ...query.where,
    roleId: query.adminRoleId,
  } as WhereOptions;

  return await User.findAndCountAll({
    where: finalWhere,
    limit: query.limit,
    offset: query.offset,
    order: [[query.sortBy, query.sortOrder]],
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });
};

/**
 * @name findAdminByEmail
 * @description
 * Fetches an admin user by their email address.
 * @access Private | Role-based
 */
export const findAdminByEmail = async (
  email: string,
  paranoid: boolean = true
) => {
  return await User.findOne({
    where: { email },
    paranoid,
  });
};

/**
 * @name findAdminById
 * @description
 * Fetches an admin user by their unique identifier (ID).
 * @access Private | Role-based
 */
export const findAdminById = async (id: string | number) => {
  return await User.findByPk(id);
};

/**
 * @name createAdmin
 * @description
 * Creates a new admin user with the provided data.
 * The data should include all necessary fields such as name, email, password, and roleId (which should correspond to the ADMIN role).
 * @access Private | Role-based
 */
export const createAdmin = async (data: Partial<User>) => {
  return await User.create(data);
};

/**
 * @name updateAdmin
 * @description
 * Updates an existing admin user's details based on their ID.
 * The function first checks if the admin user exists.
 * @access Private | Role-based
 */
export const updateAdmin = async (id: string | number, data: Partial<User>) => {
  const admin = await findAdminById(id);
  if (!admin) return null;

  return await admin.update(data);
};

/**
 * @name deleteAdmin
 * @description
 * Deletes an admin user by their ID.
 * This is a soft delete, meaning the record will not be permanently removed from the database but will be marked as deleted (if paranoid mode is enabled in Sequelize). The function first checks if the admin user exists. If not, it returns null. If the admin user is found, it performs the delete operation and returns true to indicate successful deletion.
 * @access Private | Role-based
 */
export const deleteAdmin = async (id: string | number) => {
  const admin = await findAdminById(id);
  if (!admin) return null;

  await admin.destroy();
  return true;
};

/**
 * @name hardDeleteAdmin
 * @description
 * Permanently deletes an admin user from the database by their ID, bypassing the soft delete mechanism.
 * This function is used to completely remove a record, including those that have been soft-deleted (marked as deleted but still present in the database).
 * It first checks if the admin user exists, regardless of their deletion status, and if found, it performs a hard delete using the `force: true` option in Sequelize's destroy method.
 * If the admin user is not found, it returns null; otherwise, it returns true to indicate successful permanent deletion.
 * @access Private | Role-based
 */
export const hardDeleteAdmin = async (id: string | number) => {
  const admin = await User.findByPk(id, { paranoid: false });
  if (!admin) return null;

  await admin.destroy({ force: true });
  return true;
};
