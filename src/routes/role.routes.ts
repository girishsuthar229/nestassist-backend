import { Router } from "express";
import * as roleController from "../controllers/role.controller";
import { authorizeRoles, checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { createRoleSchema, updateRoleSchema } from "@/validations/role.validation";
import { UserRole } from "@/enums/userRole.enum";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management and access control. Authentication is applied globally.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RolePayload:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "editor"
 *         description:
 *           type: string
 *           example: "User with editorial permissions"
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List all roles
 *     description: Retrieve a list of roles with optional filtering and sorting.
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Attribute to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", verifyJWT, checkActiveUser, authorizeRoles(UserRole.SUPER_ADMIN), roleController.listRoles);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolePayload'
 *     responses:
 *       201:
 *         description: Role created
 */
router.post(
  "/", 
  verifyJWT, 
  checkActiveUser, 
  authorizeRoles(UserRole.SUPER_ADMIN),
  validate(createRoleSchema), 
  roleController.createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolePayload'
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put(
  "/:id", 
  verifyJWT, 
  checkActiveUser, 
  authorizeRoles(UserRole.SUPER_ADMIN),
  validate(updateRoleSchema), 
  roleController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete("/:id", verifyJWT, checkActiveUser, authorizeRoles(UserRole.SUPER_ADMIN), roleController.deleteRole);

export default router;
