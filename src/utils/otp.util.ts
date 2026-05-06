/**
 * Generate a random 4-digit OTP string.
 */
export const generateOtp = (): string => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};

/**
 * Return a Date object representing `minutes` from now.
 */
export const getOtpExpiry = (minutes = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Parse DB timestamp (stored in Postgres `timestamp without time zone`)
 * as UTC-naive time.
 *
 * Example:
 * DB raw shown as local: Thu Apr 02 2026 04:52:33 GMT+0530
 * We want to interpret "04:52:33" as UTC, not IST.
 */
export const parseDbTimestampAsUTC = (value: Date | string): number => {
  if (!value) return NaN;

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    const seconds = String(value.getSeconds()).padStart(2, "0");
    const milliseconds = String(value.getMilliseconds()).padStart(3, "0");

    // Treat displayed parts as UTC
    return Date.parse(
      `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`,
    );
  }

  return Date.parse(value.replace(" ", "T") + "Z");
};