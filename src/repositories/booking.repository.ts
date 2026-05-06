import {
  Booking,
  Payment,
  Service,
  ServicePartner,
  ServiceType,
  User,
  Offer,
} from "@/models";
import { FindAndCountOptions, WhereOptions, Includeable } from "sequelize";
import { INVOICE_BASE_NUM, INVOICE_PREFIX } from "@/constants";
export type BookingWithRelations = Booking & {
  service?: Service;
  serviceType?: ServiceType;
  servicePartner?: ServicePartner & {
    user?: User;
  };
  payment?: Payment;
};
export const findUserById = async (
  id: string | number
): Promise<User | null> => {
  return await User.findByPk(id);
};

export const findCustomerBookings = async (
  whereCondition: WhereOptions,
  safePage: number,
  safeLimit: number
): Promise<{ rows: BookingWithRelations[]; count: number }> => {
  const offset: number = (safePage - 1) * safeLimit;
  const options: FindAndCountOptions = {
    where: whereCondition,
    include: [
      {
        model: Service,
        as: "service",
        attributes: ["id", "name"],
        required: true,
      },
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id", "name"],
        required: false,
      },
      {
        model: ServicePartner,
        as: "servicePartner",
        attributes: ["id", "verificationStatus", "serviceTypeIds"],
        required: false,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["name", "mobileNumber", "profileImage"],
          },
        ],
      },
      {
        model: Payment,
        as: "payment",
        attributes: ["id", "paymentMethod", "paymentStatus", "currency"],
      },
    ],
    order: [
      ["bookingDate", "ASC"],
      ["id", "DESC"],
    ],
    limit: safeLimit,
    offset: offset,
    distinct: true,
  };
  const result = await Booking.findAndCountAll(options);

  return {
    rows: result.rows,
    count: result.count,
  };
};

export const findBookingWithDetails = async (
  where: WhereOptions,
  additionalIncludes: Includeable[] = []
): Promise<BookingWithRelations | null> => {
  return (await Booking.findOne({
    where,
    include: [
      { model: Service, as: "service" },
      { 
        model: Payment, 
        as: "payment",
        include: [{ model: Offer, as: "offer" }]
      },
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id", "name"]
      },
      {
        model: ServicePartner,
        as: "servicePartner",
        attributes: ["id", "verificationStatus", "serviceTypeIds"],
        include: [
          { 
            model: User, 
            as: "user", 
            attributes: ["name", "mobileNumber", "profileImage", "countryCode"] 
          }
        ],
      },
      {
        model: User,
        as: "customer",
        attributes: ["name"]
      },
      ...additionalIncludes,
    ],
  })) as BookingWithRelations | null;
};

export const generateInvoiceNumber = (bookingId: number): string => {
  return `${INVOICE_PREFIX}${INVOICE_BASE_NUM + bookingId}`;
};

export const getBookingIdFromInvoice = (invoiceNumber: string): number => {
  return (
    parseInt(invoiceNumber.replace(INVOICE_PREFIX, ""), 10) - INVOICE_BASE_NUM
  );
};
