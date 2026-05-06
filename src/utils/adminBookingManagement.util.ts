import { ApiError } from "@/utils/apiError.util";
import { BookingStatus, PaymentMethod } from "@/enums/transaction.enum";
import type {
  BookingDetailRow,
  BookingDetailStatus,
  BookingRowStatus,
} from "@/interfaces/adminBookingManagement.interface";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { FormatOptions } from "@/dtos/services.dto";

const BOOKING_ROW_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const satisfies Record<string, BookingRowStatus>;

const BOOKING_DETAIL_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const satisfies Record<string, BookingDetailStatus>;

const BOOKING_STATUS_INPUT_MAP = new Map<string, BookingStatus>([
  ["pending", BookingStatus.PENDING],
  ["p", BookingStatus.PENDING],
  ["confirmed", BookingStatus.CONFIRMED],
  ["in progress", BookingStatus.CONFIRMED],
  ["in-progress", BookingStatus.CONFIRMED],
  ["in_progress", BookingStatus.CONFIRMED],
  ["completed", BookingStatus.COMPLETED],
  ["complete", BookingStatus.COMPLETED],
  ["cancelled", BookingStatus.CANCELLED],
  ["canceled", BookingStatus.CANCELLED],
]);

const ROW_STATUS_BY_BOOKING_STATUS: Record<BookingStatus, BookingRowStatus> = {
  [BookingStatus.PENDING]: BOOKING_ROW_STATUS.PENDING,
  [BookingStatus.CONFIRMED]: BOOKING_ROW_STATUS.IN_PROGRESS,
  [BookingStatus.COMPLETED]: BOOKING_ROW_STATUS.COMPLETED,
  [BookingStatus.CANCELLED]: BOOKING_ROW_STATUS.CANCELLED,
};

const DETAIL_STATUS_BY_BOOKING_STATUS: Record<
  BookingStatus,
  BookingDetailStatus
> = {
  [BookingStatus.PENDING]: BOOKING_DETAIL_STATUS.PENDING,
  [BookingStatus.CONFIRMED]: BOOKING_DETAIL_STATUS.CONFIRMED,
  [BookingStatus.COMPLETED]: BOOKING_DETAIL_STATUS.COMPLETED,
  [BookingStatus.CANCELLED]: BOOKING_DETAIL_STATUS.CANCELLED,
};

const PAYMENT_METHOD_LABEL_BY_ENUM: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.CARD]: "Card",
};

const PAYMENT_METHOD_INPUT_MAP = new Map<string, PaymentMethod>([
  ["CASH", PaymentMethod.CASH],
  ["C", PaymentMethod.CASH],
  ["CARD", PaymentMethod.CARD],
  ["DEBIT CARD", PaymentMethod.CARD],
  ["CREDIT CARD", PaymentMethod.CARD],
]);

const normalizeToken = (value: unknown) => String(value ?? "").trim();
const normalizeKey = (value: string) => value.trim().toLowerCase();
const normalizeEnumKey = (value: string) => value.trim().toUpperCase();

const parseBookingStatus = (value: string): BookingStatus | undefined =>
  BOOKING_STATUS_INPUT_MAP.get(normalizeKey(value));

export const normalizeGroupStatusInput = (
  status: unknown,
): BookingRowStatus | undefined => {
  const raw = normalizeToken(status);
  if (!raw) return undefined;
  const parsed = parseBookingStatus(raw);
  if (parsed) return ROW_STATUS_BY_BOOKING_STATUS[parsed];

  throw new ApiError(STATUS_CODE.BAD_REQUEST, `Invalid booking status filter: ${raw}`);
};

export const mapPaymentMethodToLabel = (value: string | null | undefined) => {
  if (!value) return "Unknown";
  const normalized = normalizeEnumKey(value);
  if (normalized === PaymentMethod.CASH)
    return PAYMENT_METHOD_LABEL_BY_ENUM[PaymentMethod.CASH];
  if (normalized === PaymentMethod.CARD)
    return PAYMENT_METHOD_LABEL_BY_ENUM[PaymentMethod.CARD];
  return value;
};

export const mapPaymentMethodFromLabel = (
  value: string | undefined,
): PaymentMethod | undefined => {
  if (!value) return undefined;
  return PAYMENT_METHOD_INPUT_MAP.get(normalizeEnumKey(value));
};

export const parseNumber = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const formatMoneyUsdLike = (amount: number) => {
  const safe = Number.isFinite(amount) ? amount : 0;
  const fixed = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${fixed}`;
};

export const formatDateShort = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatDateTimeDetail = (
  date: Date,
  options: FormatOptions = {}
) => {
  const { includeYear = false, includeComma = true } = options;

  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(includeYear && { year: "numeric" }),
  });

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return includeComma
    ? `${datePart}, ${timePart}`
    : `${datePart} ${timePart}`;
};

export const toDetailStatus = (bookingStatus: string): BookingDetailStatus => {
  const raw = normalizeToken(bookingStatus);
  const parsed = raw ? parseBookingStatus(raw) : undefined;
  return parsed
    ? DETAIL_STATUS_BY_BOOKING_STATUS[parsed]
    : BOOKING_DETAIL_STATUS.PENDING;
};

export const computeRowStatus = (
  details: BookingDetailRow[],
): BookingRowStatus => {
  if (details.length === 0) return BOOKING_ROW_STATUS.CANCELLED;
  if (details.every((d) => d.status === BOOKING_DETAIL_STATUS.CANCELLED))
    return BOOKING_ROW_STATUS.CANCELLED;
  if (details.every((d) => d.status === BOOKING_DETAIL_STATUS.COMPLETED))
    return BOOKING_ROW_STATUS.COMPLETED;
  if (details.every((d) => d.status === BOOKING_DETAIL_STATUS.PENDING))
    return BOOKING_ROW_STATUS.PENDING;
  return BOOKING_ROW_STATUS.IN_PROGRESS;
};

export const normalizeStatusInput = (status: unknown): BookingStatus => {
  const raw = normalizeToken(status);
  if (!raw) throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.STATUS_IS_REQUIRED);
  const parsed = parseBookingStatus(raw);
  if (parsed) return parsed;

  throw new ApiError(STATUS_CODE.BAD_REQUEST, `Invalid booking status: ${raw}`);
};

export const mapBookingStatusToEnum = (
  value: string | null | undefined
): BookingStatus | null => {
  if (!value) return null;
  const raw = normalizeToken(value);
  if (!raw) return null;
  const normalized = normalizeEnumKey(raw);

  if (Object.values(BookingStatus).includes(normalized as BookingStatus)) {
    return normalized as BookingStatus;
  }
  return null;
};