import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../configs/db";
import { OfferAttributes } from "@/dtos/offer.dto";

export interface OfferCreationAttributes extends Optional<
  OfferAttributes,
  | "id"
  | "couponDescription"
  | "maxUsage"
  | "usedCount"
  | "isActive"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> {}

export class Offer
  extends Model<OfferAttributes, OfferCreationAttributes>
  implements OfferAttributes
{
  public id!: number;
  public couponCode!: string;
  public couponDescription!: string | null;
  public discountPercentage!: number;
  public maxUsage!: number;
  public usedCount!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;
}

Offer.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    couponDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    maxUsage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "offers",
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ["coupon_code"],
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ["coupon_code", "is_active"],
      },
    ],
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
);

export default Offer;
