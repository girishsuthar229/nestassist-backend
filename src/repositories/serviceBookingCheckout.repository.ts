import { Op, WhereOptions } from "sequelize";
import {
  Booking,
  Payment,
  Service,
  User,
  ServicePartner,
  ServicePartnerService,
  SubCategory,
  Category,
  ServiceType,
  Offer,
  Address,
  Role,
} from "@/models";
import { BookingStatus, PaymentStatus } from "@/enums/transaction.enum";
import {
  VerificationStatus,
  ServicePartnerStatus,
} from "@/enums/servicePartner.enum";
import sequelize from "../configs/db";
import { UserRole } from "@/enums/userRole.enum";

/**
 * Finds eligible service partners for a specific category.
 */
export const findEligiblePartners = async (
  subCategoryId: number,
  serviceId: number,
) => {
  const servicePartnerId = await findServicePartnerByService(
    serviceId,
    subCategoryId,
  );
  if (servicePartnerId) {
    return [{id: servicePartnerId}];
  }

  return findEligiblePartnersBySubCategory(subCategoryId);
};

const findServicePartnerByService = async (
  serviceId: number,
  subCategoryId: number,
) => {
  const service = await Service.findOne({
    attributes: ["createdBy"],
    where: {
      id: serviceId,
      subCategoryId,
      availability: true,
    },
  });

  if (!service?.createdBy) {
    return null;
  }

  const user = await User.findOne({
    attributes: ["id"],
    where: { id: service.createdBy },
    include: [
      {
        model: Role,
        as: "role",
        where: { name: UserRole.SERVICE_PARTNER },
        required: true,
      },
    ],
  });

  if (!user) {
    return null;
  }

  const servicePartner = await ServicePartner.findOne({
    attributes: ["id"],
    where: {
      userId: user.id,
      status: ServicePartnerStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  return servicePartner ? servicePartner.id : null;
};

const findEligiblePartnersBySubCategory = async (subCategoryId: number) => {
  const partners = await ServicePartner.findAll({
    attributes: ["id", "status", "verificationStatus"],
    where: {
      status: ServicePartnerStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["name", "profileImage"],
        required: true,
      },
      {
        model: ServicePartnerService,
        as: "services",
        where: { subCategoryId },
        required: true,
        attributes: [],
      },
    ],
  });

  return partners;
};

/**
 * Finds all relevant bookings for a list of partner IDs.
 */
export const findRelevantBookings = async (partnerIds: number[]) => {
  return await Booking.findAll({
    where: {
      servicePartnerId: { [Op.in]: partnerIds },
      status: {
        [Op.in]: [BookingStatus.PENDING],
      },
    },
    attributes: ["servicePartnerId", "bookingDate", "serviceDuration"],
  });
};

/**
 * Finds a paid payment record for a specific user, service, and slot.
 */
export const findPaidPayment = async (
  userId: number,
  serviceId: number,
  slot: { date: string; time: string },
) => {
  return await Payment.findOne({
    where: {
      userId,
      serviceId,
      slot,
      paymentStatus: PaymentStatus.PAID,
    },
  });
};

/**
 * Finds a pending payment record for a specific user, service, and slot.
 */
export const findPendingPayment = async (
  userId: number,
  serviceId: number,
  slot: { date: string; time: string },
) => {
  return await Payment.findOne({
    where: {
      userId,
      serviceId,
      paymentStatus: PaymentStatus.PENDING,
      slot: {
        [Op.contains]: slot,
      },
    } as WhereOptions,
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Finds a booking by its associated payment ID.
 */
export const findBookingByPaymentId = async (paymentId: number) => {
  return await Booking.findOne({
    where: { paymentId },
  });
};

/**
 * Finds a service with its full category and service type context.
 */
export const findServiceWithContext = async (serviceId: number) => {
  return await Service.findByPk(serviceId, {
    include: [
      {
        model: SubCategory,
        as: "subCategory",
        attributes: ["id"],
        required: false,
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id"],
            required: false,
            include: [
              {
                model: ServiceType,
                as: "serviceType",
                attributes: ["id", "name"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });
};

/**
 * Finds a category with its associated service type.
 */
export const findCategoryWithServiceType = async (categoryId: number) => {
  return await Category.findByPk(categoryId, {
    attributes: ["id"],
    include: [
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id"],
        required: true,
      },
    ],
  });
};

/**
 * Finds an offer by its primary key.
 */
export const findOfferById = async (id: number) => {
  return await Offer.findByPk(id);
};

/**
 * Finds an address by its primary key.
 */
export const findAddressById = async (id: number) => {
  return await Address.findByPk(id);
};

/**
 * Finds a user by its primary key.
 */
export const findUserById = async (id: number) => {
  return await User.findByPk(id);
};

/**
 * Finds a partner by its primary key.
 */
export const findPartnerById = async (id: number) => {
  return await ServicePartner.findByPk(id);
};

/**
 * Performs a transactional creation of both booking and payment records.
 */
export const createBookingAndPaymentWithTransaction = async (
  bookingData: Partial<Booking>,
  paymentData: Partial<Payment>,
) => {
  return await sequelize.transaction(async (transaction) => {
    const booking = await Booking.create(bookingData, { transaction });
    const payment = await Payment.create(
      { ...paymentData, bookingStatus: BookingStatus.PENDING } as Payment,
      { transaction },
    );
    await booking.update({ paymentId: payment.id }, { transaction });
    return { booking, payment };
  });
};

/**
 * Updates a payment record.
 */
export const updatePayment = async (
  paymentId: number,
  data: Partial<Payment>,
) => {
  return await Payment.update(data, { where: { id: paymentId } });
};

/**
 * Retrieves a booking record along with its associated payment details.
 */
export const findBookingWithPayment = async (bookingId: number) => {
  return await Booking.findOne({
    where: { id: bookingId },
    include: [
      {
        model: Payment,
        as: "payment",
        attributes: [
          "slot",
          "addressId",
          "paymentMethod",
          "paymentGateway",
          "paymentStatus",
          "sessionId",
          "orderId",
          "paymentIntentId",
          "clientSecret",
          "couponId",
          "currency",
          "totalAmount",
        ],
      },
    ],
    attributes: [
      "id",
      "userId",
      "paymentId",
      "serviceId",
      "servicePartnerId",
      "bookingDate",
      "status",
      "serviceDuration",
      "expiresAt",
      "cancellationReason",
      "amount",
    ],
  });
};

/**
 * Finds a booking by its primary key.
 */
export const findBookingById = async (id: number) => {
  return await Booking.findByPk(id);
};

/**
 * Finds a payment by its primary key.
 */
export const findPaymentById = async (id: number) => {
  return await Payment.findByPk(id);
};

/**
 * Performs a transactional update of both booking and payment records.
 */
export const updateBookingAndPaymentWithTransaction = async (
  booking: Booking,
  payment: Payment,
  bookingData: Partial<Booking>,
  paymentData: Partial<Payment>,
) => {
  return await sequelize.transaction(async (transaction) => {
    await booking.update(bookingData, { transaction });
    await payment.update(paymentData, { transaction });
  });
};
