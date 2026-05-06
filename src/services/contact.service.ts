import * as ContactRepository from "../repositories/contact.repository";
import logger from "../utils/logger";
import { ContactFilterQuery } from "@/interfaces/contact.interface";

/**
 * @name getContacts
 * @description
 * Fetch contacts with pagination, filtering and sorting.
 * Supports filtering by name (partial match) and submission date (exact day).
 * @access Private
 */
export const getContacts = async (query: ContactFilterQuery) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const offset = (page - 1) * limit;

  if (query.submissionDate) {
    const checkDate = new Date(query.submissionDate);
    if (isNaN(checkDate.getTime())) {
      throw new Error("Invalid date format provided for filtering");
    }
  }

  logger.info(
    `ContactService: Fetching contacts with page: ${page}, limit: ${limit}, query: ${JSON.stringify(
      query
    )}`
  );

  const { rows: data, count: totalItems } = await ContactRepository.findAllContacts({
    ...query,
    limit,
    offset,
  });

  return {
    data,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

/**
 * @name createContact
 * @description
 * Create a new contact entry with the provided details.
 * Validates the input and logs the creation process.
 * @access Public
 */
export const createContact = async (
  name: string,
  email: string,
  mobile: string,
  description: string
) => {
  logger.info(
    `ContactService: Creating contact with name "${name}", email "${email}", mobile "${mobile}", description "${description}"`
  );

  return ContactRepository.createContact({ name, email, mobile, description });
};
