
import { RoleFilterQuery } from "@/interfaces/role.interface";
import { ApiError } from "../utils/apiError.util";
import * as RoleRepository from "../repositories/role.repository";
import { Op, WhereOptions } from "sequelize";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { RoleDTO } from "@/dtos/role.dto";


/**
 * @name listRoles
 * @description Fetch roles with filtering and sorting.
 */
export const listRoles = async (query: RoleFilterQuery) => {
  const where: WhereOptions = query.search?.trim()
  ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query.search.trim()}%` } },
        { description: { [Op.iLike]: `%${query.search.trim()}%` } },
      ],
    }
  : {};

  const allowedSortFields = ["id", "name", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "") ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";

  const rows = await RoleRepository.findAllRoles({
    where,
    sortBy: sortBy as string,
    sortOrder,
  });

  return {
    data: rows,
  };
};

/**
 * @name createRole
 * @description Create a new role.
 */
export const createRole = async (payload: RoleDTO) => {
  const existingRole = await RoleRepository.findRoleByName(payload.name);
  if (existingRole) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.ROLE.NAME_EXISTS);
  }
  return await RoleRepository.createRole(payload);
};

/**
 * @name updateRole
 * @description Update an existing role.
 */
export const updateRole = async (id: string, payload: Partial<RoleDTO>) => {
  const role = await RoleRepository.findRoleById(id);
  if (!role) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.ROLE.NOT_FOUND);
  }
  
  if (payload.name && payload.name !== role.name) {
    const existingRole = await RoleRepository.findRoleByName(payload.name);
    if (existingRole) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.ROLE.NAME_EXISTS);
    }
  }
  
  return await RoleRepository.updateRole(id, payload);
};

/**
 * @name deleteRole
 * @description Delete a role by id.
 */
export const deleteRole = async (id: string) => {
  const role = await RoleRepository.findRoleById(id);
  if (!role) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.ROLE.NOT_FOUND);
  }
  await RoleRepository.deleteRole(id);
};
