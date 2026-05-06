import { Router } from "express";
import * as serviceTypeController from "../controllers/serviceType.controller";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createValidation,
  updateValidation,
} from "../validations/serviceType.validation";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ServiceTypes
 *   description: API for managing service types (e.g., Cleaning, Repair)
 */

/**
 * @swagger
 * /api/service-types:
 *   get:
 *     summary: Get all service types
 *     tags: [ServiceTypes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     security: []
 *     responses:
 *       200:
 *         description: List of service types
 */
router.get("/",  serviceTypeController.getAll);

/**
 * @swagger
 * /api/service-types/public:
 *   get:
 *     summary: Get all service types with completed booking counts (Public)
 *     tags: [ServiceTypes]
 *     security: []
 *     responses:
 *       200:
 *         description: List of service types with booking counts
 */
router.get("/public", serviceTypeController.getPublicUserAllService);

/**
 * @swagger
 * /api/service-types/hierarchy:
 *   get:
 *     summary: Get service types hierarchy (nested categories/subcategories)
 *     tags: [ServiceTypes]
 *     responses:
 *       200:
 *         description: Full or partner-scoped hierarchy
 *       401:
 *         description: Unauthorized
 */
router.get("/hierarchy", verifyJWT, checkActiveUser, serviceTypeController.getAllHierarchy);

/**
 * @swagger
 * /api/service-types/{id}:
 *   get:
 *     summary: Get service type by ID with its full hierarchy
 *     tags: [ServiceTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security: []
 *     responses:
 *       200:
 *         description: Service type details
 *       404:
 *         description: Not found
 */
router.get("/:id", serviceTypeController.getById);

/**
 * @swagger
 * /api/service-types/{id}/services:
 *   get:
 *     summary: List available services for a service type
 *     tags: [ServiceTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: integer
 *         description: Filter by subcategory ID
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     security: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.get("/:id/services", serviceTypeController.listServices);

/**
 * @swagger
 * /api/service-types:
 *   post:
 *     summary: Create a new service type (Admin only)
 *     tags: [ServiceTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  verifyJWT,
  checkActiveUser,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  validate(createValidation),
  serviceTypeController.create
);

/**
 * @swagger
 * /api/service-types/{id}:
 *   put:
 *     summary: Update a service type (Admin only)
 *     tags: [ServiceTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id",
  verifyJWT,
  checkActiveUser,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  validate(updateValidation),
  serviceTypeController.update
);

/**
 * @swagger
 * /api/service-types/{id}:
 *   delete:
 *     summary: Delete a service type (Admin only)
 *     tags: [ServiceTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete("/:id", verifyJWT, checkActiveUser, serviceTypeController.remove);

export default router;

