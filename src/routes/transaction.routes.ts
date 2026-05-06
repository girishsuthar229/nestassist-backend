import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

/**
 * Transaction Routes
 * Base path: /api/transactions
 */
router.use(verifyJWT,checkActiveUser);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management for administrators.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         bookingId:
 *           type: string
 *         userName:
 *           type: string
 *         transactionId:
 *           type: string
 *         mobileNumber:
 *           type: string
 *         serviceName:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 */
router.get("/", transactionController.getTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 */
router.get("/:id", transactionController.getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */
router.delete("/:id", transactionController.deleteTransaction);

export default router;
