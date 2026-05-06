import { Op, col, fn } from "sequelize";
import { Booking, Service, ServicePartner, ServiceType, User } from "@/models";
import { BookingStatus } from "@/enums/transaction.enum";
import * as RoleRepository from "@/repositories/role.repository";
import { UserRole } from "@/enums/userRole.enum";
import { ServicePartnerStatus, VerificationStatus } from "@/enums/servicePartner.enum";

export const serviceRepository = {
  // Service Types
  getServiceTypes: async () => {
    return ServiceType.findAll({
      attributes: ["id", "name", "image"],
      order: [["createdAt", "DESC"]],
    });
  },

  // Booking counts grouped
  getPopularServiceIds: async (limit: number) => {
    return (await Booking.findAll({
      attributes: ["serviceId", [fn("COUNT", col("id")), "bookingCount"]],
      where: {
        status: {
          [Op.in]: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
      group: ["serviceId"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit,
      raw: true,
    })) as unknown as Array<{ serviceId: number | string }>;
  },

  // Services by IDs
  getServicesByIds: async (ids: number[]) => {
    if (!ids.length) return [];

    return Service.findAll({
      where: {
        availability: true,
        id: { [Op.in]: ids },
      },
      attributes: ["id", "name", "price", "images"],
    });
  },

  // Latest services (fallback or all)
  getLatestServices: async (limit: number, excludeIds: number[] = []) => {
    return Service.findAll({
      where: {
        availability: true,
        ...(excludeIds.length ? { id: { [Op.notIn]: excludeIds } } : {}),
      },
      attributes: ["id", "name", "price", "images"],
      order: [["createdAt", "DESC"]],
      limit,
    });
  },

  // Search
  searchServices: async (query: string, limit: number) => {
    return Service.findAll({
      where: {
        availability: true,
        name: { [Op.iLike]: `%${query}%` },
      },
      attributes: ["id", "name", "price", "images"],
      order: [["createdAt", "DESC"]],
      limit,
    });
  },

  /**
   * @name countGlobalCustomers
   * @description Returns the count of active users with the CUSTOMER role.
   */
  countGlobalCustomers: async (): Promise<number> => {
    try {
      const customerRoleId = await RoleRepository.getRoleIdByName(UserRole.CUSTOMER);
      if (!customerRoleId) return 0;

      return await User.count({
        where: {
          roleId: customerRoleId,
          isActive: true,
        },
      });
    } catch {
      return 0;
    }
  },

  /**
   * @name countActiveServices
   * @description Returns the count of services that are available.
   */
  countActiveServices: async (): Promise<number> => {
    try {
      return await Service.count({
        where: {
          availability: true,
        },
      });
    } catch {
      return 0;
    }
  },
  /**
   * @name countActivePartners
   * @description Returns the count of active users with the PARTNER role.
   */
  countActivePartners: async (): Promise<number> => {
    try {
      return await ServicePartner.count({
        where: {
          verificationStatus: VerificationStatus.VERIFIED
        },
      });
    } catch (error) {
      console.error("Error counting active partners:", error);
      return 0;
    }
  },
};
