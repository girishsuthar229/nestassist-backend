import { User, Role } from "../models";

/**
 * @name findUserByEmailWithRole
 * @description
 * Fetches a user by their email address, including their associated role information.
 * @access Public
 */
export const findUserByEmailWithRole = async (email: string) => {
  return await User.findOne({
    where: { email: email.toLowerCase() },
    include: [{ model: Role, as: "role", attributes: ["name"] }],
  });
};

/**
 * @name findUserByResetToken
 * @description
 * Fetches a user by their ID and remember token, typically used for password reset functionality.
 * @access Public
 */
export const findUserByResetToken = async (id: number, rememberToken: string) => {
  return await User.findOne({
    where: {
      id,
      rememberToken,
    },
  });
};

/**
 * @name findUserById
 * @description
 * Fetches a user by their unique identifier (ID).
 * @access Public
 */
export const findUserById = async (id: number | string) => {
  return await User.findByPk(id);
};

/**
 * @name findUserByEmail
 * @description
 * Fetches a user by their email identifier (EMAIL).
 * @access Public
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return await User.findOne({ where: { email } });
};


/**
 * @name findCustomerById
 * @description
 * Fetches a user by their id identifier (ID).
 * @access Public
 */
export const findCustomerById = async (id: number) => {
  return await User.findOne({
    where: { id},
    include: [{ model: Role, as: "role", attributes: ["name"] }],
    attributes: ["id", "name", "email", "emailVerifiedAt"],
  });
};
