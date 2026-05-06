// src/models/Log.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../configs/db";
import { LogCategory, LogStatus } from "../enums/log.enum";
import { LogAttributes } from "@/dtos/logger.dto";
import User from "./user.model";
import { Service } from "./service.model";
import Booking from "./booking.model";

export interface LogCreationAttributes extends Optional<
  LogAttributes,
  "id" | "status" | "metadata"
> {}

export class Log
  extends Model<LogAttributes, LogCreationAttributes>
  implements LogAttributes
{
  public id!: number;
  public eventType!: string;
  public category!: LogCategory;
  public message!: string;

  public userId?: number;
  public serviceId?: number;
  public bookingId?: number;

  public user?: User;
  public service?: Service;
  public booking?: Booking;

  public status?: LogStatus;
  public metadata?: object;

  public readonly createdAt!: Date;
}

Log.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    category: {
      type: DataTypes.ENUM(...Object.values(LogCategory)),
      allowNull: false,
    },

    message: { type: DataTypes.TEXT, allowNull: false },

    userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "service_id",
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "booking_id",
    },

    status: {
      type: DataTypes.ENUM(...Object.values(LogStatus)),
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "logs",
    underscored: true,
    timestamps: true,
    updatedAt: false,

    indexes: [
      { fields: ["event_type"] },
      { fields: ["category"] },
      { fields: ["user_id"] },
      { fields: ["created_at"] },
      { fields: ["booking_id"] },
      { fields: ["service_id"] },
      { fields: ["status"] },
    ],
  },
);

export default Log;
