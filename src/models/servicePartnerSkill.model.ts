import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServicePartnerSkill extends Model {
  public id!: number;
  public partnerId!: number;
  public categoryId!: number;
}

ServicePartnerSkill.init(
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "service_partner_skills",
    sequelize,
    underscored: true,
  }
);
