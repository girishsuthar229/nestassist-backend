import { Router } from "express";
import * as servicePartnerController from "../controllers/servicePartner.controller";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import { approveRejectPartnerValidation, registerPartnerValidation } from "../validations/servicePartner.validation";
import { partnerDataParser } from "@/middlewares/dataParser.middleware";
import { authorizeRoles, checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { UserRole } from "@/enums/userRole.enum";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Service Partners
 *   description: Service partner management for registration, approval, and service assignment.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServicePartnerRegisterPayload:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - dob
 *         - gender
 *         - mobile
 *         - applyingFor
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john.doe@example.com"
 *         dob:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *         mobile:
 *           type: string
 *           example: "+1234567890"
 *         applyingFor:
 *           type: integer
 *           description: Service Type ID
 *         permanentAddress:
 *           type: string
 *         residentialAddress:
 *           type: string
 *         education:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               school: { type: string }
 *               year: { type: string }
 *               marks: { type: string }
 *         professional:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               company: { type: string }
 *               role: { type: string }
 *               from: { type: string }
 *               to: { type: string }
 *         skills:
 *           type: array
 *           items: { type: integer }
 *         servicesOffered:
 *           type: array
 *           items: { type: integer }
 *         languages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               language: { type: string }
 *               proficiency: { type: string }
 *         profileImage:
 *           type: string
 *           format: binary
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *     ApproveRejectPayload:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [approve, reject]
 */

/**
 * @swagger
 * /api/service-partners:
 *   post:
 *     summary: Register a new service partner
 *     description: Create a service partner profile with optional profile image and document attachments.
 *     tags: [Service Partners]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ServicePartnerRegisterPayload'
 *     responses:
 *       201:
 *         description: Successfully registered
 */
router.post(
  "/",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "attachments", maxCount: 10 }
  ]),
  partnerDataParser,
  validate(registerPartnerValidation), 
  servicePartnerController.register
);

/**
 * @swagger
 * /api/service-partners:
 *   get:
 *     summary: List all service partners
 *     description: Retrieve a paginated list of service partners with filtering by status and service type.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: serviceTypeId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), servicePartnerController.getAllPartners);

/**
 * @swagger
 * /api/service-partners/{id}/status:
 *   patch:
 *     summary: Toggle partner status
 *     description: Activate or deactivate a partner user account.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), servicePartnerController.updatePartnerStatus);

/**
 * @swagger
 * /api/service-partners/{id}:
 *   delete:
 *     summary: Delete a partner
 *     description: Permanently remove a partner profile and their user account.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Partner deleted
 */
router.delete("/:id", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), servicePartnerController.deletePartner);

/**
 * @swagger
 * /api/service-partners/{id}/approval:
 *   patch:
 *     summary: Approve or reject partner
 *     description: Finalize the verification of a partner registration.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveRejectPayload'
 *     responses:
 *       200:
 *         description: Approval action completed
 */
router.patch("/:id/approval", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(approveRejectPartnerValidation), servicePartnerController.approveRejectPartner);

/**
 * @swagger
 * /api/service-partners/{id}:
 *   get:
 *     summary: Get partner details
 *     description: Fetch full profile details of a service partner.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), servicePartnerController.getPartnerById);

/**
 * @swagger
 * /api/service-partners/{id}/assigned-services:
 *   get:
 *     summary: Get assigned services
 *     description: Retrieve bookings assigned to the partner.
 *     tags: [Service Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/assigned-services", verifyJWT, checkActiveUser, authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SERVICE_PARTNER), servicePartnerController.getAssignedServices);




export default router;
