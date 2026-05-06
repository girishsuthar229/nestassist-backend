import { ServiceType } from "@/models";
import { Op, Includeable } from "sequelize";

/**
 * Repository for ServiceType model operations.
 */
export const serviceTypeRepository = {
  /**
   * Find a service type by its primary key.
   */
  findById: (id: string | number, include?: Includeable[]) => {
    return ServiceType.findByPk(id, { 
      include,
    });
  },

  /**
   * Find a service type by its name.
   */
  findByName: (name: string) => {
    return ServiceType.findOne({ 
      where: { name },
      attributes: { exclude: ["cloudinaryId", "bannerCloudinaryId"] }
    });
  },

  /**
   * Find all service types with pagination and custom order.
   */
  findAll: (options: { 
    limit?: number; 
    offset?: number; 
    order?: any; 
    where?: any; 
    attributes?: string[];
    include?: Includeable[];
    transaction?: any;
  }) => {
    return ServiceType.findAll({
      ...options,
      attributes: options.attributes || { exclude: ["cloudinaryId", "bannerCloudinaryId"] }
    });
  },

  /**
   * Find and count all service types for pagination.
   */
  findAndCountAll: (options: { 
    limit: number; 
    offset: number; 
    order?: any; 
    where?: any;
    include?: Includeable[];
    transaction?: any;
  }) => {
    return ServiceType.findAndCountAll({
      ...options,
      attributes: { exclude: ["cloudinaryId", "bannerCloudinaryId"] }
    });
  },

  /**
   * Create a new service type.
   */
  create: (data: any) => {
    return ServiceType.create(data);
  },

  /**
   * Update an existing service type.
   */
  update: async (id: string | number, data: any) => {
    const item = await ServiceType.findByPk(id);
    if (item) {
      return item.update(data);
    }
    return null;
  },

  /**
   * Delete a service type.
   */
  delete: async (id: string | number) => {
    const item = await ServiceType.findByPk(id);
    if (item) {
      return item.destroy();
    }
    return null;
  },
};
