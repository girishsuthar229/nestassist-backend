export interface SendOtpInput {
  name: string;
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface ResendOtpInput {
  email: string;
}

export interface CustomerUserData {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  role:string | null;
}

export interface VerifyOtpResult {
  user: CustomerUserData;
  token: string;
  token_type: string;
  expires_in: number;
}

export interface SendOtpResult {
  name: string;
  email: string;
}