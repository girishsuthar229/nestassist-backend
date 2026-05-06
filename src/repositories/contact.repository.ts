import Contact from "../models/contact.model";
import { ContactFilterQuery } from "@/interfaces/contact.interface";
import { Op, WhereOptions } from "sequelize";

/**
 * @name findAllContacts
 * @description
 * Fetch contacts from the database with support for pagination, filtering by name and submission date, and sorting by specified fields.
 * Supports partial name matching and exact date filtering (ignoring time).
 * @access Private
 */
export const findAllContacts = async (query: ContactFilterQuery & { offset: number }) => {
  const where: WhereOptions = {};

  if (query.name?.trim()) {
    where.name = { [Op.iLike]: `%${query.name.trim()}%` };
  }

  if (query.submissionDate) {
    const startOfDay = new Date(query.submissionDate);
    const endOfDay = new Date(query.submissionDate);
    endOfDay.setHours(23, 59, 59, 999);

    where.createdAt = {
      [Op.between]: [startOfDay, endOfDay],
    };
  }

  const allowedSortFields = ["id", "name", "email", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";

  return await Contact.findAndCountAll({
    where,
    limit: query.limit,
    offset: query.offset,
    order: [[sortBy as string, sortOrder]],
  });
};

/**
 * @name createContact
 * @description
 * Create a new contact entry in the database with the provided details.
 * @access Public
 */
export const createContact = async (data: { name: string; email: string; mobile: string; description: string }) => {
  return await Contact.create(data);
};
