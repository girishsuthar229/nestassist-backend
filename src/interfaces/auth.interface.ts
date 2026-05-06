import { JwtPayload } from "jsonwebtoken";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface DecodedToken {
  sub: number;
  email: string;
  role: string;
  type: string;
}


export interface TokenPayload extends JwtPayload {
  email?: string; 
  role?: string; 
  sub?: string;
  iss?: string; 
  iat?: number; 
  exp?: number; 
  nbf?: number; 
  jti?: string; 
  prv?: string; 
}

export interface CustomerJwtPayload {
    sub: number;
    email: string;
    role?: string;
    iat?: number;
    exp?: number;
  }
