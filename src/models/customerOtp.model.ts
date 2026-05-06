import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../configs/db";

interface CustomerOtpAttributes {
  id: number;
  email: string;
  otp: string;
  expires_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
}

type CustomerOtpCreationAttributes = Optional<CustomerOtpAttributes, "id">;

class CustomerOtp
  extends Model<CustomerOtpAttributes, CustomerOtpCreationAttributes>
  implements CustomerOtpAttributes
{
  public id!: number;
  public email!: string;
  public otp!: string;
  public expires_at!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public name!: string;
}

CustomerOtp.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "user_otps",
    sequelize,
    underscored: true,
  }
);

export default CustomerOtp;
