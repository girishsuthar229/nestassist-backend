import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class ServiceType extends Model {
  public id!: number;
  public name!: string;
  public image?: string;
  public cloudinaryId?: string;
  public bannerImage?: string;
  public bannerCloudinaryId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServiceType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100), 
      allowNull: false,
      unique: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cloudinaryId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bannerCloudinaryId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "service_types",
    sequelize,
    underscored: true,
  }
);

export default ServiceType;