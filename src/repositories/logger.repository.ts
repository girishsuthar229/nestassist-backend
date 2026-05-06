import { FindAndCountOptions, WhereOptions, fn, col, literal } from "sequelize";
import { LogAttributes } from "@/dtos/logger.dto";
import { Log, User } from "@/models";

export const createLogEvent = async (data: LogAttributes) => {
  return await Log.create(data);
};

export const findAndCountAllLogs = async (
  options: FindAndCountOptions<LogAttributes>,
) => {
  return await Log.findAndCountAll({
    ...options,
    include: [{ model: User, as: "user", attributes: ["name", "email"] }],
  });
};

export const findEventTypesCount = async (
  where: WhereOptions<LogAttributes>,
) => {
  return await Log.findAll({
    attributes: [
      ["event_type", "eventType"],
      [fn("COUNT", col("event_type")), "count"],
    ],
    where,
    group: ["event_type"],
    order: [[literal("count"), "DESC"]],
    raw: true,
  });
};
