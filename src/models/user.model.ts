import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public emailVerifiedAt?: Date;
  public rememberToken?: string;
  public password!: string;
  public roleId?: number;
  public mobileNumber!: string;
  public isActive!: boolean;
  public countryCode?: string;
  public profileImage?: string;
  public cloudinaryId?: string;
  public lastLoginAt?: Date;
  public profileAddress?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Associations
  public role?: { name: string };
}

User.init(
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
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rememberToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobileNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'role_id',
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_image',
    },
    cloudinaryId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cloudinary_id',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    profileAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_address',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    countryCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    sequelize,
    underscored: true,
    paranoid: true,
  }
);

export default User;
