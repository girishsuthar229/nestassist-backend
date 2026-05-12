import { Address } from "@/models";
import { AddressCreationAttributes } from "@/models/address.model";
import { Transaction } from "sequelize";

/**
 * @name findAddressesByUserId
 * @description Get all addresses for a user
 */
export const findAddressesByUserId = async (userId: number, transaction?: Transaction) => {
  return await Address.findAll({
    where: { userId },
    transaction,
  });
};

/**
 * @name createAddress
 * @description Create a new address
 */
export const createAddress = async (data: Partial<Address>, transaction?: Transaction) => {
  return await Address.create(data as AddressCreationAttributes, { transaction });
};

/**
 * @name updateAddress
 * @description Update an existing address
 */
export const updateAddress = async (addressId: number, data: Partial<Address>, transaction?: Transaction) => {
  return await Address.update(data, {
    where: { id: addressId },
    transaction,
  });
};

/**
 * @name findAddressById
 * @description Get a specific address by ID
 */
export const findAddressById = async (id: number, transaction?: Transaction) => {
  return await Address.findByPk(id, { transaction });
};

/**
 * @name deleteAddress
 * @description Delete an address by ID
 */
export const deleteAddress = async (id: number, transaction?: Transaction) => {
  return await Address.destroy({
    where: { id },
    transaction,
  });
};
