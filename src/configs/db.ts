import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    logging: false,
    dialectOptions: process.env.DB_SSL === "true" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    pool: {
      max: 10,        // MAX connections (IMPORTANT)
      min: 2,
      acquire: 30000, // max time to get connection
      idle: 10000,    // close idle connections after 10s
      evict: 10000,   // cleanup interval
    },
    retry: {
      max: 5,
      match: [
        /ETIMEDOUT/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTUNREACH/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
    },
  }
);

export default sequelize;