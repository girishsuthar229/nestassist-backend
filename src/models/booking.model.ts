import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";
import { BookingStatus } from "@/enums/transaction.enum";

export class Booking extends Model {
  public id!: number;
  public addressId!: number | null;
  public paymentId!: number | null;
  public serviceId!: number;
  public serviceTypeId!: number | null;
  public userId!: number;
  public servicePartnerId!: number | null;
  public status!: BookingStatus;
  public bookingDate!: Date;

  public serviceDuration!: number | null;
  public serviceAddress!: string | null;
  public amount!: number | null;
  public receiptUrl!: string | null;
  public cancellationReason!: string | null;
  public expiresAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    addressId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    servicePartnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BookingStatus)),
      defaultValue: BookingStatus.PENDING,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    serviceDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    serviceAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "bookings",
    sequelize,
    underscored: true,
    indexes: [
      { fields: ["service_id"] },
      { fields: ["service_type_id"] },
      { fields: ["status"] },
      { fields: ["service_partner_id"] },
      { fields: ["payment_id"] },
      { fields: ["address_id"] },
    ],
  },
);

export default Booking;
