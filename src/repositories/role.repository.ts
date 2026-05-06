import { RoleDTO } from "@/dtos/role.dto";
import Role from "../models/role.model";

/**
 * Repository for Role model operations.
 */

const roleIdCache = new Map<string, number>();

export const getRoleIdByName = async (name: string): Promise<number | null> => {
  const cached = roleIdCache.get(name);
  if (cached) return cached;

  const role = await Role.findOne({
    where: { name },
    attributes: ["id"],
    raw: true,
  });

  const id = Number((role as any)?.id);
  if (!Number.isFinite(id)) return null;

  roleIdCache.set(name, id);
  return id;
};



export const findAllRoles = async (options: {
  where: Record<string, any>;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}) => {
  return await Role.findAll({
    where: options.where,
    order: [[options.sortBy, options.sortOrder]],
    attributes: ["id", "name", "description", "createdAt"],
  });
};

export const findRoleById = async (id: string | number) => {
  return await Role.findByPk(id, {
    attributes: ["id", "name", "description"],
  });
};

export const findRoleByName = async (name: string) => {
  return await Role.findOne({
    where: { name },
    attributes: ["id"],
  });
};

export const createRole = async (data: RoleDTO) => {
  return await Role.create(data as any);
};

export const updateRole = async (id: string | number, data: Partial<RoleDTO>) => {
  const role = await Role.findByPk(id, {
    attributes: ["id", "name", "description"],
  });
  if (role) {
    return await role.update(data as any);
  }
  return null;
};

export const deleteRole = async (id: string | number) => {
  const role = await Role.findByPk(id, {
    attributes: ["id"],
  });
  if (role) {
    return await role.destroy();
  }
  return null;
};
