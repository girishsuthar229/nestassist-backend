import { Request, Response, NextFunction } from "express";
import * as TransactionService from "../services/transaction.service";
import logger from "../utils/logger";
import { ITransactionFilter } from "../interfaces/transaction.interface";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";

/**
 * Get all transactions
 */
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("TransactionController: Get all transactions request");

    const {
      minAmount,
      maxAmount,
      paymentMethod,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const filter: ITransactionFilter = {
      minAmount: minAmount !== undefined ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount !== undefined ? parseFloat(maxAmount as string) : undefined,
      paymentMethod: paymentMethod as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC',
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    };

    const data = await TransactionService.getAllTransactions(filter);

    return sendResponse(res, {
      data: data.transactions,
      pagination: data.pagination,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`TransactionController: Error fetching transactions: ${message}`);
    next(error);
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    logger.info(`TransactionController: Delete transaction request for ID: ${id}`);

    await TransactionService.deleteTransaction(id as string);

    return sendResponse(res, MESSAGES.TRANSACTION.DELETED);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`TransactionController: Error deleting transaction: ${message}`);
    next(error);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    logger.info(`TransactionController: Get transaction by ID request for ID: ${id}`);

    const data = await TransactionService.getTransactionById(id as string);

    return sendResponse(res, undefined, data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`TransactionController: Error fetching transaction by ID: ${message}`);
    next(error);
  }
};
