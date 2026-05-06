import logger from "@/utils/logger";
import { io } from "../socket";
import { WhereOptions, Op, FindAndCountOptions } from "sequelize";
import {
  EventTypeResult,
  LogAttributes,
  LoggerRequestQuery,
} from "@/dtos/logger.dto";
import { humanizeString } from "@/utils/common.utils";
import { LogCategory, LogEventType, LogStatus } from "@/enums/log.enum";
import {
  createLogEvent,
  findAndCountAllLogs,
  findEventTypesCount,
} from "@/repositories/logger.repository";

const buildLogWhereClause = (
  query: LoggerRequestQuery,
): WhereOptions<LogAttributes> => {
  const where: WhereOptions<LogAttributes> = {};

  if (query.eventType) {
    where.eventType = query.eventType as LogEventType;
  }

  if (query.category) {
    where.category = query.category as LogCategory;
  }

  if (query.status) {
    where.status = query.status as LogStatus;
  }

  if (query.userId && !Number.isNaN(Number(query.userId))) {
    where.userId = Number(query.userId);
  }

  if (query.serviceId && !Number.isNaN(Number(query.serviceId))) {
    where.serviceId = Number(query.serviceId);
  }

  if (query.bookingId && !Number.isNaN(Number(query.bookingId))) {
    where.bookingId = Number(query.bookingId);
  }

  if (typeof query.search === "string" && query.search.trim()) {
    const q = query.search.trim();
    (where as any)[Op.or] = [
      { message: { [Op.iLike]: `%${q}%` } },
      { eventType: { [Op.iLike]: `%${q}%` } as any },
    ] as any;
  }

  if (query.fromDate || query.toDate) {
    const createdAtFilter: Record<symbol, Date> = {};

    if (query.fromDate) {
      const from = new Date(query.fromDate);

      if (from && !isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        createdAtFilter[Op.gte] = from;
      }
    }

    if (query.toDate) {
      const to = new Date(query.toDate);

      if (to && !isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAtFilter[Op.lte] = to;
      }
    }

    if (createdAtFilter[Op.gte] || createdAtFilter[Op.lte]) {
      where.createdAt = createdAtFilter;
    }
  }

  return where;
};

export const logEvent = async (payload: LogAttributes) => {
  try {
    logger.info(payload.message);

    const log = await createLogEvent(payload);

    if (io) {
      io.to("ADMIN")?.emit("LOG_CREATED", log);
    }

    return log;
  } catch (error) {
    logger.error("Logger error", { error, payload });
    throw error;
  }
};

export const getLogsService = async (query: LoggerRequestQuery) => {
  const where = buildLogWhereClause(query);

  const limit = Math.min(Number(query.limit) || 10, 100);
  const page = Math.max(Number(query.page) || 1, 1);

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "DESC";

  const options: FindAndCountOptions<LogAttributes> = {
    where,
    order: [[sortBy, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    raw: true,
  };

  const { rows: data, count: totalItems } = await findAndCountAllLogs(options);
  return {
    data,
    pagination: {
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      limit,
    },
  };
};

export const getEventTypesOfLogService = async (
  category?: LogCategory,
): Promise<EventTypeResult[]> => {
  const where: WhereOptions<LogAttributes> = category ? { category } : {};

  const rows = await findEventTypesCount(where);

  return (rows as LogAttributes[]).map((row) => ({
    value: row.eventType,
    label: humanizeString(row.eventType),
  }));
};
