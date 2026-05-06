import { Op, col, fn, literal } from "sequelize";
import {
  Address,
  Booking,
  Payment,
  Service,
  ServicePartner,
  ServicePartnerService,
  ServiceType,
  User,
} from "@/models";
import { BookingStatus } from "@/enums/transaction.enum";
import {
  AdminWeeklyStats,
  AdminWeeklyStatsRevenue,
  PartnerBookingStats,
} from "@/interfaces/adminDashboard.interface";

export const dashboardRepository = {
  // ================= ADMIN DASHBOARD =================

  getBookingsWithRelations: (start: Date, end: Date) => {
    return Booking.findAll({
      raw: false,
      where: {
        status: BookingStatus.COMPLETED,
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "name"],
          required: false,
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
          attributes: ["id", "residentialAddress", "permanentAddress"],
        },
        {
          model: Address,
          as: "address",
          attributes: ["city"],
          required: false,
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["currency"],
          required: false,
        },
      ],
      attributes: [
        "id",
        "createdAt",
        "userId",
        "servicePartnerId",
        "serviceId",
        "amount",
        "address_id",
      ],
    });
  },

  countBookings: (where: any) => Booking.count({ where }),

  getTopPartnersRaw: () =>
    Booking.findAll({
      attributes: [
        "servicePartnerId",
        [fn("COUNT", col("id")), "bookingCount"],
      ],
      where: {
        status: BookingStatus.COMPLETED,
        servicePartnerId: { [Op.ne]: null },
      },
      group: ["servicePartnerId"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit: 5,
      raw: true,
    }),

  getPartnersWithUsers: (ids: number[]) => {
    if (!ids.length) return [];
    return ServicePartner.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        { model: User, as: "user", attributes: ["name", "profileImage"] },
      ],
      attributes: ["id"],
    });
  },

  getWeeklyBookingStats: async (
    currentStart: Date,
    currentEnd: Date,
    prevStart: Date,
    prevEnd: Date,
  ) => {
    const result = (await Booking.findOne({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "currentWeek",
        ],
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "previousWeek",
        ],
        [fn("COUNT", col("id")), "totalCount"],
      ],
      where: {
        status: BookingStatus.COMPLETED,
      },
      raw: true,
    })) as unknown as AdminWeeklyStats;

    return {
      current: Number(result?.currentWeek || 0),
      previous: Number(result?.previousWeek || 0),
      total: Number(result.totalCount || 0),
    };
  },

  getWeeklyUserStats: async (
    roleId: number,
    currentStart: Date,
    currentEnd: Date,
    prevStart: Date,
    prevEnd: Date,
  ) => {
    const result = (await User.findOne({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "currentWeek",
        ],
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "previousWeek",
        ],
        [fn("COUNT", col("id")), "totalCount"],
      ],
      where: { roleId },
      raw: true,
    })) as unknown as AdminWeeklyStats;

    return {
      current: Number(result?.currentWeek || 0),
      previous: Number(result?.previousWeek || 0),
      total: Number(result.totalCount || 0),
    };
  },

  getWeeklyPartnerStats: async (
    currentStart: Date,
    currentEnd: Date,
    prevStart: Date,
    prevEnd: Date,
  ) => {
    const result = (await ServicePartner.findOne({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "currentWeek",
        ],
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}' 
            THEN 1 ELSE 0 END`),
          ),
          "previousWeek",
        ],
        [fn("COUNT", col("id")), "totalCount"],
      ],
      raw: true,
    })) as unknown as AdminWeeklyStats;

    return {
      current: Number(result?.currentWeek || 0),
      previous: Number(result?.previousWeek || 0),
      total: Number(result.totalCount || 0),
    };
  },

  getWeeklyRevenueStats: async (
    currentStart: Date,
    currentEnd: Date,
    prevStart: Date,
    prevEnd: Date,
  ) => {
    const result = (await Booking.findOne({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}' 
            THEN amount ELSE 0 END`),
          ),
          "currentWeek",
        ],
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}' 
            THEN amount ELSE 0 END`),
          ),
          "previousWeek",
        ],
        [fn("SUM", col("amount")), "totalAmount"],
      ],
      where: {
        status: BookingStatus.COMPLETED,
      },
      raw: true,
    })) as unknown as AdminWeeklyStatsRevenue;

    return {
      current: Number(result?.currentWeek || 0),
      previous: Number(result?.previousWeek || 0),
      total: Number(result?.totalAmount || 0),
    };
  },

  // ================= PARTNER DASHBOARD =================

  getPartnerSubCategories: (partnerId: number) =>
    ServicePartnerService.findAll({
      where: { partnerId },
      attributes: ["subCategoryId"],
    }),

  countServicesBySubCategories: (subCategoryIds: number[]) => {
    if (!subCategoryIds.length) return 0;
    return Service.count({
      where: {
        subCategoryId: { [Op.in]: subCategoryIds },
        availability: true,
      },
    });
  },

  getPartnerBookings: (partnerId: number, start: Date, end: Date) => {
    return Booking.findAll({
      where: {
        servicePartnerId: partnerId,
        status: BookingStatus.COMPLETED,
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        { model: Service, as: "service", attributes: ["id", "name"] },
        { model: Payment, as: "payment", attributes: ["currency"] },
      ],
      attributes: ["id", "createdAt", "amount", "serviceId"],
    });
  },

  getPartnerBookingStatsAggregated: async (
    partnerId: number,
    currentStart: Date,
    currentEnd: Date,
    prevStart: Date,
    prevEnd: Date,
  ) => {
    const result = (await Booking.findOne({
      attributes: [
        //Completed - current
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            AND "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}'
            THEN 1 ELSE 0 END`),
          ),
          "currentCompleted",
        ],

        //Completed - previous
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            AND "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}'
            THEN 1 ELSE 0 END`),
          ),
          "previousCompleted",
        ],

        //Future - current
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status IN ('${BookingStatus.PENDING}', '${BookingStatus.CONFIRMED}')
            AND "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}'
            THEN 1 ELSE 0 END`),
          ),
          "currentFuture",
        ],

        //Future - previous
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status IN ('${BookingStatus.PENDING}', '${BookingStatus.CONFIRMED}')
            AND "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}'
            THEN 1 ELSE 0 END`),
          ),
          "previousFuture",
        ],

        //Total completed
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            THEN 1 ELSE 0 END`),
          ),
          "totalCompleted",
        ],

        //Total future
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status IN ('${BookingStatus.PENDING}', '${BookingStatus.CONFIRMED}')
            THEN 1 ELSE 0 END`),
          ),
          "totalFuture",
        ],

        //Revenue - current
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            AND "created_at" BETWEEN '${currentStart.toISOString()}' AND '${currentEnd.toISOString()}'
            THEN amount ELSE 0 END`),
          ),
          "currentRevenue",
        ],

        //Revenue - previous
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            AND "created_at" BETWEEN '${prevStart.toISOString()}' AND '${prevEnd.toISOString()}'
            THEN amount ELSE 0 END`),
          ),
          "previousRevenue",
        ],

        //Total Revenue
        [
          fn(
            "SUM",
            literal(`CASE 
            WHEN status = '${BookingStatus.COMPLETED}'
            THEN amount ELSE 0 END`),
          ),
          "totalRevenue",
        ],
      ],
      where: {
        servicePartnerId: partnerId,
      },
      raw: true,
    })) as unknown as PartnerBookingStats;

    return {
      currentCompleted: Number(result?.currentCompleted || 0),
      previousCompleted: Number(result?.previousCompleted || 0),
      currentFuture: Number(result?.currentFuture || 0),
      previousFuture: Number(result?.previousFuture || 0),
      totalCompleted: Number(result?.totalCompleted || 0),
      totalFuture: Number(result?.totalFuture || 0),
      currentRevenue: Number(result?.currentRevenue || 0),
      previousRevenue: Number(result?.previousRevenue || 0),
      totalRevenue: Number(result?.totalRevenue || 0),
    };
  },
};
