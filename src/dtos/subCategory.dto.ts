export interface CreateSubCategoryDto {
  id?: number;
  name: string;
  imageUrl?: string | null;
  image?: string; // Field name in multipart request
  cloudinaryId?: string | null;
  hasImage?: boolean; // Sequential matching flag
}

export interface UpdateSubCategoryDto {
  name?: string;
  imageUrl?: string;
  cloudinaryId?: string;
}
