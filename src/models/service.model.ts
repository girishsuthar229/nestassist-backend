import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class Service extends Model {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public subCategoryId!: number;
  public price!: string;
  public duration!: number | null;
  public commission!: string;
  public availability!: boolean;
  public images!: string[];
  public cloudinaryIds!: string[];
  public includeServices!: string[];
  public excludeServices!: string[];
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    availability: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    cloudinaryIds: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    includeServices: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    excludeServices: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
    },
  },
  {
    tableName: "services",
    sequelize,
    indexes: [
      { fields: ["category_id"] },
      { fields: ["sub_category_id"] },
      { fields: ["availability"] },
      { fields: ["price"] },
      { fields: ["commission"] },
    ],
    underscored: true
  }
);

export default Service;
