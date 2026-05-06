import {
  Op,
  type Includeable,
  type WhereOptions,
  fn,
  col,
  CountOptions,
} from "sequelize";
import {
  Booking,
  Payment,
  Service,
  ServicePartner,
  ServiceType,
  User,
  Category,
  SubCategory,
} from "@/models";
import { BookingStatus } from "@/enums/transaction.enum";

export const adminBookingManagementRepository = {
  // ================= GROUPED BOOKINGS =================
  getGroupedBookings: async ({
    where,
    include,
    groupBy,
    having,
    orderExpr,
    sortOrder,
    limit,
    offset,
    attributes,
  }: {
    where: any;
    include: Includeable[];
    groupBy: any[];
    having?: WhereOptions;
    orderExpr: any;
    sortOrder: "ASC" | "DESC";
    limit: number;
    offset: number;
    attributes: any[];
  }) => {
    return Booking.findAll({
      where,
      include,
      attributes,
      group: groupBy,
      having,
      order: [[orderExpr, sortOrder]],
      limit,
      offset,
      subQuery: false,
      raw: true,
    });
  },

  countGroupedBookings: async ({
    where,
    include,
    groupBy,
    having,
  }: {
    where: any;
    include: Includeable[];
    groupBy: any[];
    having?: WhereOptions;
  }) => {
    const result = await Booking.count({
      where,
      include,
      group: groupBy,
      having,
      subQuery: false,
    } as unknown as CountOptions);

    return Array.isArray(result) ? result.length : Number(result);
  },

  // ================= DETAILS =================
  getBookingDetails: (
    groupOr: any[],
    serviceType?: string,
    paymentMethod?: any,
  ) => {
    return Booking.findAll({
      where: { [Op.or]: groupOr },
      attributes: [
        "id",
        "serviceId",
        "serviceTypeId",
        "userId",
        "servicePartnerId",
        "bookingDate",
        "serviceAddress",
        "status",
        [fn("DATE", col("Booking.booking_date")), "group_date"],
      ],
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "name"],
        },
        {
          model: ServiceType,
          as: "serviceType",
          attributes: ["id", "name"],
          required: Boolean(serviceType),
          where: serviceType
            ? { name: { [Op.iLike]: serviceType } }
            : undefined,
        },
        {
          model: ServicePartner,
          as: "servicePartner",
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "mobileNumber", "profileImage"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: [],
          required: Boolean(paymentMethod),
          where: paymentMethod ? { paymentMethod } : undefined,
        },
      ],
      order: [
        ["userId", "ASC"],
        ["bookingDate", "DESC"],
        ["id", "ASC"],
      ],
      raw: true,
      nest: true,
    });
  },

  getAdminBookingDetailsById: (id: number) =>
    Booking.findByPk(id, {
      attributes: [
        "id",
        "serviceId",
        "serviceTypeId",
        "userId",
        "servicePartnerId",
        "bookingDate",
        "status",
        "amount",
        "cancellationReason",
        "createdAt",
      ],
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "name", "commission"],
        },
        {
          model: ServiceType,
          as: "serviceType",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "name", "email", "mobileNumber", "profileImage"],
          required: false,
        },
        {
          model: ServicePartner,
          as: "servicePartner",
          attributes: ["id"],
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "id",
                "name",
                "email",
                "mobileNumber",
                "profileImage",
              ],
              required: false,
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "tax",
            "discount",
            "totalAmount",
            "currency",
            "paymentMethod",
            "paymentStatus",
            "paymentGateway",
            "orderId",
            "sessionId",
            "paymentIntentId",
            "paidAt",
          ],
          required: false,
        },
      ],
    }),

  // ================= BASIC =================
  findBookingById: (id: number) =>
    Booking.findByPk(id, {
      include: [
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "tax",
            "paymentMethod",
            "paymentStatus",
            "paymentIntentId",
            "orderId",
            "sessionId",
          ],
          required: false,
        },
      ],
    }),

  deleteBooking: (id: number) => Booking.destroy({ where: { id } }),

  updateBooking: (booking: Booking, payload: any) => booking.update(payload),

  updatePayment: (where: any, payload: any) =>
    Payment.update(payload, { where }),

  // ================= EXPERT =================
  findServicePartnerWithUser: (id: number) =>
    ServicePartner.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
    }),

  findServiceByIdWithRelations: (id: number) =>
    Service.findByPk(id, {
      attributes: ["id", "categoryId", "subCategoryId"],
      include: [
        {
          model: SubCategory,
          as: "subCategory",
          include: [
            {
              model: Category,
              as: "category",
              include: [
                { model: ServiceType, as: "serviceType", attributes: ["id"] },
              ],
            },
          ],
        },
      ],
    }),

  findCategoryWithServiceType: (id: number) =>
    Category.findByPk(id, {
      include: [{ model: ServiceType, as: "serviceType", attributes: ["id"] }],
    }),

  // ================= FILTER =================
  getServiceTypes: () =>
    ServiceType.findAll({
      attributes: ["name"],
      order: [["name", "ASC"]],
      raw: true,
    }),

  findServiceTypeByName: (name: string) =>
    ServiceType.findOne({
      where: { name: { [Op.iLike]: name } },
    }),

  findExpertsByServiceType: (
    serviceTypeId: number,
    verificationStatus: any,
    status: any,
  ) =>
    ServicePartner.findAll({
      where: {
        serviceTypeIds: {
          [Op.contains]: [serviceTypeId],
        },
        verificationStatus,
        status,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "isActive", "profileImage"],
        },
      ],
    }),
};
