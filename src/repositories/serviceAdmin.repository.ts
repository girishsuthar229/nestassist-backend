import { Op } from "sequelize";
import { Category, Service, SubCategory, ServiceType, User, Role } from "@/models";

export const serviceAdminRepository = {
  // ================= LIST =================
  listServicesByCategory: (where: any, limit: number, offset: number) => {
    return Service.findAndCountAll({
      where,
      include: [
        {
          model: SubCategory,
          as: "subCategory",
          required: true,
          include: [{ model: Category, as: "category", required: true }],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
          include: [{ model: Role, as: "role", attributes: ["name"] }],
        },
      ],
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit,
      offset,
    });
  },

  // ================= GET =================
  getServiceById: (id: number) => {
    return Service.findByPk(id, {
      include: [
        {
          model: SubCategory,
          as: "subCategory",
          include: [
            {
              model: Category,
              as: "category",
              include: [
                {
                  model: ServiceType,
                  as: "serviceType",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
          include: [{ model: Role, as: "role", attributes: ["name"] }],
        },
      ],
    });
  },

  // ================= CATEGORY =================
  getCategoryById: (id: number) => Category.findByPk(id),

  getSubCategoryById: (id: number) => SubCategory.findByPk(id),

  // ================= DUPLICATE CHECK =================
  findDuplicateService: (
    categoryId: number,
    subCategoryId: number,
    name: string,
    excludeId?: number,
  ) => {
    return Service.findOne({
      where: {
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
        categoryId,
        subCategoryId,
        name: { [Op.iLike]: name },
      },
    });
  },

  // ================= CREATE =================
  createService: (payload: any) => Service.create(payload),

  // ================= UPDATE =================
  getServiceEntity: (id: string | number) => Service.findByPk(id),

  updateService: (item: Service, payload: any) => item.update(payload),

  // ================= DELETE =================
  deleteService: (item: Service) => item.destroy(),
};
