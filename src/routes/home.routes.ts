import { Router } from "express";
import * as homeController from "../controllers/home.controller";
import { landingHomeCache } from "@/utils/caching-utils/landingCache.util";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Public Home Page
 *   description: Public APIs for landing/home page
 */

/**
 * @swagger
 * /api/home/service-types:
 *   get:
 *     summary: Get service types for home page
 *     tags: [Public Home Page]
 *     security: []
 *     responses:
 *       200:
 *         description: Service types fetched successfully
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
 *                   example: Service types fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       image:
 *                         type: string
 */
router.get(
  "/service-types",
  landingHomeCache(120),
  homeController.getServiceTypes,
);

/**
 * @swagger
 * /api/home/services/popular:
 *   get:
 *     summary: Get popular services based on bookings
 *     tags: [Public Home Page]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of services to return (max 50)
 *     responses:
 *       200:
 *         description: Popular services fetched successfully
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
 *                   example: Popular services fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       price:
 *                         type: string
 *                         example: "499"
 *                       image:
 *                         type: string
 */
router.get(
  "/services/popular",
  landingHomeCache(120),
  homeController.getPopularServices,
);

/**
 * @swagger
 * /api/home/services/all:
 *   get:
 *     summary: Get latest services for home page
 *     tags: [Public Home Page]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *         description: Number of services to return (max 50)
 *     responses:
 *       200:
 *         description: Services fetched successfully
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
 *                   example: Services fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       price:
 *                         type: string
 *                       image:
 *                         type: string
 */
router.get(
  "/services/all",
  landingHomeCache(120),
  homeController.getAllServices,
);

/**
 * @swagger
 * /api/home/services/search:
 *   get:
 *     summary: Search services by name
 *     tags: [Public Home Page]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: haircut
 *         description: Search keyword
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *         description: Number of results (max 50)
 *     responses:
 *       200:
 *         description: Search results fetched successfully
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
 *                   example: Services fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       price:
 *                         type: string
 *                       image:
 *                         type: string
 */
router.get("/services/search", homeController.searchServices);

/**
 * @swagger
 * /api/home/stats:
 *   get:
 *     summary: Get public stats (customers globally and services count)
 *     tags: [Public Home Page]
 *     security: []
 *     responses:
 *       200:
 *         description: Stats fetched successfully
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
 *                     customersGlobally:
 *                       type: number
 *                     servicesCount:
 *                       type: number
 */
router.get("/stats", homeController.getPublicStats);

export default router;
