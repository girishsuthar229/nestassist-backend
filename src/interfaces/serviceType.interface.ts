export interface IServiceType {
  id: number;
  name: string;
  image?: string;
}

export type ServiceCountRow = {
  categoryId: number | string;
  servicesCount: number | string;
};

export type CategoryModelLike = {
  id?: unknown;
  setDataValue?: (key: string, value: unknown) => void;
};
