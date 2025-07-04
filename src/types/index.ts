export interface User {
  username: string;
  role: 'admin' | 'user';
}

export interface Session {
  user: User;
  isLoggedIn: boolean;
  loginTime: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}