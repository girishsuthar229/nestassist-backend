import { Router } from "express";
import * as BookingController from "../controllers/booking.controller";
import { checkActiveUser, verifyJWT } from "../middlewares/auth.middleware";

/**
 * Booking Routes
 * Base path: /api/bookings
 */
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management for customers.
 */

//Get My Upcoming and Completed Booking Service 
/**
 * @swagger
 * /api/bookings/my-bookings:
 *   post:
 *     summary: Get logged-in customer's bookings
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               tab:
 *                 type: string
 *                 enum: [upcoming, completed]
 *               page:
 *                 type: integer
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.post("/my-bookings", verifyJWT, checkActiveUser, BookingController.getMyBookings);

// Download booking invoice
/**
 * @swagger
 * /api/bookings/invoice/{invoiceNumber}:
 *   get:
 *     summary: Download booking invoice PDF
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice PDF downloaded successfully
 */
router.get("/invoice/:invoiceNumber", verifyJWT, checkActiveUser, BookingController.downloadInvoice);

// Get booking success details and perform partner assignment
/**
 * @swagger
 * /api/bookings/{bookingId}/success-details:
 *   get:
 *     summary: Get booking success details
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 */
router.get("/:bookingId/success-details", verifyJWT, checkActiveUser, BookingController.getBookingSuccessDetails);

// Get disabled slots for a services
/**
 * @swagger
 * /api/bookings/{serviceId}/available-slots:
 *   get:
 *     summary: Get available slots for a service
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Slots retrieved successfully
 */
router.get("/:serviceId/available-slots", BookingController.getAvailabilitySlots)

export default router;
