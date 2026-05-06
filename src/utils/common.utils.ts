import { FalseValues, TrueValues } from "@/enums";

/**
 * Converts input into a clean string array.
 * Supports:
 * - Array input
 * - JSON string array (e.g. '["a","b"]')
 * - Comma-separated string (e.g. 'a,b,c')
 */
export const parseStringArray = (value: unknown): string[] | undefined => {
  if (value == null) return undefined;

  // If already an array
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return undefined;

  const str = value.trim();
  if (!str || str === "[]") return [];

  // Try parsing JSON array
  if (str.startsWith("[")) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // fallback to CSV parsing
    }
  }

  // Fallback: comma-separated string
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * Safely converts input into a number.
 * Returns undefined for invalid or empty values.
 */
export const parseNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return value == null || value === "" || !Number.isFinite(num)
    ? undefined
    : num;
};

/**
 * Converts input into boolean.
 * Supports: yes/no, true/false, 1/0 (case-insensitive)
 */
export const parseAvailability = (value: unknown): boolean | undefined => {
  if (value == null || value === "") return undefined;

  const v = String(value).toLowerCase();

  if (Object.values(TrueValues).includes(v as TrueValues)) return true;
  if (Object.values(FalseValues).includes(v as FalseValues)) return false;

  return undefined;
};

/**
 * Safely parses a JSON array from a string or returns the array itself.
 */
export const parseJsonArray = <T>(value: unknown): T[] | undefined => {
  if (value == null) return undefined;

  if (Array.isArray(value)) return value as T[];

  if (typeof value !== "string") return undefined;

  const str = value.trim();
  if (!str || str === "[]") return [];

  try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
      return undefined;
  }
};


export const parseBookingDate = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(time);
  if (!match) throw new Error("Invalid time format");

  let [_, h, m, p] = match;
  let hours = Number(h);
  const minutes = Number(m);

  if (p.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (p.toUpperCase() === "AM" && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes);
};

export const futureSevenDayLimit = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
);

export const humanizeString = (() => {
  const UNDERSCORE = /_/g;
  const WORD_BOUNDARY = /\b\w/g;

  return (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(UNDERSCORE, " ")
      .replace(WORD_BOUNDARY, (c) => c.toUpperCase());
  };
})();

export const roundUpToNextQuarter = (date: Date) => {
    const rounded = new Date(date);

    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0) {
      rounded.setMinutes(minutes + (15 - remainder));
    }

    // Handle overflow (e.g., 46 → next hour)
    if (rounded.getMinutes() === 60) {
      rounded.setHours(rounded.getHours() + 1);
      rounded.setMinutes(0);
    }

    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    return rounded;
};

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);