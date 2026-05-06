import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class Admin extends Model {
  public id!: number;
  public name!: string;
  public profileImage?: string | null;
  public email!: string;
  public countryCode?: string | null;
  public mobile?: string | null;
  public address?: string | null;
  public password!: string;
  public isActive!: boolean;
  public isSuperAdmin!: boolean;
  public lastLoginAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date | null;
}

Admin.init(
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
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    countryCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "admins",
    sequelize,
    underscored: true,
    paranoid: true, // Enables soft deletes
  }
);

export default Admin;
