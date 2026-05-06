import { Router } from "express";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import * as controller from "@/controllers/adminBookingManagement.controller";
import { bookingManagementCache } from "@/utils/caching-utils/bookingManagementCache.util";
import {
  createUserOrIpRateLimiter,
  numberFromEnv,
} from "@/middlewares/rateLimit.middleware";

const router = Router();

// Booking-management mutation rate limits (admin):
// - Key by authenticated user id when available (falls back to normalized IP).
// - Defaults can be overridden via env vars.
const bookingAdminUpdateRateLimiter = createUserOrIpRateLimiter(
  "booking:update",
  {
    windowMs: numberFromEnv("RATE_LIMIT_BOOKING_UPDATE_WINDOW_MS", 60 * 1000),
    limit: numberFromEnv("RATE_LIMIT_BOOKING_UPDATE_MAX", 60),
  }
);

const bookingAdminDeleteRateLimiter = createUserOrIpRateLimiter(
  "booking:delete",
  {
    windowMs: numberFromEnv("RATE_LIMIT_BOOKING_DELETE_WINDOW_MS", 60 * 1000),
    limit: numberFromEnv("RATE_LIMIT_BOOKING_DELETE_MAX", 60),
  }
);

/**
 * @swagger
 * tags:
 *   name: Admin Booking Management
 *   description: Booking management APIs
 */

/**
 * @swagger
 * /api/admin-bookings/experts:
 *   get:
 *     summary: Get verified experts by service type
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: booking_id
 *         schema:
 *           type: string
 *         description: Booking id
 *     responses:
 *       200:
 *         description: Experts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Experts fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                       verified:
 *                         type: boolean
 */
router.get(
  "/experts",
  verifyJWT,
  checkActiveUser,
  controller.getExpertsByBookingId
);

/**
 * @swagger
 * /api/admin-bookings/filters:
 *   get:
 *     summary: Get booking filters
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filters fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     paymentMethods:
 *                       type: array
 *                       items:
 *                         type: string
 *                     bookingStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get(
  "/filters",
  verifyJWT,
  checkActiveUser,
  bookingManagementCache(120),
  controller.getBookingFilters
);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get admin bookings list
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by customer name/email/phone
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: 2026-04-20
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           example: 14:30
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookedMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: bookedMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: amountMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: amountMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [last_booking_date, last_created_at, total_amount, total_bookings, customer_name]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bookings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       totalBookings:
 *                         type: integer
 *                       address:
 *                         type: string
 *                       lastBookingDate:
 *                         type: string
 *                       totalAmount:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                       status:
 *                         type: string
 *                       details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             bookingId:
 *                               type: string
 *                             service:
 *                               type: string
 *                             serviceType:
 *                               type: string
 *                             dateTime:
 *                               type: string
 *                             assignedExpert:
 *                               type: string
 *                             assignedExpertMobileNumber:
 *                               type: string
 *                             status:
 *                               type: string
 *                             cancellationReason:
 *                               type: string
 *                               nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  "/",
  verifyJWT,
  checkActiveUser,
  bookingManagementCache(120),
  controller.getAdminBookings
);

/**
 * @swagger
 * /api/admin-bookings/{bookingId}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: COMPLETED
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking status updated successfully
 */
router.patch(
  "/:bookingId/status",
  verifyJWT,
  checkActiveUser,
  bookingAdminUpdateRateLimiter,
  controller.updateBookingStatus
);

/**
 * @swagger
 * /api/admin-bookings/{bookingId}/expert:
 *   patch:
 *     summary: Change assigned expert
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               servicePartnerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Expert assigned/updated to booking successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Expert assigned/update to booking successfully
 */
router.patch(
  "/:bookingId/expert",
  verifyJWT,
  checkActiveUser,
  bookingAdminUpdateRateLimiter,
  controller.changeBookingExpert
);

/**
 * @swagger
 * /api/admin-bookings/{bookingId}:
 *   delete:
 *     summary: Delete booking
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking deleted successfully
 */
router.delete(
  "/:bookingId",
  verifyJWT,
  checkActiveUser,
  bookingAdminDeleteRateLimiter,
  controller.deleteBooking
);

/**
 * @swagger
 * /api/admin-bookings/{bookingId}/page-data:
 *   get:
 *     summary: Get booking page data (logs + pagination)
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           example: DESC
 *     responses:
 *       200:
 *         description: Booking page data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking with payment details fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "401"
 *                           eventType:
 *                             type: string
 *                             example: BOOKING_STATUS_CHANGED
 *                           category:
 *                             type: string
 *                             example: BOOKING
 *                           message:
 *                             type: string
 *                             example: Booking status changed from PENDING to COMPLETED
 *                           userId:
 *                             type: string
 *                             nullable: true
 *                             example: "100"
 *                           serviceId:
 *                             type: string
 *                             example: "5"
 *                           bookingId:
 *                             type: string
 *                             example: "496"
 *                           status:
 *                             type: string
 *                             example: SUCCESS
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               bookingId:
 *                                 type: integer
 *                                 example: 496
 *                               oldStatus:
 *                                 type: string
 *                                 example: PENDING
 *                               newStatus:
 *                                 type: string
 *                                 example: COMPLETED
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-04-20T08:22:27.092Z
 *
 *                           user_id:
 *                             type: string
 *                             nullable: true
 *                           service_id:
 *                             type: string
 *                           booking_id:
 *                             type: string
 *
 *                           user.name:
 *                             type: string
 *                             nullable: true
 *                             example: Sk Y Admin
 *                           user.email:
 *                             type: string
 *                             nullable: true
 *                             example: sk-nestassist@yopmail.com
 *
 *                     logsPagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                           example: 3
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *
 *                 errors:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                   example: {}
 */
router.get(
  "/:bookingId/page-data",
  verifyJWT,
  checkActiveUser,
  controller.getAdminBookingDetailsPageData
);

/**
 * @swagger
 * /api/admin-bookings/{bookingId}:
 *   get:
 *     summary: Get booking details
 *     tags: [Admin Booking Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking with payment details fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       example: "496"
 *                     status:
 *                       type: string
 *                       example: COMPLETED
 *                     serviceId:
 *                       type: string
 *                       example: "5"
 *                     serviceName:
 *                       type: string
 *                       example: Modern Granite Shirt
 *                     serviceType:
 *                       type: string
 *                       example: Jewelry Type
 *                     scheduledAt:
 *                       type: string
 *                       example: 18 Apr 2026, 10:30 AM
 *                     createdAt:
 *                       type: string
 *                       example: 16 Apr 2026, 3:39 PM
 *                     cancellationReason:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *
 *                     customer:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 34
 *                         name:
 *                           type: string
 *                           example: Sachin Yadav
 *                         email:
 *                           type: string
 *                           example: sachin@yopmail.com
 *                         phone:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *
 *                     servicePartner:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         name:
 *                           type: string
 *                           example: Smith doe
 *                         email:
 *                           type: string
 *                           example: smith@yopmail.com
 *                         phone:
 *                           type: string
 *                           example: "9878965790"
 *                         avatar:
 *                           type: string
 *                           example: https://res.cloudinary.com/...
 *
 *                     payment:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         paymentStatus:
 *                           type: string
 *                           example: PAID
 *                         paymentMethod:
 *                           type: string
 *                           example: CASH
 *                         paymentGateway:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         transactionId:
 *                           type: string
 *                           nullable: true
 *                         paidAt:
 *                           type: string
 *                           example: 20 Apr 2026, 1:52 PM
 *
 *                     charges:
 *                       type: object
 *                       properties:
 *                         servicePartnerCharges:
 *                           type: number
 *                           example: 2467.12
 *                         commissionAmount:
 *                           type: number
 *                           example: 1512.1
 *                         commissionPercent:
 *                           type: number
 *                           example: 61.29
 *                         partnerPayout:
 *                           type: number
 *                           example: 955.02
 *                         currency:
 *                           type: string
 *                           example: USD
 *
 *                     customerPayment:
 *                       type: object
 *                       properties:
 *                         subtotal:
 *                           type: number
 *                           example: 2467.12
 *                         tax:
 *                           type: number
 *                           example: 10
 *                         discount:
 *                           type: number
 *                           example: 0
 *                         total:
 *                           type: number
 *                           example: 2713.83
 *                         paid:
 *                           type: number
 *                           example: 2713.83
 *                         currency:
 *                           type: string
 *                           example: USD
 */
router.get(
  "/:bookingId",
  verifyJWT,
  checkActiveUser,
  controller.getAdminBookingDetails
);

export default router;
