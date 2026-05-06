import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/configs/db';

interface ConfigurationAttributes {
  id: number;
  configKey: string;
  name: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConfigurationCreationAttributes extends Optional<ConfigurationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'isActive'> { }

class Configuration extends Model<ConfigurationAttributes, ConfigurationCreationAttributes> implements ConfigurationAttributes {
  public id!: number;
  public configKey!: string;
  public name!: string;
  public value!: string;
  public valueType!: 'string' | 'number' | 'boolean' | 'json' | 'date';
  public description?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to get typed value
  public getTypedValue(): string | number | boolean | object | Date {
    switch (this.valueType) {
      case 'number':
        return Number(this.value);
      case 'boolean':
        return this.value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return this.value;
        }
      case 'date':
        return new Date(this.value);
      default:
        return this.value;
    }
  }

  // Helper method to set typed value
  public setTypedValue(value: any): void {
    this.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}

Configuration.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    configKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    valueType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'date'),
      allowNull: false,
      defaultValue: 'string',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'configurations',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['configKey'],
        unique: true,
      },
      {
        fields: ['name'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export default Configuration;
