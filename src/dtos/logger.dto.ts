import { LogCategory, LogEventType, LogStatus } from "@/enums/log.enum";

export interface LoggerRequestQuery {
  eventType?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  serviceId?: string;
  bookingId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  page?: number;
}

export interface LogAttributes {
  id?: number;
  eventType: string;
  category: LogCategory;
  message: string;

  userId?: number;
  serviceId?: number;
  bookingId?: number;

  status?: LogStatus;
  metadata?: object;

  createdAt?: Date;
}

export type EventTypeResult = {
  value: string;
  label: string;
};
