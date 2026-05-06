import { Router } from "express";
import * as dashboardController from "@/controllers/dashboard.controller";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { dashboardCache } from "@/utils/caching-utils/dashboardCache.util";
import { getServicePartnerDashboardController } from "@/controllers/dashboard.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: APIs for admin and service partner dashboards
 */

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get admin dashboard overview (KPIs, charts, insights)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comparisonLabel:
 *                       type: string
 *                       example: "Then Last Week"
 *
 *                     kpis:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: bookings
 *                           title:
 *                             type: string
 *                           value:
 *                             type: string
 *                             example: "79"
 *                           change:
 *                             type: string
 *                             example: "-80%"
 *                           changePercent:
 *                             type: number
 *                           positive:
 *                             type: boolean
 *                           iconKey:
 *                             type: string
 *
 *                     topPartners:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           role:
 *                             type: string
 *                           completed:
 *                             type: number
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *
 *                     topServices:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *
 *                     topCities:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             xLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             series:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: number
 *                                   color:
 *                                     type: string
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             xLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             series:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: number
 *                                   color:
 *                                     type: string
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             xLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             series:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: number
 *                                   color:
 *                                     type: string
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 */
router.get(
  "/overview",
  verifyJWT,
  checkActiveUser,
  dashboardCache(120),
  dashboardController.getDashboardOverview,
);

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get service partner dashboard analytics (KPIs, services, revenue)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service partner dashboard fetched successfully
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
 *                   example: Dashboard fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     comparisonLabel:
 *                       type: string
 *                       example: "Then Last Week"
 *
 *                     kpis:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: active_services
 *                           title:
 *                             type: string
 *                           value:
 *                             type: string
 *                           change:
 *                             type: string
 *                             example: "+0%"
 *                           changePercent:
 *                             type: number
 *                           positive:
 *                             type: boolean
 *                           iconKey:
 *                             type: string
 *
 *                     topServices:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                     topRevenueServices:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   bookings:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   bookings:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             totalBookings:
 *                               type: number
 *                             services:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   value:
 *                                     type: number
 *                                   bookings:
 *                                     type: number
 *                                   color:
 *                                     type: string
 *
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         week:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *
 *                         month:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 *
 *                         year:
 *                           type: object
 *                           properties:
 *                             bars:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                   amount:
 *                                     type: number
 *                             yTicks:
 *                               type: array
 *                               items:
 *                                 type: number
 *                             yTickLabels:
 *                               type: array
 *                               items:
 *                                 type: string
 */
router.get(
  "/analytics",
  verifyJWT,
  checkActiveUser,
  getServicePartnerDashboardController,
);

export default router;
