import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";
import { Gender, ServicePartnerStatus, VerificationStatus } from "../enums/servicePartner.enum";

export class ServicePartner extends Model {
  public id!: number;
  public userId!: number;
  public dob!: Date;
  public gender!: Gender;
  public serviceTypeIds!: number[];
  public permanentAddress?: string;
  public residentialAddress?: string;
  public verificationStatus!: VerificationStatus;
  public status!: ServicePartnerStatus;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ServicePartner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: false,
    },
    serviceTypeIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      field: 'service_type_id',
    },
    permanentAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    residentialAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM(...Object.values(VerificationStatus)),
      allowNull: false,
      defaultValue: VerificationStatus.PENDING,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ServicePartnerStatus)),
      allowNull: false,
      defaultValue: ServicePartnerStatus.INACTIVE,
    },
  },
  {
    tableName: "service_partners",
    sequelize,
    underscored: true,
  }
);
