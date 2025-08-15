import axios from 'axios';
import { API_CONFIG } from '../constants/api';
import type { LoginResponse } from '../types/auth';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      email,
      password,
    });
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
