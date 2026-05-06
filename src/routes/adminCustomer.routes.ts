import { Router } from "express";
import * as adminCustomerController from "../controllers/adminCustomer.controller";
import * as adminCustomerBookingsController from "../controllers/adminCustomerBookings.controller";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { createCustomerValidation, updateCustomerStatusValidation } from "@/validations/adminCustomer.validation";

const router = Router();

/**
 * Admin Customer Routes
 * Base path: /api/admin-customers
 */

router.get("/", verifyJWT, checkActiveUser, adminCustomerController.listCustomers);
router.post("/add-customer", verifyJWT, checkActiveUser, validate(createCustomerValidation), adminCustomerController.createCustomer);
router.patch("/block-customer/:id", verifyJWT, checkActiveUser, validate(updateCustomerStatusValidation), adminCustomerController.updateCustomerStatus);
router.delete("/delete-customer/:id", verifyJWT, checkActiveUser, adminCustomerController.deleteCustomer);

// Customer detail
router.get("/:id", verifyJWT, checkActiveUser, adminCustomerBookingsController.getCustomerDetailById);
// Customer bookings (with filters + pagination)
router.get("/:id/booking-services", verifyJWT, checkActiveUser, adminCustomerBookingsController.getCustomerBookingServices);

export default router;
