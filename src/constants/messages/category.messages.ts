export const CATEGORY = {
  // Success
  CREATED: "Category created successfully",
  DELETED: "Category deleted successfully",
  FETCHED: "Categories fetched successfully",
  BULK_UPSERT_COMPLETED: "Bulk upsert completed",

  // Errors
  NOT_FOUND: "Category not found",
  NAME_EXISTS: "Category name already exists for this service type.",
  CANNOT_DELETE_HAS_SUBCATEGORIES: "Cannot delete Categories because it has associated sub-categories.",
  CANNOT_DELETE_HAS_SERVICES: "Cannot delete Category because it has associated services.",
  INVALID_FORMAT: "Invalid categories format",
  MUST_BE_ARRAY: "Categories must be an array",
  ADMIN_ONLY_CREATE: "Only admins can create categories",
  ADMIN_ONLY_DELETE: "Only admins can delete categories",
  INVALID_ID: "Invalid categoryId",
} as const;

export const SUBCATEGORY = {
  // Success
  CREATED: "SubCategory created successfully",
  DELETED: "SubCategory deleted successfully",

  // Errors
  NOT_FOUND: "Subcategory not found",
  NAME_EXISTS: "Subcategory name already exists for this category.",
  CANNOT_DELETE_HAS_SERVICES: "Cannot delete SubCategory because it has associated services.",
  CANNOT_DELETE_HAS_SERVICE_MANAGEMENT: "Cannot delete SubCategories because it has associated serviceManagement.",
  INVALID_ID: "Invalid subCategoryId",
  NOT_BELONG_TO_CATEGORY: "Sub Category does not belong to the given Category",
} as const;
