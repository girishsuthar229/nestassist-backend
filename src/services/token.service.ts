import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN) || 28800; // 8 hours

interface JwtPayload {
  sub: number;
  email: string;
  role?: string;
}

/**
 * Generate a signed JWT for a customer.
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws if invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
};

/**
 * How long the token is valid for (in seconds) — used in API responses.
 */
export const getExpiresIn = (): number => JWT_EXPIRES_IN_SECONDS;
