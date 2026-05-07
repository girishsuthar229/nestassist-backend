import { Router } from "express";
import serviceTypeRoutes from "./serviceType.routes";
import categoryRoutes from "./category.routes";
import subCategoryRoutes from "./subCategory.routes";
import serviceAdminRoutes from "./serviceAdmin.routes";
import contactRoutes from "./contact.routes";
import servicePartnerRoutes from "./servicePartner.routes";
import userProfileRoutes from "./userProfile.routes";
import homeRoutes from "./home.routes";
import adminUserRoutes from "./adminUser.routes";
import transactionRoutes from "./transaction.routes";
import configurationRoutes from "./configuration.routes";
import couponUsageRoutes from "./couponUsage.routes";
import adminCustomerRoutes from "./adminCustomer.routes";
import serviceBookingCheckoutRoutes from "./serviceBookingCheckout.routes";
import adminBookingManagementRoutes from "./adminBookingManagement.routes";
import dashboardRoutes from "./dashboard.routes";
import bookingRoutes from "./booking.routes";
import customerAuthRoutes from "./customerAuth.routes";
import authRoutes from "./auth.routes";
import loggerRoutes from "./logger.routes";
import roleRoutes from "./role.routes";
import offerRoutes from "./offer.routes";
import customerProfileRoutes from "./customerProfile.routes";

const router = Router();

/**
 * Main API routes
 * Base path: /api
 */
router.use("/auth", authRoutes);
router.use("/service-types", serviceTypeRoutes);
router.use("/admin-users", adminUserRoutes);
router.use("/transactions", transactionRoutes);
router.use("/admin-customers", adminCustomerRoutes);

router.use("/home", homeRoutes);
router.use("/configurations", configurationRoutes);
router.use("/coupon-usages", couponUsageRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/offers", offerRoutes);
router.use("/", categoryRoutes);
router.use("/", subCategoryRoutes);
router.use("/", serviceAdminRoutes);
router.use("/contacts", contactRoutes);
router.use("/user-profile", userProfileRoutes);
router.use("/service-partners", servicePartnerRoutes);
router.use("/service-bookings", serviceBookingCheckoutRoutes);
router.use("/admin-bookings", adminBookingManagementRoutes);
router.use("/bookings", bookingRoutes);
router.use("/log", loggerRoutes);
router.use("/roles", roleRoutes);
router.use("/customer/profile", customerProfileRoutes);

// ── Customer-facing auth routes ──────────────────────────────────────────────
router.use("/v1/customer", customerAuthRoutes);

export default router;
