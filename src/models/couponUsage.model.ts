import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/configs/db";
import Offer from "./offer.model";

interface CouponUsageAttributes {
  id: number;
  offerId: number;
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CouponUsageCreationAttributes
  extends Optional<
    CouponUsageAttributes,
    "id" | "createdAt" | "updatedAt" | "userId"
  > { }

class CouponUsage
  extends Model<CouponUsageAttributes, CouponUsageCreationAttributes>
  implements CouponUsageAttributes {
  public id!: number;
  public offerId!: number;
  public userId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly offer?: Offer;
}

CouponUsage.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    offerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "offer_id",
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "user_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    tableName: "coupon_usages",
    sequelize,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["offer_id"],
      },
      {
        fields: ["user_id"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export default CouponUsage;
