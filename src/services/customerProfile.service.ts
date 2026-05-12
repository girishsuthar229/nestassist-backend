
import CustomerOtp from "../models/customerOtp.model";
import { generateOtp, getOtpExpiry, parseDbTimestampAsUTC } from "../utils/otp.util";
import { sendOtpEmail } from "./email.service";
import * as servicePartnerRepository from "../repositories/servicePartner.repository";
import * as addressRepository from "../repositories/address.repository";
import * as recentSearchRepository from "../repositories/recentSearch.repository";

import { ApiError } from "@/utils/apiError.util";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { IAddress } from "@/interfaces/servicePartner.interface";

/**
 * @name changeMobile
 * @description Updates customer mobile number
 */
export const changeMobile = async (userId: number, mobile: string) => {
  const user = await servicePartnerRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  user.mobileNumber = mobile;
  await user.save();
  return { success: true };
};

/**
 * @name changeEmail
 * @description Validates email and sends OTP for update
 */
export const changeEmail = async (userId: number, newEmail: string) => {
  const user = await servicePartnerRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  const normalizedNewEmail = newEmail.toLowerCase().trim();
  if (user.email.toLowerCase() === normalizedNewEmail) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.USER.SAME_EMAIL_ADDRESS);
  }
  const existingUser = await servicePartnerRepository.findUserByEmail(normalizedNewEmail);
  if (existingUser) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.USER.USER_EMAIL_EXISTS);
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry(10);
  await CustomerOtp.create({
    email: normalizedNewEmail,
    otp,
    expires_at: expiresAt,
    name: user.name,
  });

  await sendOtpEmail(normalizedNewEmail, user.name, otp);

  return { email: normalizedNewEmail };
};

/**
 * @name verifyEmailUpdate
 * @description Verifies OTP and updates user email
 */
export const verifyEmailUpdate = async (userId: number, email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await CustomerOtp.findOne({
    where: { email: normalizedEmail, otp },
    order: [["createdAt", "DESC"]],
  });

  if (!otpRecord) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_INCORRECT);
  }

  const expires_at = parseDbTimestampAsUTC(otpRecord.expires_at);
  if (Date.now() > expires_at) {
    await CustomerOtp.destroy({ where: { email: normalizedEmail } });
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_EXPIRED);
  }

  const user = await servicePartnerRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  user.email = normalizedEmail;
  await user.save();

  // Cleanup OTPs for this email
  await CustomerOtp.destroy({ where: { email: normalizedEmail } });

  return { success: true };
};

import { ISaveAddress } from "@/interfaces/servicePartner.interface";

/**
 * @name saveAddress
 * @description Creates or updates a customer address
 */
export const saveAddress = async (userId: number, addressData: ISaveAddress) => {
  const user = await servicePartnerRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }
  const data = { userId: userId, ...addressData };
  if (addressData.id) {
    await addressRepository.updateAddress(addressData.id, data);
  } else {
    await addressRepository.createAddress(data);
  }

  return { success: true };
};

/**
 * @name getUserAddresses
 * @description Fetches all addresses for a customer
 */
export const getUserAddresses = async (userId: number) => {
  const addresses = await addressRepository.findAddressesByUserId(userId);
  const userAddresses :IAddress[]= addresses.map((addr: any) => ({
    id: addr.id,
    label: addr.label,
    custom_label: addr.customLabel || "",
    display_label: addr.label === "Others" ? addr.customLabel || "" : addr.label || "",
    house_flat_number: addr.houseFlatNumber,
    landmark: addr.landmark || "",
    address: addr.address,
    latitude: parseFloat(addr.latitude || ""),
    longitude: parseFloat(addr.longitude),
    full_address: `${addr.houseFlatNumber}, ${addr.landmark ? addr.landmark + ", " : ""}${addr.address}`,
  }))
  return userAddresses;
};

/**
 * @name deleteAddress
 * @description Deletes a customer address
 */
export const deleteAddress = async (userId: number, addressId: number) => {
  const address = await addressRepository.findAddressById(addressId);
  if (!address || address.userId !== userId) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.ADDRESS_NOT_FOUND);
  }

  await addressRepository.deleteAddress(addressId);
  return { success: true };
};
/**
 * @name getAddressById
 * @description Fetches a single address by ID
 */
export const getAddressById = async (userId: number, addressId: number) => {
  const address = await addressRepository.findAddressById(addressId);
  if (!address || address.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.ADDRESS_NOT_FOUND);
  }
  return address;
};


/**
 * @name getRecentSearches
 * @description Fetches recent searches for a customer
 */
export const getRecentSearches = async (userId: number) => {
  return await recentSearchRepository.findRecentSearchesByUserId(userId);
};

/**
 * @name saveRecentSearch
 * @description Saves a new recent search for a customer
 */
export const saveRecentSearch = async (userId: number, searchData: any) => {
  const data = {
    ...searchData,
    userId: userId,
  };

  const newSearch = await recentSearchRepository.createRecentSearch(data);
  // Cleanup: Keep only last 3
  await recentSearchRepository.deleteOldSearches(userId, 3);

  return newSearch;
};
