export interface User {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  document: string;
  is_active: boolean;
  role_id: number;
  position_id: number;
  department_id: number;
  role_name?: string;
  position?: string;
  department?: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateDTO {
  first_name: string;
  last_name: string;
  email: string;
  document: string;
  password: string;
  role_id: number;
  position_id: number;
  department_id: number;
  hire_date: string;
}

export interface UserUpdateDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  document?: string;
  is_active?: boolean;
  role_id?: number;
  position_id?: number;
  department_id?: number;
  hire_date?: string;
}

export interface UserResponse {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  document: string;
  is_active: boolean;
  role_id: number;
  position_id: number;
  department_id: number;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  position?: {
    id: number;
    name: string;
    description?: string;
    department_id: number;
    department_name: string;
  };
  department?: {
    id: number;
    name: string;
    description?: string;
  };
  hire_date: string;
  created_at: string;
  updated_at: string;
}