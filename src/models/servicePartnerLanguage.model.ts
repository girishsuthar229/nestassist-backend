import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";
import { Proficiency } from "../enums/servicePartner.enum";

export class ServicePartnerLanguage extends Model {
  public id!: number;
  public partnerId!: number;
  public language!: string;
  public proficiency!: Proficiency;
}

ServicePartnerLanguage.init(
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
    language: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    proficiency: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Expert'),
      allowNull: false,
    },
  },
  {
    tableName: "service_partner_languages",
    sequelize,
    underscored: true,
  }
);
