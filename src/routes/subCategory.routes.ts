import { Router } from "express";
import * as subCategoryController from "../controllers/subCategory.controller";
import { validate } from "../middlewares/validate.middleware";
import { createValidation } from "../validations/subCategory.validation";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";
import { imageUpload } from "@/middlewares/upload.middleware";

const router = Router();

router.get("/categories/:categoryId/subcategories", verifyJWT, checkActiveUser,subCategoryController.getSubCategories);
router.post("/categories/:categoryId/subcategories", verifyJWT, checkActiveUser, imageUpload.single("image"), validate(createValidation), subCategoryController.createSubCategory);
/**
 * @swagger
 * /api/subcategories/{id}:
 *   delete:
 *     summary: Delete a sub-category
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sub-category ID
 *     responses:
 *       200:
 *         description: Sub-category deleted successfully
 */
router.delete("/subcategories/:id", verifyJWT, checkActiveUser, subCategoryController.deleteSubCategory);

export default router;
