import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServicePartnerService extends Model {
  public id!: number;
  public partnerId!: number;
  public subCategoryId!: number;
}

ServicePartnerService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    partnerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "service_partner_services",
    sequelize,
    underscored: true,
  }
);
