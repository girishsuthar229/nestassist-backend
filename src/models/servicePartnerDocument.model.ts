import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServicePartnerDocument extends Model {
  public id!: number;
  public partnerId!: number;
  public documentUrl!: string;
  public documentName?: string;
  public size?: string;
  public cloudinaryId?: string;
}

ServicePartnerDocument.init(
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
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    documentName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cloudinaryId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "service_partner_documents",
    sequelize,
    underscored: true,
  }
);
