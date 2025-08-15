export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  position?: string;
  department?: string;
  document?: string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
  role?: Role; // ✅ Agregado
}


export interface UserCreateDTO {
  email: string;
  document: string;
  password: string;
  firstName: string;
  lastName: string;
  roleID: number;
  positionID: number;
  hireDate: string; // formato YYYY-MM-DD
}

export interface UserUpdateDTO {
  name?: string;
  email?: string;
  is_active?: boolean;
  document?: string;
  hire_date?: string;
  roleID?: number;
  positionID?: number;
  departmentID?: number;
}


