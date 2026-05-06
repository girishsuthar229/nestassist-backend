export interface IContact {
    id: number;
    name: string;
    email: string;
    mobile: string;
    description: string;
  }
  
export interface ContactFilterQuery {
  name?: string;
  submissionDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}