import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";
import type { SubCategory } from "./subCategory.model";

export class Category extends Model {
  public id!: number;
  public name!: string;
  public serviceTypeId!: number;
  public imageUrl?: string;
  public cloudinaryId?: string;
  public subcategories?: SubCategory[]; // Simplified for now to avoid circular dependency issues in model file

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    serviceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cloudinaryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "categories",
    sequelize,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'service_type_id']
      }
    ]
  }
);

export default Category;
