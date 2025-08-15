export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  document: string;
  is_active: boolean;
  role_id: number;
  position_id: number;
  hire_date: string;
  role?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
    department: string;
  };
}

export interface LoginError {
  message: string;
  type: 'error' | 'warning';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
