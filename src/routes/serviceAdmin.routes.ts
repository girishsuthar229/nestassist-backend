import { Router } from "express";
import * as serviceController from "../controllers/serviceAdmin.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  availabilityValidation,
  createValidation,
  updateValidation,
} from "../validations/service.validation";
import { upload } from "../middlewares/upload.middleware";
import { checkActiveUser, optionalCheckActiveUser, optionalVerifyJWT, verifyJWT } from "@/middlewares/auth.middleware";
import {
  createUserOrIpRateLimiter,
  numberFromEnv,
} from "../middlewares/rateLimit.middleware";
import { serviceAdminCache } from "@/utils/caching-utils/serviceAdminCache.util";

const router = Router();

// Rate limits:
// - Use `verifyJWT` + per-user keying when available (falls back to normalized IP).
// - Defaults can be overridden via env by constructing limiters with different values.
const serviceAdminPostRateLimiter = createUserOrIpRateLimiter("service:post", {
  windowMs: numberFromEnv("RATE_LIMIT_SERVICE_POST_WINDOW_MS", 60 * 1000),
  limit: numberFromEnv("RATE_LIMIT_SERVICE_POST_MAX", 20),
});

const serviceAdminPutRateLimiter = createUserOrIpRateLimiter("service:put", {
  windowMs: numberFromEnv("RATE_LIMIT_SERVICE_PUT_WINDOW_MS", 60 * 1000),
  limit: numberFromEnv("RATE_LIMIT_SERVICE_PUT_MAX", 30),
});

const serviceAdminPatchRateLimiter = createUserOrIpRateLimiter(
  "service:patch",
  {
    windowMs: numberFromEnv("RATE_LIMIT_SERVICE_PATCH_WINDOW_MS", 60 * 1000),
    limit: numberFromEnv("RATE_LIMIT_SERVICE_PATCH_MAX", 60),
  },
);

const serviceAdminDeleteRateLimiter = createUserOrIpRateLimiter(
  "service:delete",
  {
    windowMs: numberFromEnv("RATE_LIMIT_SERVICE_DELETE_WINDOW_MS", 60 * 1000),
    limit: numberFromEnv("RATE_LIMIT_SERVICE_DELETE_MAX", 60),
  },
);

/**
 * @swagger
 * tags:
 *   name: Admin Service Management
 *   description: Service management APIs
 */

/**
 * @swagger
 * /api/categories/{categoryId}/services:
 *   get:
 *     summary: List services by category
 *     tags: [Admin Service Management]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         example: haircut
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: integer
 *         example: 7
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         example: 100
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         example: 5000
 *       - in: query
 *         name: availability
 *         schema:
 *           type: boolean
 *         example: true
 *       - in: query
 *         name: commission
 *         schema:
 *           type: number
 *         example: 10
 *     responses:
 *       200:
 *         description: Services fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 5
 *                   name: "Modern Granite Shirt"
 *                   categoryId: 2
 *                   subCategoryId: 7
 *                   price: "2467.12"
 *                   duration: 52
 *                   commission: "61.29"
 *                   availability: true
 *                   images: []
 *                   cloudinaryIds: []
 *                   includeServices: []
 *                   excludeServices: []
 *                   createdAt: "2026-03-26T10:40:05.320Z"
 *                   updatedAt: "2026-03-26T10:40:05.320Z"
 *                   subCategory:
 *                     id: 7
 *                     name: "Marble Sub 7"
 *                     categoryId: 2
 *                     category:
 *                       id: 2
 *                       name: "Sports Cat 2"
 *                       serviceTypeId: 1
 *               pagination:
 *                 currentPage: 1
 *                 limit: 10
 *                 totalItems: 3
 *                 totalPages: 1
 */
router.get(
  "/categories/:categoryId/services",
  // Cache this read-heavy list endpoint (query params are part of the cache key).
  optionalVerifyJWT,
  optionalCheckActiveUser,
  serviceAdminCache(120),
  serviceController.listByCategory,
);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Admin Service Management]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 30
 *                 name: "Men Hair's Spa"
 *                 categoryId: 28
 *                 subCategoryId: 39
 *                 price: "300.00"
 *                 duration: 30
 *                 commission: "20.00"
 *                 availability: true
 *                 images:
 *                   - "https://res.cloudinary.com/example/services/image.jpg"
 *                 cloudinaryIds:
 *                   - "services/image_id"
 *                 includeServices:
 *                   - "hair wash"
 *                   - "head massage"
 *                   - "hair spa"
 *                 excludeServices: []
 *                 createdAt: "2026-04-07T14:35:24.361Z"
 *                 updatedAt: "2026-04-13T12:07:26.701Z"
 *                 subCategory:
 *                   id: 39
 *                   name: "Classic Haircut"
 *                   categoryId: 28
 *                   imageUrl: "https://res.cloudinary.com/example/subcategory.jpg"
 *                   category:
 *                     id: 28
 *                     name: "Haircut"
 *                     serviceTypeId: 13
 *                     imageUrl: "https://res.cloudinary.com/example/category.jpg"
 *                 serviceType:
 *                   id: 13
 *                   name: "Hair Services"
 */
router.get("/services/:id", serviceController.getServiceById);

/**
 * @swagger
 * /api/services/admin/{id}:
 *   get:
 *     summary: Get service by ID (Admin)
 *     tags: [Admin Service Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: 30
 *                 name: "Men Hair's Spa"
 *                 categoryId: 28
 *                 subCategoryId: 39
 *                 price: "300.00"
 *                 duration: 30
 *                 commission: "20.00"
 *                 availability: true
 *                 images:
 *                   - "https://res.cloudinary.com/example/services/image.jpg"
 *                 cloudinaryIds:
 *                   - "services/image_id"
 *                 includeServices:
 *                   - "hair wash"
 *                   - "head massage"
 *                   - "hair spa"
 *                 excludeServices: []
 *                 createdAt: "2026-04-07T14:35:24.361Z"
 *                 updatedAt: "2026-04-13T12:07:26.701Z"
 *                 subCategory:
 *                   id: 39
 *                   name: "Classic Haircut"
 *                   categoryId: 28
 *                   imageUrl: "https://res.cloudinary.com/example/subcategory.jpg"
 *                   category:
 *                     id: 28
 *                     name: "Haircut"
 *                     serviceTypeId: 13
 *                     imageUrl: "https://res.cloudinary.com/example/category.jpg"
 *                 serviceType:
 *                   id: 13
 *                   name: "Hair Services"
 */
router.get(
  "/services/admin/:id",
  verifyJWT,
  checkActiveUser,
  serviceController.getServiceByIdForAdmin,
);

/**
 * @swagger
 * /api/categories/{categoryId}/subcategories/{subCategoryId}/services:
 *   post:
 *     summary: Create service
 *     tags: [Admin Service Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 28
 *       - in: path
 *         name: subCategoryId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 41
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *               - commission
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Haircut"
 *               price:
 *                 type: number
 *                 example: 100
 *               duration:
 *                 type: integer
 *                 example: 60
 *               commission:
 *                 type: number
 *                 example: 10
 *               availability:
 *                 type: boolean
 *                 example: true
 *               includeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hair wash", "massage"]
 *               excludeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["beard trim"]
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Service created successfully"
 *               data:
 *                 id: 35
 *                 name: "1212"
 *                 price: "100.00"
 *                 duration: 100
 *                 commission: "10.00"
 *                 availability: false
 *                 includeServices: []
 *                 excludeServices: []
 *                 images: []
 *                 cloudinaryIds: []
 *                 categoryId: 28
 *                 subCategoryId: 41
 *                 createdAt: "2026-04-20T07:59:40.275Z"
 *                 updatedAt: "2026-04-20T07:59:40.275Z"
 */
router.post(
  "/categories/:categoryId/subcategories/:subCategoryId/services",
  verifyJWT,
  checkActiveUser,
  serviceAdminPostRateLimiter,
  upload.array("images", 10),
  validate(createValidation),
  serviceController.create,
);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update service
 *     tags: [Admin Service Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 29
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Styling Haircut"
 *               price:
 *                 type: number
 *                 example: 499
 *               duration:
 *                 type: integer
 *                 example: 45
 *               commission:
 *                 type: number
 *                 example: 5
 *               availability:
 *                 type: boolean
 *                 example: true
 *               subCategoryId:
 *                 type: integer
 *                 example: 40
 *               includeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hair wash", "blow dry", "head massage"]
 *               excludeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["n/a"]
 *               deletedImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["services/old_image_id"]
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Service updated successfully"
 *               data:
 *                 id: 29
 *                 name: "Premium Styling Haircut"
 *                 categoryId: 28
 *                 subCategoryId: 40
 *                 price: 499
 *                 duration: 45
 *                 commission: 5
 *                 availability: true
 *                 images:
 *                   - "https://res.cloudinary.com/example/services/img1.jpg"
 *                   - "https://res.cloudinary.com/example/services/img2.jpg"
 *                 cloudinaryIds:
 *                   - "services/img1"
 *                   - "services/img2"
 *                 includeServices:
 *                   - "hair wash"
 *                   - "blow dry"
 *                   - "head massage"
 *                 excludeServices:
 *                   - "n/a"
 *                 createdAt: "2026-04-07T14:29:55.298Z"
 *                 updatedAt: "2026-04-20T07:56:58.404Z"
 */
router.put(
  "/services/:id",
  verifyJWT,
  checkActiveUser,
  serviceAdminPutRateLimiter,
  upload.array("images", 10),
  validate(updateValidation),
  serviceController.update,
);

/**
 * @swagger
 * /api/services/{id}/availability:
 *   patch:
 *     summary: Update service availability
 *     tags: [Admin Service Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 34
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Service availability updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Service availability updated successfully"
 *               data:
 *                 id: 34
 *                 name: "123"
 *                 categoryId: 28
 *                 subCategoryId: 41
 *                 price: "100.00"
 *                 duration: 100
 *                 commission: "10.00"
 *                 availability: true
 *                 images: []
 *                 cloudinaryIds: []
 *                 includeServices: []
 *                 excludeServices: []
 *                 createdAt: "2026-04-20T07:48:58.108Z"
 *                 updatedAt: "2026-04-20T07:49:20.801Z"
 */
router.patch(
  "/services/:id/availability",
  verifyJWT,
  checkActiveUser,
  serviceAdminPatchRateLimiter,
  validate(availabilityValidation),
  serviceController.updateAvailability,
);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete service
 *     tags: [Admin Service Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 34
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Service deleted successfully"
 */
router.delete(
  "/services/:id",
  verifyJWT,
  checkActiveUser,
  serviceAdminDeleteRateLimiter,
  serviceController.remove,
);

export default router;
