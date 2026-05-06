import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../configs/db";
import {
  BookingStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
} from "@/enums/transaction.enum";

export interface PaymentAttributes {
  id: number;

  servicePartnerId?: number;

  userId: number;

  serviceId: number;
  addressId: number;
  slot: { date: string; time: string };

  amount: string;
  totalAmount: string;
  tax: string;
  discount: string;
  currency: string;

  couponId?: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;

  paymentGateway?: PaymentGateway;
  orderId?: string;
  sessionId?: string;
  paymentIntentId?: string;
  clientSecret?: string;

  paidAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    | "id"
    | "paymentStatus"
    | "paymentGateway"
    | "orderId"
    | "sessionId"
    | "paymentIntentId"
    | "clientSecret"
    | "paidAt"
    | "couponId"
    | "discount"
    | "currency"
  > {}

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;

  public userId!: number;
  public servicePartnerId?: number;

  public serviceId!: number;
  public addressId!: number;
  public slot!: { date: string; time: string };

  public totalAmount!: string;
  public amount!: string;
  public tax!: string;
  public discount!: string;
  public currency!: string;

  public couponId?: number;

  public paymentMethod!: PaymentMethod;
  public paymentStatus!: PaymentStatus;
  public bookingStatus!: BookingStatus;

  public paymentGateway?: PaymentGateway;
  public orderId?: string;
  public sessionId?: string;
  public paymentIntentId?: string;
  public clientSecret?: string;

  public paidAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    servicePartnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    slot: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidSlot(value: unknown) {
          if (!value || typeof value !== "object")
            throw new Error("Invalid slot");
          const slotValue = value as { date?: unknown; time?: unknown };
          if (
            typeof slotValue.date !== "string" ||
            typeof slotValue.time !== "string"
          ) {
            throw new TypeError("Invalid slot");
          }
        },
      },
    },

    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "INR",
      validate: {
        len: [3, 10],
      },
      set(value: string) {
        this.setDataValue("currency", value?.trim().toUpperCase() || "INR");
      },
    },

    couponId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },

    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },

    bookingStatus: {
      type: DataTypes.ENUM(...Object.values(BookingStatus)),
      allowNull: false,
      defaultValue: BookingStatus.PENDING,
    },

    paymentGateway: {
      type: DataTypes.ENUM(...Object.values(PaymentGateway)),
      allowNull: true,
      field: "payment_gateway",
    },

    orderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "order_id",
    },

    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "session_id",
    },

    paymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "payment_intent_id",
    },

    clientSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "client_secret",
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    sequelize,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["service_id"] },
      { fields: ["service_partner_id"] },
      { fields: ["payment_status"] },
      { fields: ["booking_status"] },
      { fields: ["payment_method"] },
      { fields: ["slot"] },
      { fields: ["created_at"] },
      { fields: ["session_id"] },
      { fields: ["order_id"] },
      { fields: ["payment_gateway"] },
      { fields: ["payment_intent_id"] },
    ],
  }
);

export default Payment;
