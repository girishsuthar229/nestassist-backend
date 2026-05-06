import { Booking, Service, User, ServicePartner, ServicePartnerService, Payment, Offer, ServiceType } from "../models";
import { ApiError } from "../utils/apiError.util";
import { ServicePartnerStatus, VerificationStatus } from "../enums/servicePartner.enum";
import { Op, WhereOptions } from "sequelize";
import { BookingStatus, MyBookingTab } from "@/enums/transaction.enum";
import { STATUS_CODE } from "@/enums";
import { CurrencyValueSymbol } from "@/enums/log.enum";
import { BookingSuccessDetails, InvoiceData } from "@/dtos/serviceBoookingCheckout.dto";
import { roundUpToNextQuarter } from "@/utils/common.utils";
import { MESSAGES } from "@/constants/messages";
import * as BookingRepository from "../repositories/booking.repository";
import { CustomerBooking, CustomerBookingResponse } from "@/interfaces/booking.interface";
import type { BookingWithRelations } from "@/repositories/booking.repository";
import { MS_IN_MINUTE, SLOT_START_MINUTES, SLOT_END_MINUTES, MAX_BUFFER_MINUTES, MIN_BOOKING_BEFORE_BUFFER_TIME } from "@/constants";

/**
 * Get booking success details and handle partner assignment
 */
export const getBookingSuccessDetails = async (bookingId: number): Promise<BookingSuccessDetails> => {
  let booking = await BookingRepository.findBookingWithDetails({ id: bookingId });

  if (!booking) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);
  }

  const service = (booking as any).service;
  const payment = (booking as any).payment;

  // 1. Assignment Logic (if not already assigned)  
  if (!booking.servicePartnerId && booking.status === BookingStatus.PENDING) {
    const subCategoryId = service?.subCategoryId;

    if (subCategoryId) {
      // Find eligible partners
      const eligiblePartners = await ServicePartner.findAll({
        where: {
          status: ServicePartnerStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        include: [
          {
            model: ServicePartnerService,
            as: "services",
            where: { subCategoryId },
            required: true,
          },
        ],
      });

      const availablePartners: ServicePartner[] = [];
      const newBookingStart = new Date(booking.bookingDate).getTime();
      const newBookingEnd = new Date(newBookingStart + (booking.serviceDuration || 0) * MS_IN_MINUTE).getTime();

      const partnerIds = eligiblePartners.map(p => p.id);

      // Fetch all relevant bookings for all eligible partners
      const allActiveBookings = await Booking.findAll({
        where: {
          servicePartnerId: { [Op.in]: partnerIds },
          status: { [Op.in]: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          id: { [Op.ne]: bookingId }
        }
      });

      // Group bookings by partnerId for efficient access
      const partnerBookingsMap = allActiveBookings.reduce((acc: any, b: any) => {
        if (!acc[b.servicePartnerId]) acc[b.servicePartnerId] = [];
        acc[b.servicePartnerId].push(b);
        return acc;
      }, {});

      for (const partner of eligiblePartners) {
        const theirBookings = partnerBookingsMap[partner.id] || [];

        const isOverlapping = theirBookings.some((b: any) => {
          const bStart = new Date(b.bookingDate).getTime();
          const bEnd = new Date(bStart + (b.serviceDuration || 0) * MS_IN_MINUTE).getTime();
          return newBookingStart < bEnd && newBookingEnd > bStart;
        });

        if (!isOverlapping) {
          availablePartners.push(partner);
        }
      }

      if (availablePartners.length > 0) {
        const randomIdx = Math.floor(Math.random() * availablePartners.length);
        await booking.update({ servicePartnerId: availablePartners[randomIdx].id });

        // Reload to get updated partner info
        booking = await BookingRepository.findBookingWithDetails({ id: bookingId });
      }
    }
  }

  if (!booking) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);
  }

  const assignedPartner = (booking as any).servicePartner;
  const servicePartner = assignedPartner ? {
    name: assignedPartner.user?.name || assignedPartner.name,
    phone: assignedPartner.user?.mobileNumber || assignedPartner.mobileNumber,
    image: assignedPartner.user?.profileImage || assignedPartner.profileImage,
    isVerified: assignedPartner.verificationStatus === VerificationStatus.VERIFIED,
    serviceTypeName: (booking as any).serviceType?.name || "Service Partner"
  } : undefined;

  const bookingDate = new Date(booking.bookingDate);

  // Formatting helpers
  const day = bookingDate.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[bookingDate.getMonth()];

  let hours = bookingDate.getHours();
  const minutes = bookingDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const timeStr = `${hours}:${strMinutes} ${ampm}`;

  const invoiceNumber = BookingRepository.generateInvoiceNumber(booking.id);

  return {
    bookingId: String(booking.id),
    bookingStatus: booking.status.toUpperCase(),
    headerTitle: "Your booking is confirmed.",
    serviceName: service?.name || "N/A",
    serviceDuration: `${booking.serviceDuration || 0} Min`,
    assignmentStatus: booking.servicePartnerId ? "SERVICE_PARTNER_ASSIGNED" : "ASSIGNING_SERVICE_PARTNER",
    servicePartner,
    amountPaid: Number(payment?.totalAmount || booking.amount || 0),
    currency: payment?.currency || CurrencyValueSymbol.USD,
    invoiceNumber: invoiceNumber,
    invoiceDownloadUrl: `/api/bookings/invoice/${invoiceNumber}`,
    selectedAddress: booking.serviceAddress || "N/A",
    selectedDate: bookingDate.toISOString().split('T')[0],
    selectedTime: `${bookingDate.getHours().toString().padStart(2, '0')}:${bookingDate.getMinutes().toString().padStart(2, '0')}`,
    displayDateTime: `${day} ${month}, ${timeStr}`,
  };
};

/**
 * Download invoice logic
 */

export const getInvoiceData = async (
  invoiceNumber: string,
  userId: number
): Promise<InvoiceData> => {
  const bookingId = BookingRepository.getBookingIdFromInvoice(invoiceNumber);

  const booking = await BookingRepository.findBookingWithDetails({ id: bookingId, userId });

  if (!booking) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.TRANSACTION.INVOICE_NOT_FOUND);
  }

  const service = (booking as any).service;
  const payment = (booking as any).payment;
  const partner = (booking as any).servicePartner;
  const customer = (booking as any).customer;

  const subTotal = Number(payment?.amount || booking.amount || 0);
  const discount = Number(payment?.discount || 0);
  const totalAmount = Number(payment?.totalAmount || booking.amount || 0);
  const taxable = subTotal - discount;
  const tax = Number((totalAmount - taxable).toFixed(2));
  const taxPercentage = payment?.tax || 0;
  const currency = payment?.currency || CurrencyValueSymbol.USD;
  const paymentMethod = payment?.paymentMethod || "Online";

  return {
    invoiceNumber,
    bookingId: booking.id,
    customerName: customer?.name || "Valued Customer",
    customerAddress: booking.serviceAddress || "N/A",
    serviceName: service?.name ?? "N/A",
    serviceDescription: service?.description || service?.name,
    servicePartnerName: partner?.user?.name || partner?.name,
    servicePartnerPhone: partner?.user?.mobileNumber || partner?.mobileNumber,
    subTotal,
    tax,
    taxPercentage,
    discount,
    totalAmount,
    currency,
    date: booking.bookingDate,
    status: payment?.paymentStatus ?? "PAID",
    couponCode: payment?.offer?.couponCode,
    serviceDuration: booking.serviceDuration || 0,
    paymentMethod,
  };
};

export const getAvailabilitySlotsByService = async (serviceId: number) => {
  if (!serviceId || Number.isNaN(serviceId)) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.INVALID_ID);
  }

  const service = await Service.findOne({
    where: { id: serviceId },
    attributes: ["id", "duration"],
  });

  const duration = service?.duration || 0;

  if (!duration || Number.isNaN(duration)) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_DURATION);
  }

  const now = new Date();

  // Precompute buffer & interval
  const buffer = Math.min(duration / 2, MAX_BUFFER_MINUTES);
  const interval = duration + buffer;
  const result = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() + i);

    const dateStr = currentDate.toISOString().split("T")[0];

    const isToday = currentDate.toDateString() === now.toDateString();

    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (currentMinutes >= SLOT_END_MINUTES) {
        continue;
      }
    }

    const times = [];

    for (
      let time = SLOT_START_MINUTES;
      time <= SLOT_END_MINUTES;
      time += interval
    ) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(Math.floor(time / 60), time % 60, 0, 0);

      const roundedTime = roundUpToNextQuarter(slotStart);
      if (isToday && roundedTime < new Date(now.getTime() + MIN_BOOKING_BEFORE_BUFFER_TIME)) {
        continue;
      }

      const hour = roundedTime.getHours();
      const minute = roundedTime.getMinutes();

      const period = hour >= 12 ? "PM" : "AM";
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;

      const timeStr = `${displayHour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;

      times.push({
        time: timeStr,
        disabled: false,
      });
    }
    const isFullyOccupied = times.length === 0;

    result.push({
      date: dateStr,
      isFullyOccupied,
      times,
    });
  }

  return result;
};

/**
 * @name getMyBookings
 * @description Get customer bookings based on Upcoming or Completed tab. Logic is based on bookingDate (NOT status).
 * @access Private
 */
export const getMyBookings = async (
  userId: number,
  tab: string | undefined,
  page: number,
  limit: number
): Promise<CustomerBookingResponse> => {
  if (!userId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.BOOKING.USER_ID_REQUIRED
    );
  }

  const user = await BookingRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.USER_NOT_FOUND);
  }

  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.max(1, limit || 10);

  const today = new Date();
  const currentTime = today.getTime(); 
  const whereCondition: WhereOptions = { userId };
  
  if (tab === MyBookingTab.UPCOMING) {
    whereCondition.status = { [Op.between]: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED] };
    whereCondition.bookingDate = { [Op.gte]: currentTime };
  } else if (tab === MyBookingTab.COMPLETED) {
    whereCondition.status = BookingStatus.COMPLETED;
  }

  const { rows, count } = await BookingRepository.findCustomerBookings(
    whereCondition,
    safePage,
    safeLimit
  );

  const formattedBookings: CustomerBooking[] = rows.map(
    (b: BookingWithRelations) => ({
      id: b.id,
      serviceName: b.service?.name ?? null,
      duration: b.serviceDuration ?? null,
      bookingDate: b.bookingDate ? new Date(b.bookingDate).getTime() : null,

      address: b.serviceAddress ?? null,
      amount: Number(b.amount ?? 0),
      currency: (b as any).payment?.currency || CurrencyValueSymbol.USD,
      status: b.status,

      invoiceNumber: BookingRepository.generateInvoiceNumber(b.id),
      invoiceDownloadUrl: `/api/bookings/invoice/${BookingRepository.generateInvoiceNumber(b.id)}`,

      servicePartner:
        b.servicePartner?.verificationStatus === VerificationStatus.VERIFIED
          ? {
            id: b.servicePartner.id,
            name: b.servicePartner.user?.name ?? null,
            mobileNumber: b.servicePartner.user?.mobileNumber ?? null,
            countryCode: b.servicePartner.user?.countryCode ?? null,
            profileImage: b.servicePartner.user?.profileImage ?? null,
            verificationStatus: b.servicePartner.verificationStatus,
            serviceType: b.serviceType
              ? {
                id: b.serviceType.id,
                name: b.serviceType.name,
              }
              : null,
          }
          : null,
    })
  );

  return {
    bookings: formattedBookings,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / safeLimit),
      currentPage: safePage,
      limit: safeLimit,
    },
  };
};
