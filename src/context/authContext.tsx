// src/context/authContext.tsx
// ✅ ARREGLADO PARA REACT FAST REFRESH

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ COMPONENTE PRINCIPAL
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user'); // ✅ Verificar si hay usuario guardado
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    // ✅ Si hay usuario en localStorage, usarlo primero
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // ✅ Verificar el token con el servidor
    authService
      .getMe(token)
      .then((res) => {
        setUser(res);
        localStorage.setItem('user', JSON.stringify(res)); // ✅ Guardar usuario actualizado
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // ✅ Limpiar usuario también
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await authService.login(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user)); // ✅ Guardar usuario en localStorage
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // ✅ Limpiar usuario también
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