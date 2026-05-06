import { DataTypes, Model } from "sequelize";
import sequelize from "../configs/db";

export class Contact extends Model {
  public id!: number;
  public name!: string;
  public mobile!: string;
  public email!: string;
  public description!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contact.init(
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
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: "contacts",
    sequelize,
  }
);

export default Contact;
