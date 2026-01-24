// src/api/models/auth.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    account: User;
  };
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errors?: {
    field: string;
    message: string;
  }[];
}
