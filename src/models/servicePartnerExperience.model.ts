import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServicePartnerExperience extends Model {
  public id!: number;
  public partnerId!: number;
  public companyName?: string;
  public role?: string;
  public from?: string;
  public to?: string;
}

ServicePartnerExperience.init(
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
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    from: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    to: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "service_partner_experiences",
    sequelize,
    underscored: true,
  }
);
