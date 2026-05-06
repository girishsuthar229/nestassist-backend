import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class SubCategory extends Model {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public imageUrl?: string;
  public cloudinaryId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SubCategory.init(
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
    categoryId: {
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
    tableName: "sub_categories",
    sequelize,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'category_id']
      }
    ]
  }
);

export default SubCategory;
