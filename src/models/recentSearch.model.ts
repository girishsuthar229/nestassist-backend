import { Model, DataTypes } from "sequelize";
import sequelize from "../configs/db";


class RecentSearch extends Model {
  public id!: number;
  public userId!: number;
  public latitude!: string;
  public longitude!: string;
  public address_line1!: string;
  public address_line2!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public postcode!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RecentSearch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    address_line1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address_line2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "RecentSearch",
    tableName: "recent_searches",
    underscored: true,
    timestamps: true,
  }
);


export default RecentSearch;
