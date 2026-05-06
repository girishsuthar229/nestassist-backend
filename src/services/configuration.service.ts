import Configuration from "@/models/configuration.model";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * Get all Configurations
 */
export const getConfigurations = async () => {
  logger.info("ConfigurationService: Fetching all configurations");
  return Configuration.findAll({
    order: [["configKey", "ASC"]],
  });
};

/**
 * Get Configuration by configKey
 */
export const getConfigurationByKey = async (configKey: string) => {
  logger.info(`ConfigurationService: Fetching configuration by key: ${configKey}`);

  const configuration = await Configuration.findOne({
    where: { configKey },
  });

  if (!configuration) {
    logger.warn(`Configuration not found with key: ${configKey}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CONFIGURATION.NOT_FOUND);
  }

  return configuration;
};

/**
 * Update Configuration value only
 */
export const updateConfigurationValue = async (id: string, value: any) => {
  logger.info(`ConfigurationService: Updating configuration value for ID: ${id}`);

  const configuration = await Configuration.findByPk(id);
  if (!configuration) {
    logger.warn(`Configuration not found with ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CONFIGURATION.NOT_FOUND);
  }

  switch (configuration.valueType) {
    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        logger.warn(`Invalid number value provided for configuration ID: ${id}`);
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_NUMBER);
      }
      value = numValue;
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && typeof value !== 'string') {
        logger.warn(`Invalid boolean value provided for configuration ID: ${id}`);
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_BOOLEAN);
      }
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue !== 'true' && lowerValue !== 'false') {
          logger.warn(`Invalid boolean string value provided for configuration ID: ${id}`);
          throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.BOOLEAN_MUST_BE_TRUE_OR_FALSE);
        }
        value = lowerValue === 'true';
      }
      break;

    case 'json':
      if (typeof value !== 'object' && typeof value !== 'string') {
        logger.warn(`Invalid JSON value provided for configuration ID: ${id}`);
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_JSON);
      }
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          logger.warn(`Invalid JSON string provided for configuration ID: ${id}`);
          throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_JSON_STRING);
        }
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        logger.warn(`Invalid date value provided for configuration ID: ${id}`);
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_DATE);
      }
      value = dateValue;
      break;

    case 'string':
      if (typeof value !== 'string' && typeof value !== 'number') {
        logger.warn(`Invalid string value provided for configuration ID: ${id}`);
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.INVALID_STRING);
      }
      value = String(value);
      break;

    default:
      logger.warn(`Unknown valueType for configuration ID: ${id}`);
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CONFIGURATION.UNKNOWN_VALUE_TYPE);
  }

  configuration.setTypedValue(value);
  await configuration.save();

  logger.info(`Configuration value updated for ID: ${id}`);
  return configuration;
};
