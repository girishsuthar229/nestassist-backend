import { CreateSubCategoryDto } from "./subCategory.dto";

export interface CreateCategoryDto {
  id?: number;
  name: string;
  imageUrl?: string | null;
  image?: string; // Field name in multipart request
  cloudinaryId?: string | null;
  subCategories?: CreateSubCategoryDto[];
}

export interface UpdateCategoryDto {
  name?: string;
  imageUrl?: string;
  cloudinaryId?: string;
}
