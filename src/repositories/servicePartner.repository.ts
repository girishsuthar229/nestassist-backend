import {
    User,
    ServicePartner,
    ServicePartnerEducation,
    ServicePartnerExperience,
    ServicePartnerSkill,
    ServicePartnerService,
    ServicePartnerLanguage,
    ServicePartnerDocument,
    ServiceType,
    Category,
    SubCategory,
    Service,
    Role
  } from "../models";
  import Booking from "@/models/booking.model";
  import { BookingStatus } from "@/enums/transaction.enum";
  import { fn, col, Transaction, WhereOptions } from "sequelize";
import { Op } from "sequelize";
  
  /**
   * @name findUserByEmailOrMobile
   * @description
   * Fetches a user that matches either the provided email OR the mobile number.
   * @access Private
   */
    export const findUsersByEmailOrMobile = async (email: string, mobile: string, transaction?: Transaction) => {
      const { Op } = require("sequelize"); 
      return await User.findAll({
        where: {
          [Op.or]: [{ email }, { mobileNumber: mobile }]
        },
        attributes: ["id", "name", "email", "mobileNumber", "roleId", "isActive"],
        transaction
      });
    };
  
  /**
   * @name createUser
   * @description
   * Creates a new user record.
   * @access Private
   */
  export const createUser = async (data: any, transaction?: Transaction) => {
    return await User.create(data, { transaction });
  };

  /**
   * @name findUserByEmail
   * @description
   * Fetches a user by their email address.
   * @access Private
   */
  export const findUserByEmail = async (email: string, transaction?: Transaction) => {
    return await User.findOne({
      where: { email: email.toLowerCase().trim() },
      transaction
    });
  };

  
  /**
   * @name createServicePartner
   * @description
   * Creates a new service partner record.
   * @access Private
   */
  export const createServicePartner = async (data: any, transaction?: Transaction) => {
    return await ServicePartner.create(data, { transaction });
  };
  
  /**
   * @name findServicePartnerByUserId
   * @description
   * Fetches a service partner by their associated user ID.
   * @access Private
   */
  export const findServicePartnerByUserId = async (userId: number, transaction?: Transaction) => {
    return await ServicePartner.findOne({
      where: { userId },
      attributes: ["id"],
      transaction
    });
  };
  
  /**
   * @name bulkCreateEducation
   * @description
   * Creates multiple education records for a service partner.
   * @access Private
   */
  export const bulkCreateEducation = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerEducation.bulkCreate(data, { transaction });
  };
  
  /**
   * @name bulkCreateExperience
   * @description
   * Creates multiple experience records for a service partner.
   * @access Private
   */
  export const bulkCreateExperience = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerExperience.bulkCreate(data, { transaction });
  };
  
  /**
   * @name bulkCreateSkills
   * @description
   * Creates multiple skill records for a service partner.
   * @access Private
   */
  export const bulkCreateSkills = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerSkill.bulkCreate(data, { transaction });
  };
  
  /**
   * @name bulkCreateServices
   * @description
   * Creates multiple service records for a service partner.
   * @access Private
   */
  export const bulkCreateServices = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerService.bulkCreate(data, { transaction });
  };
  
  /**
   * @name bulkCreateLanguages
   * @description
   * Creates multiple language records for a service partner.
   * @access Private
   */
  export const bulkCreateLanguages = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerLanguage.bulkCreate(data, { transaction });
  };
  
  /**
   * @name bulkCreateDocuments
   * @description
   * Creates multiple document records for a service partner.
   * @access Private
   */
  export const bulkCreateDocuments = async (data: any[], transaction?: Transaction) => {
    return await ServicePartnerDocument.bulkCreate(data, { transaction });
  };
  
  /**
   * @name findAllServicePartners
   * @description
   * Fetches a paginated list of service partners with optional filtering and sorting.
   * Includes jobs completed count and associated user/service type info.
   * @access Private | Role-based
   */
  export const findAllServicePartners = async (options: {
    where: WhereOptions;
    userWhere?: WhereOptions;
    order: any[];
    limit: number;
    offset: number;
    having?: any;
  }) => {
    const result = await ServicePartner.findAndCountAll({
      where: options.where,
      attributes: [
        "id",
        "userId",
        "serviceTypeIds",
        "permanentAddress",
        "verificationStatus",
        "status",
        "createdAt",
        [
          fn("COUNT", col("bookings.id")),
          "jobsCompleted"
        ]
      ],
      include: [
        {
          model: Booking,
          as: "bookings",
          attributes: [],
          required: false,
          where: {
            status: BookingStatus.COMPLETED
          }
        },
        {
          model: User,
          as: "user",
          where: options.userWhere,
          attributes: ["id", "name", "email", "mobileNumber", "profileImage", "isActive"],
        },
      ],
      group: ["ServicePartner.id", "user.id", "user.name"],
      having: options.having,
      order: options.order,
      limit: options.limit,
      offset: options.offset,
      subQuery: false,
    });
    // Manually resolve serviceTypeIds → serviceTypes array (no FK association since column is INTEGER[])
    if (result.rows.length > 0) {
      const typeIdsToFetch = new Set<number>();
      result.rows.forEach((r: any) => {
        const ids = (r.getDataValue("serviceTypeIds") ?? []) as number[];
        ids.forEach((id) => typeIdsToFetch.add(id));
      });

      if (typeIdsToFetch.size > 0) {
        const serviceTypes = await ServiceType.findAll({
          where: { id: Array.from(typeIdsToFetch) },
          attributes: ["id", "name"],
        });
        const typeMap = new Map<number, { id: number; name: string }>(
          serviceTypes.map((t: any) => [t.id, { id: t.id, name: t.name }])
        );

        result.rows.forEach((r: any) => {
          const ids = (r.getDataValue("serviceTypeIds") ?? []) as number[];
          r.setDataValue(
            "serviceTypes",
            ids.map((id) => typeMap.get(id)).filter(Boolean)
          );
        });
      }
    }

    return result;
  };
  
  /**
   * @name findServicePartnerByPk
   * @description
   * Fetches essential service partner fields (id, userId, verificationStatus, status) by primary key.
   * @access Private
   */
  export const findServicePartnerByPk = async (id: number, options: any = {}) => {
    return await ServicePartner.findByPk(id, {
      attributes: ["id", "userId", "verificationStatus", "status"],
      ...options
    });
  };
  
  /**
   * @name findUserByPk
   * @description
   * Fetches essential user fields (id, name, email, role, isActive, rememberToken) by primary key.
   * @access Private
   */
  export const findUserByPk = async (id: number, options: any = {}) => {
    return await User.findByPk(id, {
      attributes: ["id", "name", "email", "roleId", "isActive", "rememberToken"],
      ...options
    });
  };
  
  /**
   * @name findServicePartnerWithDetails
   * @description
   * Fetches a service partner by ID with all associated details (education, experience, skills, etc.).
   * @access Private
   */
  export const findServicePartnerWithDetails = async (id: number, transaction?: Transaction) => {
    const partner = await ServicePartner.findByPk(id, {
      transaction,
      attributes: [
        "id",
        "userId",
        "dob",
        "gender",
        "serviceTypeIds",
        "permanentAddress",
        "residentialAddress",
        "verificationStatus",
        "status",
        "createdAt"
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'isActive', 'mobileNumber', 'profileImage']
        },
        {
          model: ServicePartnerEducation,
          as: 'educations',
          attributes: ['id', 'schoolCollege', 'passingYear', 'marks'],
          separate: true
        },
        {
          model: ServicePartnerExperience,
          as: 'experiences',
          attributes: ['id', 'companyName', 'role', 'from', 'to'],
          separate: true
        },
        {
          model: ServicePartnerSkill,
          as: 'skills',
          attributes: ['id', 'categoryId'],
          separate: true,
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }]
        },
        {
          model: ServicePartnerService,
          as: 'services',
          attributes: ['id', 'subCategoryId'],
          separate: true,
          include: [{
            model: SubCategory,
            as: 'subCategory',
            attributes: ['id', 'name']
          }]
        },
        {
          model: ServicePartnerLanguage,
          as: 'languages',
          attributes: ['id', 'language', 'proficiency'],
          separate: true
        },
        {
          model: ServicePartnerDocument,
          as: 'documents',
          attributes: ['id', 'documentUrl', 'documentName', 'size'],
          separate: true
        }
      ]
    });

    if (partner) {
      const typeIds = (partner.getDataValue("serviceTypeIds") ?? []) as number[];
      if (typeIds.length > 0) {
        const serviceTypes = await ServiceType.findAll({
          where: { id: typeIds },
          attributes: ["id", "name"],
        });
        const typeMap = new Map<number, { id: number; name: string }>(
          serviceTypes.map((t: any) => [t.id, { id: t.id, name: t.name }])
        );
        partner.setDataValue(
          "serviceTypes",
          typeIds.map((id: number) => typeMap.get(id)).filter(Boolean)
        );
      } else {
        partner.setDataValue("serviceTypes", []);
      }
    }
    return partner;
  };
  
  /**
   * @name findAssignedBookings
   * @description
   * Fetches a paginated list of bookings assigned to a specific service partner.
   * @access Private
   */
  export const findAssignedBookings = async (options: {
    where: WhereOptions;
    limit: number;
    offset: number;
  }) => {
    return await Booking.findAndCountAll({
      where: options.where,
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "name"]
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "name"]
        }
      ],
      order: [["bookingDate", "DESC"]],
      limit: options.limit,
      offset: options.offset,
      distinct: true
    });
  };


/**
 * @name findUserById
 * @description Get full user model instance
 */
export const findUserById = async (
  userId: number,
  transaction?: Transaction
) => {
  return await User.findByPk(userId, {
    transaction,
    include: [
      { 
        model: Role, 
        as: "role" 
      }
    ],
  });
};


/**
 * @name syncServicePartnerSkills
 * @description Sync multiple categories (skills) for a partner
 */
export const syncServicePartnerSkills = async (
  partnerId: number,
  categoryIds: number[],
  transaction?: Transaction
) => {
  const data = categoryIds.map((id) => ({ partnerId, categoryId: id }));
  return await ServicePartnerSkill.bulkCreate(data, { transaction });
};

/**
 * @name syncServicePartnerSubcategories
 * @description Sync multiple subcategories (services) for a partner
 */
export const syncServicePartnerSubcategories = async (
  partnerId: number,
  subcategoryIds: number[],
  transaction?: Transaction
) => {
  const data = subcategoryIds.map((id) => ({ partnerId, subcategoryId: id }));

  return await SubCategory.bulkCreate(data, { transaction });
};

/**
 * @name hasPendingServices
 * @description Check pending bookoing for a partner
 */
export const hasPendingServices = async (
  servicePartnerId: number,
  t: Transaction
) => {
  return await Booking.count({
    where: {
      servicePartnerId,
      status: BookingStatus.PENDING,
    },
    transaction: t,
  });
};

/**
 * @name findServicePartnerProfileByUserId
 * @description Get full service partner profile using userId
 */
export const findServicePartnerProfileByUserId = async (
  userId: number,
  transaction?: Transaction
) => {
  const partner = await ServicePartner.findOne({
    where: { userId },
    transaction,
    attributes: [
      "id",
      "userId",
      "dob",
      "gender",
      "serviceTypeIds",
      "permanentAddress",
      "residentialAddress",
      "verificationStatus",
      "status",
      "createdAt",
    ],
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "name",
          "email",
          "isActive",
          "mobileNumber",
          "profileImage",
        ],
      },
      {
        model: ServicePartnerEducation,
        as: "educations",
        attributes: ["id", "schoolCollege", "passingYear", "marks"],
        separate: true,
      },
      {
        model: ServicePartnerExperience,
        as: "experiences",
        attributes: ["id", "companyName", "role", "from", "to"],
        separate: true,
      },
      {
        model: ServicePartnerSkill,
        as: "skills",
        attributes: ["id", "categoryId"],
        separate: true,
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: ServicePartnerService,
        as: "services",
        attributes: ["id", "subCategoryId"],
        separate: true,
        include: [
          {
            model: SubCategory,
            as: "subCategory",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: ServicePartnerLanguage,
        as: "languages",
        attributes: ["id", "language", "proficiency"],
        separate: true,
      },
      {
        model: ServicePartnerDocument,
        as: "documents",
        attributes: ["id", "documentUrl", "documentName", "size"],
        separate: true,
      },
    ],
  });

  if (!partner) return null;

  const typeIds = partner.serviceTypeIds ?? [];

  let serviceTypes: any[] = [];

  if (typeIds.length > 0) {
    const serviceTypesFromDb = await ServiceType.findAll({
      where: { id: typeIds },
      attributes: ["id", "name"],
    });

    const map = new Map(
      serviceTypesFromDb.map((t) => [t.id, { id: t.id, name: t.name }])
    );

    serviceTypes = typeIds.map((id) => map.get(id)).filter(Boolean);
  }

  (partner as any).dataValues.serviceTypes = serviceTypes;

  return partner;
};
