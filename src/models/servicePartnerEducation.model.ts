import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServicePartnerEducation extends Model {
  public id!: number;
  public partnerId!: number;
  public schoolCollege!: string;
  public passingYear!: number;
  public marks!: string;
}

ServicePartnerEducation.init(
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
    schoolCollege: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    passingYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marks: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "service_partner_educations",
    sequelize,
    underscored: true,
  }
);
