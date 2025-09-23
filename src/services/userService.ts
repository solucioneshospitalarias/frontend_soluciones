import { API_BASE_URL } from '../constants/api';
import type { User, UserCreateDTO, UserUpdateDTO } from '../types/user';

interface RawUserResponse {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  document?: string;
  is_active?: boolean;
  role_id?: number;
  position_id?: number;
  department_id?: number;
  role?: { name: string };
  role_name?: string;
  position?: { name: string } | string;
  position_name?: string;
  department?: { name: string } | string;
  department_name?: string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
};

const transformUserResponse = (userResponse: RawUserResponse): User => {
  const position = typeof userResponse.position === 'string' 
    ? userResponse.position 
    : userResponse.position?.name || userResponse.position_name || '';

  const department = typeof userResponse.department === 'string' 
    ? userResponse.department 
    : userResponse.department?.name || userResponse.department_name || '';

  return {
    id: userResponse.id,
    name: userResponse.name || `${userResponse.first_name || ''} ${userResponse.last_name || ''}`.trim(),
    first_name: userResponse.first_name || '',
    last_name: userResponse.last_name || '',
    email: userResponse.email || '',
    document: userResponse.document || '',
    is_active: userResponse.is_active ?? true,
    role_id: userResponse.role_id || 0,
    position_id: userResponse.position_id || 0,
    department_id: userResponse.department_id || 0,
    role_name: userResponse.role?.name || userResponse.role_name || '',
    position: position,
    department: department,
    hire_date: userResponse.hire_date || '',
    created_at: userResponse.created_at || '',
    updated_at: userResponse.updated_at || '',
  };
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const apiResponse: APIResponse<RawUserResponse[]> = await response.json();
    const usersArray = apiResponse.data || [];
    
    return usersArray.map(user => transformUserResponse(user));
  } catch (error: unknown) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const apiResponse: APIResponse<RawUserResponse> = await response.json();
    return transformUserResponse(apiResponse.data);
  } catch (error: unknown) {
    console.error('❌ Error fetching user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData: UserCreateDTO): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const apiResponse: APIResponse<RawUserResponse> = await response.json();
    return transformUserResponse(apiResponse.data);
  } catch (error: unknown) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: UserUpdateDTO): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const apiResponse: APIResponse<RawUserResponse> = await response.json();
    return transformUserResponse(apiResponse.data);
  } catch (error: unknown) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    const disableResponse = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: false }),
    });

    if (disableResponse.ok) {
      return;
    }

    const deleteResponse = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!deleteResponse.ok) {
      if (deleteResponse.status === 404) {
        throw new Error('La función de eliminar usuarios no está disponible. El usuario ha sido desactivado en su lugar.');
      }
      const errorText = await deleteResponse.text();
      throw new Error(`HTTP ${deleteResponse.status}: ${errorText}`);
    }
  } catch (error: unknown) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
};