import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../configs/db";

export interface AddressAttributes {
  id: number;
  userId: number;
  label: string;
  houseFlatNumber: string;
  landmark?: string | null;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  customLabel?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressCreationAttributes
  extends Optional<
    AddressAttributes,
    | "id"
    | "landmark"
    | "latitude"
    | "longitude"
    | "customLabel"
    | "city"
    | "state"
    | "country"
    | "postcode"
    | "createdAt"
    | "updatedAt"
  > {}

export class Address
  extends Model<AddressAttributes, AddressCreationAttributes>
  implements AddressAttributes
{
  public id!: number;
  public userId!: number;
  public label!: string;
  public houseFlatNumber!: string;
  public landmark?: string | null;
  public address!: string;
  public latitude?: string | number | null;
  public longitude?: string | number | null;
  public customLabel?: string | null;
  public city?: string | null;
  public state?: string | null;
  public country?: string | null;
  public postcode?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Address.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    houseFlatNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    landmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    customLabel: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    postcode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "addresses",
    sequelize,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

export default Address;
