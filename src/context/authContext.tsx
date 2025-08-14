import React, { createContext, useContext, useState, useEffect} from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  document: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role_id: number;
  position_id: number;
  role: {
    id: number;
    name: string;
  };
  position: {
    id: number;
    name: string;
    department: string;
  };
  hire_date: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally fetch user data using /api/v1/me endpoint
      axios
        .get('http://localhost:8080/api/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        email,
        password,
      });
      const { token, refresh_token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error; // Let the caller handle the error
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8080/api/v1/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};