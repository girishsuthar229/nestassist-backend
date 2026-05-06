import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validate } from "../middlewares/validate.middleware";
import { bulkCreateValidation, createValidation } from "../validations/category.validation";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { parseBodyJson } from "@/middlewares/dataParser.middleware";
import { upload, imageUpload } from "@/middlewares/upload.middleware";

const router = Router();

/**
 * @swagger
 * /api/service-types/{serviceTypeId}/categories:
 *   get:
 *     summary: Get categories by service type
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: serviceTypeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The service type ID
 *     responses:
 *       200:
 *         description: List of categories
 *       404:
 *         description: Service type not found
 */
/**
 * @swagger
 * /api/categories/by-service-types:
 *   get:
 *     summary: Get categories by multiple service type IDs
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated service type IDs (e.g. "1,2,3")
 *       - in: query
 *         name: excludeEmpty
 *         schema:
 *           type: boolean
 *         description: Exclude categories with no subcategories
 *     responses:
 *       200:
 *         description: Merged list of categories for all given service types
 *       400:
 *         description: Missing or invalid ids parameter
 */
router.get("/categories/by-service-types", categoryController.getCategoriesMultiple);

router.get("/service-types/:serviceTypeId/categories", categoryController.getCategories);
router.post("/service-types/:serviceTypeId/categories", verifyJWT, checkActiveUser, imageUpload.single("image"), validate(createValidation), categoryController.createCategory);
router.post(
  "/service-types/:serviceTypeId/categories/bulk",
  verifyJWT,
  checkActiveUser,
  imageUpload.any(),
  parseBodyJson("categories"),
  validate(bulkCreateValidation),
  categoryController.bulkCreate
);
/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete("/categories/:id", verifyJWT, checkActiveUser, categoryController.deleteCategory);

export default router;
