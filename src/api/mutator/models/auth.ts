// src/api/models/auth.ts
export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

export interface LoginResponse {
  status: string;
  message: string;
  responseData: {
    user: User;
    // Lưu ý: Token không có ở đây vì nó nằm trong Cookie HttpOnly
  };
}
