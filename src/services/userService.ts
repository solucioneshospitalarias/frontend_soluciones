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
  position?: { name: string };
  position_name?: string;
  department?: { name: string };
  department_name?: string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
};

const transformUserResponse = (userResponse: RawUserResponse): User => {
  console.log('🔄 Transforming user response:', userResponse);
  
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
    position: userResponse.position?.name || userResponse.position_name || '',
    department: userResponse.department?.name || userResponse.department_name || '',
    hire_date: userResponse.hire_date || '',
    created_at: userResponse.created_at || '',
    updated_at: userResponse.updated_at || '',
  };
};

export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('📡 Fetching users from:', `${API_BASE_URL}/users`);
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Raw API response:', data);
    
    const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);
    console.log('👥 Users array:', usersArray);
    
    const transformedUsers = usersArray.map((user: RawUserResponse) => transformUserResponse(user));
    console.log('✅ Transformed users:', transformedUsers);
    
    return transformedUsers;
  } catch (error: unknown) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    console.log('📡 Fetching user by ID:', id);
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: RawUserResponse = await response.json();
    console.log('📦 Raw user response:', data);
    
    const transformedUser = transformUserResponse(data);
    console.log('✅ Transformed user:', transformedUser);
    
    return transformedUser;
  } catch (error: unknown) {
    console.error('❌ Error fetching user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData: UserCreateDTO): Promise<User> => {
  try {
    console.log('🚀 Creating user with data:', userData);
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: RawUserResponse = await response.json();
    console.log('✅ User created:', data);
    
    return transformUserResponse(data);
  } catch (error: unknown) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: UserUpdateDTO): Promise<User> => {
  try {
    console.log('🔄 Updating user:', id, userData);
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: RawUserResponse = await response.json();
    console.log('✅ User updated:', data);
    
    return transformUserResponse(data);
  } catch (error: unknown) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    console.log('🗑️ Attempting to delete user:', id);
    
    const disableResponse = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: false }),
    });

    if (disableResponse.ok) {
      console.log('✅ Usuario desactivado exitosamente');
      return;
    }

    const deleteResponse = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    console.log('📊 Delete response status:', deleteResponse.status);

    if (!deleteResponse.ok) {
      if (deleteResponse.status === 404) {
        throw new Error('La función de eliminar usuarios no está disponible. El usuario ha sido desactivado en su lugar.');
      }
      const errorText = await deleteResponse.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${deleteResponse.status}: ${errorText}`);
    }

    console.log('✅ Usuario eliminado exitosamente');
  } catch (error: unknown) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
};