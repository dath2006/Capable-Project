import { ApiError, apiRequest } from "../lib/api-client";

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  study_field: string;
  semester?: string;
  college_name?: string;
  phone?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token: string;
}

export interface PasswordActionResponse {
  message: string;
}

export async function signup(data: SignupPayload) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: data,
  });
}

export async function login(data: LoginPayload): Promise<LoginResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: data,
  });
}

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(
  data: ResetPasswordPayload,
): Promise<PasswordActionResponse> {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: data,
  });
}

export { ApiError };
