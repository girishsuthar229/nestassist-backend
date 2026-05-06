export interface ITransaction {
  id: string;
  userId: string;
  bookingId?: string;
  userName: string;
  transactionId: string;
  mobileNumber: string;
  serviceName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

export interface ITransactionFilter {
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface IOtherTransaction {
  id: string;
  transactionId: string;
  service: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface ITransactionDetails {
  id: string;
  userId: string;
  bookingId?: string;
  invoiceNumber?:string,
  userName: string;
  transactionId: string;
  mobileNumber: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  currency: string;
  paymentType: string;
  paymentMethod: string;
  dateTime: string;
  otherTransactions: IOtherTransaction[];
}
