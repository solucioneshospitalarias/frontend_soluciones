import axios from 'axios';
import { API_CONFIG } from '../constants/api';
import type { LoginResponse } from '../types/auth';

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      email,
      password,
    });
    console.log('🔑 Login response:', response.data);
    console.log('👤 User ID from login:', response.data.data.user?.id);
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('👤 Current user:', response.data);
    console.log('👤 User ID from getMe:', response.data.data?.id);
    return response.data;
  },

  // ✅ NUEVO: Cambiar contraseña
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const response = await axios.put(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHANGE_PASSWORD}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Password changed successfully:', response.data);
    return response.data;
  },
};