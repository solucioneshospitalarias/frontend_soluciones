import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    authService
      .getMe(token)
      .then((res) => {
        const userData = res.data || res; // Manejar ambas estructuras
        console.log('📡 /me response:', userData); // Debug log for user data
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token'); // Clear refresh_token on error
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    // ✅ CORRECCIÓN: extraer datos de la estructura del backend
    const { token, refresh_token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refresh_token); // Store refresh_token
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token'); // Clear refresh_token on logout
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};