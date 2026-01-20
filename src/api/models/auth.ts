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
