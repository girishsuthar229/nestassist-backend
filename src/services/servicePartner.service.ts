import { Order, Transaction, where } from "sequelize";
import sequelize from "../configs/db";
import * as servicePartnerRepository from "../repositories/servicePartner.repository";
import * as roleRepository from "../repositories/role.repository";
import { User, ServicePartner, ServicePartnerDocument } from "../models";
import { ApiError } from "../utils/apiError.util";
import { Op, fn, col, literal } from "sequelize";
import { RegisterServicePartnerDto, ServicePartnerFilesDto } from "@/dtos/servicePartner.dto";
import { ServicePartnerStatus, VerificationStatus } from "@/enums/servicePartner.enum";
import { UserRole } from "@/enums/userRole.enum";
import jwt from "jsonwebtoken";
import { sendPartnerApprovalEmail, sendPartnerRejectionEmail } from "../utils/mail.util";
import logger from "../utils/logger";
import { deleteImage } from "@/utils/cloudinary.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { AssignedBookingsQuery, IPartnerDocument, IPartnerEducation, IPartnerExperience, IPartnerLanguage, ServicePartnerQuery } from "@/interfaces/servicePartner.interface";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @name registerPartner
 * @description
 * Handles the registration of a new service partner, including creating a user record, 
 * partner profile, and associated details like education, skills, and documents.
 * @access Public
 */
export const registerPartner = async (data: RegisterServicePartnerDto, files: ServicePartnerFilesDto) => {
  const t: Transaction = await sequelize.transaction();
    try {
      // 1. Get Role ID for Service Partner
      const spRole = await roleRepository.findRoleByName(UserRole.SERVICE_PARTNER);
      if (!spRole) {
        throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, MESSAGES.ROLE.NOT_FOUND);
      }

      // 2. Create or Find User
      const existingUsers = await servicePartnerRepository.findUsersByEmailOrMobile(data.email, data.mobile, t);
      
      // Separate our targets
      const userByEmail = existingUsers.find(u => u.email === data.email);
      const userByMobile = existingUsers.find(u => u.mobileNumber === data.mobile);

      // Conflict: The mobile number is already taken by a different user account
      if (userByMobile && (!userByEmail || userByEmail.id !== userByMobile.id)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.USER.USER_MOBILE_EXISTS);
      }

      let user = userByEmail;
      
      if (user) {
        if (user.roleId === spRole.id) {
          const existingPartner = await servicePartnerRepository.findServicePartnerByUserId(user.id, t);
          if (existingPartner) {
            throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.EXPERT.PROFILE_EXISTS);
          }
        } else {
          user.roleId = spRole.id;
        }
        
        // Update user details regardless of previous role
        user.mobileNumber = data.mobile;
        user.profileImage = files.profileImage?.[0]?.path;
        user.cloudinaryId = files.profileImage?.[0]?.cloudinaryId;
        await user.save({ transaction: t });

      } else {
        user = await servicePartnerRepository.createUser({
          name: data.fullName,
          email: data.email,
          roleId: spRole.id,
          mobileNumber: data.mobile,
          profileImage: files.profileImage?.[0]?.path,
          cloudinaryId: files.profileImage?.[0]?.cloudinaryId,
          isActive: false
        }, t);
      }
  
      // 3. Format Data for ServicePartner
      const [day, month, year] = data.dob.split('/');
      const formattedDob = `${year}-${month}-${day}`;
      const capitalizedGender = data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase();
  
      // 4. Create ServicePartner
      const partner = await servicePartnerRepository.createServicePartner({
        userId: user.id,
        dob: formattedDob,
        gender: capitalizedGender,
        serviceTypeIds: data.applyingFor,
        permanentAddress: data.permanentAddress,
        residentialAddress: data.residentialAddress,
        verificationStatus: VerificationStatus.PENDING,
        status: ServicePartnerStatus.INACTIVE
      }, t);
  
      // 4. Create Educations
      if (data.education && data.education.length > 0) {
        const educations = data.education.map((edu: IPartnerEducation) => ({
          partnerId: partner.id,
          schoolCollege: edu.school,
          passingYear: edu.year,
          marks: edu.marks.toString()
        }));
        await servicePartnerRepository.bulkCreateEducation(educations, t);
      }
  
      // 5. Create Experiences (Professional)
      if (data.professional && data.professional.length > 0) {
        const experiences = data.professional.map((exp: IPartnerExperience) => ({
          partnerId: partner.id,
          companyName: exp.company,
          role: exp.role,
          from: exp.from,
          to: exp.to
        }));
        await servicePartnerRepository.bulkCreateExperience(experiences, t);
      }
  
      // 6. Create Skills
      if (data.skills && data.skills.length > 0) {
        const skills = data.skills.map((catId: number) => ({
          partnerId: partner.id,
          categoryId: catId
        }));
        await servicePartnerRepository.bulkCreateSkills(skills, t);
      }
  
      // 7. Create Services (Services Offered)
      if (data.servicesOffered && data.servicesOffered.length > 0) {
        const services = data.servicesOffered.map((subCatId: number) => ({
          partnerId: partner.id,
          subCategoryId: subCatId
        }));
        await servicePartnerRepository.bulkCreateServices(services, t);
      }
  
      // 8. Create Languages
      if (data.languages && data.languages.length > 0) {
        const languages = data.languages.map((lang: IPartnerLanguage) => {
          const capitalizedProficiency = lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1).toLowerCase();
          const proficiencyValue = capitalizedProficiency === 'Advanced' ? 'Expert' : capitalizedProficiency;
          
          return {
            partnerId: partner.id,
            language: lang.language.charAt(0).toUpperCase() + lang.language.slice(1).toLowerCase(),
            proficiency: proficiencyValue
          };
        });
        await servicePartnerRepository.bulkCreateLanguages(languages, t);
      }
  
      // 9. Create Documents (Attachments)
      if (files.attachments && files.attachments.length > 0) {
        const documents = files.attachments.map((doc: IPartnerDocument) => ({
          partnerId: partner.id,
          documentUrl: doc.path,
          documentName: doc.originalname,
          size: doc.size,
          cloudinaryId: doc.cloudinaryId
        }));
        await servicePartnerRepository.bulkCreateDocuments(documents, t);
      }
  
      await t.commit();
      return {
        message: MESSAGES.AUTH.REGISTER_SUCCESS,
        partnerId: partner.id,
        userId: user.id
      };
  
    } catch (error) {
      await t.rollback();
      throw error;
    }
};

/**
 * @name getServicePartners
 * @description
 * Fetches a paginated list of service partners with filtering options.
 * @access Private (Admin)
 */
export const getServicePartners = async (query: ServicePartnerQuery) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "id",
    sortOrder = "DESC",
    serviceTypeId,
    status,
    minJobs,
    maxJobs,
  } = query;

  const offset = (Number(page) - 1) * Number(limit);

  const filterConditions: any = {};
  const userFilterConditions: any = {};

  if (serviceTypeId) {
    filterConditions.serviceTypeIds = { [Op.overlap]: [Number(serviceTypeId)] };
  }

  if (status) {
    if (status === VerificationStatus.PENDING) {
      filterConditions.verificationStatus = VerificationStatus.PENDING;
    } else if (status === VerificationStatus.REJECTED) {
      filterConditions.verificationStatus = VerificationStatus.REJECTED;
    } else if (status === ServicePartnerStatus.ACTIVE) {
      filterConditions.verificationStatus = VerificationStatus.VERIFIED;
      userFilterConditions.isActive = true;
    } else if (status === ServicePartnerStatus.INACTIVE) {
      filterConditions.verificationStatus = VerificationStatus.VERIFIED;
      userFilterConditions.isActive = false;
    }
  }

  const allowedSortFields = ["id", "name", "createdAt", "jobsCompleted"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "id";

  const order: Order = [];

  if (sortField === "jobsCompleted") {
    order.push([
      literal('COUNT("bookings"."id")'),
      sortOrder === "ASC" ? "ASC" : "DESC",
    ]);
  } else if (sortField === "name") {
    order.push([
      { model: User, as: "user" },
      "name",
      sortOrder === "ASC" ? "ASC" : "DESC",
    ]);
  } else {
    order.push([sortField, sortOrder === "ASC" ? "ASC" : "DESC"]);
  }

  const { rows, count: totalItems } = await servicePartnerRepository.findAllServicePartners({
    where: filterConditions,
    userWhere: Object.keys(userFilterConditions).length ? userFilterConditions : undefined,
    order,
    limit: Number(limit),
    offset,
    having: minJobs || maxJobs
        ? literal(`
          COUNT(bookings.id) ${
            minJobs ? `>= ${Number(minJobs)}` : ""
          }
          ${minJobs && maxJobs ? "AND" : ""}
          ${maxJobs ? `COUNT(bookings.id) <= ${Number(maxJobs)}` : ""}
        `)
        : undefined,
  });

  const data = rows.map((row: any) => {
    const partner = row.get({ plain: true });
    let displayedStatus = "";

    if (partner.verificationStatus === VerificationStatus.VERIFIED) {
      displayedStatus = partner.user?.isActive
        ? ServicePartnerStatus.ACTIVE
        : ServicePartnerStatus.INACTIVE;
    } else {
      displayedStatus = partner.verificationStatus;
    }

    return {
      ...partner,
      displayedStatus,
    };
  });

  return {
    data,
    pagination: {
      currentPage: Number(page),
      limit: Number(limit),
      totalItems: Array.isArray(totalItems) ? totalItems.length : totalItems,
      totalPages: Math.ceil(
        (Array.isArray(totalItems) ? totalItems.length : totalItems) / Number(limit)
      )
    },
  };
};

/**
 * @name updateStatus
 * @description
 * Toggles the active status of a service partner's user account.
 * @access Private (Admin)
 */
export const updateStatus = async (id: number) => {
  const partner = await servicePartnerRepository.findServicePartnerByPk(id);
  if (!partner) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND_PARTNER);
  }

  const user = await servicePartnerRepository.findUserByPk(partner.userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  user.isActive = !user.isActive;
  await user.save();

  return {
    message: user.isActive ? MESSAGES.EXPERT.ACTIVATED : MESSAGES.EXPERT.DEACTIVATED,
    isActive: user.isActive
  };
};

/**
 * @name deleteServicePartner
 * @description
 * Deletes a service partner profile and their associated user account.
 * Also cleans up any uploaded documents from Cloudinary.
 * @access Private (Admin)
 */
export const deleteServicePartner = async (id: number) => {
  const t: Transaction = await sequelize.transaction();
  try {
    const partner = await servicePartnerRepository.findServicePartnerByPk(id, { 
      include: [{ model: ServicePartnerDocument, as: 'documents' }],
      transaction: t 
    });
    
    if (!partner) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND_PARTNER);
    }

    const userId = partner.userId;
    const documents = (partner as ServicePartner & { documents: ServicePartnerDocument[] }).documents || [];
    const cloudinaryIdsToDelete: string[] = documents
        .filter((doc: ServicePartnerDocument) => doc.cloudinaryId)
        .map((doc: ServicePartnerDocument) => doc.cloudinaryId as string);

    if (cloudinaryIdsToDelete.length > 0) {
      await Promise.allSettled(cloudinaryIdsToDelete.map(pid => deleteImage(pid)));
    }

    await partner.destroy({ transaction: t });
    await User.destroy({ where: { id: userId }, transaction: t });

    await t.commit();
    return {
      message: MESSAGES.EXPERT.DELETED
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * @name getServicePartnerById
 * @description
 * Fetches a detailed profile of a service partner by their ID.
 * @access Private (Admin)
 */
export const getServicePartnerById = async (id: number) => {
  const servicePartner = await servicePartnerRepository.findServicePartnerWithDetails(id);

  if (!servicePartner) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND_PARTNER);
  }

  const partner = servicePartner.get({ plain: true });
  let displayedStatus = "";

  if (partner.verificationStatus === VerificationStatus.VERIFIED) {
    displayedStatus = partner.user?.isActive
      ? ServicePartnerStatus.ACTIVE
      : ServicePartnerStatus.INACTIVE;
  } else {
    displayedStatus = partner.verificationStatus;
  }

  return {
    ...partner,
    displayedStatus,
  };
};

/**
 * @name approveRejectPartner
 * @description
 * Approves or rejects a service partner's registration request.
 * If approved, generates a password reset token and sends an approval email.
 * @access Private (Admin)
 */
export const approveRejectPartner = async (id: number, action: 'approve' | 'reject') => {
  const t: Transaction = await sequelize.transaction();
  try {
    const servicePartner = await servicePartnerRepository.findServicePartnerByPk(id, { transaction: t });
    if (!servicePartner) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND_PARTNER);
    }

    const user = await servicePartnerRepository.findUserByPk(servicePartner.userId, { transaction: t });
    if (!user) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
    }

    if (action === 'approve') {
      servicePartner.verificationStatus = VerificationStatus.VERIFIED;
      servicePartner.status = ServicePartnerStatus.ACTIVE;
      user.isActive = true;

      const resetToken = jwt.sign(
        { sub: user.id, email: user.email, type: "password_reset" },
        JWT_SECRET as string,
        { expiresIn: "24h" }
      );
      user.rememberToken = resetToken;
      logger.info(`Generated reset token for approved partner: ${user.email}`);

    } else if (action === 'reject') {
      servicePartner.verificationStatus = VerificationStatus.REJECTED;
      servicePartner.status = ServicePartnerStatus.INACTIVE;
      user.isActive = false;
    }

    await servicePartner.save({ transaction: t });
    await user.save({ transaction: t });

    await t.commit();

    if (action === 'approve') {
      const resetLink = `${FRONTEND_URL}/partner/reset-password?token=${user.rememberToken}`;
      sendPartnerApprovalEmail(user.email, user.name, resetLink).catch((err: unknown) => {
        logger.error(`Failed to send approval email to ${user.email}:`, err);
      });
    } else {
      sendPartnerRejectionEmail(user.email, user.name).catch((err: unknown) => {
        logger.error(`Failed to send rejection email to ${user.email}:`, err);
      });
    }

    return {
      message: action === 'approve' ? MESSAGES.EXPERT.APPROVED : MESSAGES.EXPERT.REJECTED,
      partnerId: servicePartner.id,
      verificationStatus: servicePartner.verificationStatus,
      status: servicePartner.status
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * @name getAssignedBookings
 * @description
 * Fetches a paginated list of bookings assigned to a specific service partner, 
 * with optional filtering by status, date, and time.
 * @access Private (Admin)
 */
export const getAssignedBookings = async (partnerId: number, query: AssignedBookingsQuery) => {
  const { page = 1, limit = 10, status, date, time } = query;
  const offset = (Number(page) - 1) * Number(limit);

  const filterConditions: any = {
    servicePartnerId: partnerId
  };

  if (status) {
    filterConditions.status = status;
  }

  if (date) {
    filterConditions.bookingDate = where(
      fn('DATE', col('booking_date')), 
      date
    );
  }

  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    const timeFilter = {
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM booking_date')), hours),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MINUTE FROM booking_date')), minutes)
      ]
    };

    if (filterConditions.bookingDate) {
      filterConditions[Op.and] = [
        { bookingDate: filterConditions.bookingDate },
        timeFilter
      ];
      delete filterConditions.bookingDate;
    } else {
      filterConditions[Op.and] = timeFilter[Op.and];
    }
  }

  const { rows, count } = await servicePartnerRepository.findAssignedBookings({
    where: filterConditions,
    limit: Number(limit),
    offset: offset,
  });

  return {
    bookings: rows,
    totalCount: count,
    totalPages: Math.ceil(count / Number(limit)),
    currentPage: Number(page)
  };
};

