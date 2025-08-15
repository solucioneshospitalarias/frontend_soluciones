import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import type { LoginError } from '../../types/auth';
import logo from '../../assets/soluciones-logo.png';
import handshake from '../../assets/login-image.jpg';

// Tipos para el componente
interface LoginFormData {
  email: string; // Changed from username to email
  password: string;
}

const LoginPage: React.FC = () => {
  // Estados del formulario
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<LoginError | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();


  // Función para manejar cambios en los inputs
  const handleInputChange = (field: keyof LoginFormData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));
      // Limpiar error cuando el usuario empiece a escribir
      if (error) setError(null);
    };

  // Función para obtener mensaje de error basado en la respuesta
  const getErrorMessage = (error: any): LoginError => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      return {
        message: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        type: 'error',
      };
    }
    if (error.response?.status >= 500) {
      return {
        message: 'Servicio temporalmente no disponible. Intenta más tarde.',
        type: 'warning',
      };
    }
    return {
      message: 'Error al iniciar sesión. Verifica tus credenciales.',
      type: 'error',
    };
  };

  // Validación simple del formulario
  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError({
        message: 'El correo electrónico es requerido.',
        type: 'warning',
      });
      return false;
    }
    if (!formData.password.trim()) {
      setError({
        message: 'La contraseña es requerida.',
        type: 'warning',
      });
      return false;
    }
    return true;
  };

  // Manejo del submit del formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
  await login(formData.email, formData.password);
  navigate('/dashboard'); // ✅ redirige al dashboard
} catch (err) {
  console.error('Login error:', err);
  setError(getErrorMessage(err));
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full">
        <div className="flex">
          {/* Sección del Formulario */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src={logo} 
                  alt="Logo Soluciones SAS" 
                  className="h-16 object-contain"
                />
              </div>

              {/* Encabezado */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#56B167] mb-2">
                  Bienvenido
                </h1>
                <p className="text-gray-600">
                  Inicia sesión para acceder a tu panel de control
                </p>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className={`flex items-center gap-3 p-4 mb-6 rounded-lg text-sm ${
                  error.type === 'error' 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Campo Email */}
                <div>
                  <label 
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email" // Changed to email type
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56B167] focus:border-transparent transition-all outline-none"
                      placeholder="Ingresa tu correo electrónico"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label 
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56B167] focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      disabled={loading}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botón de Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-[#56B167] to-[#479254] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#479254] hover:to-[#367244] focus:outline-none focus:ring-2 focus:ring-[#56B167] focus:ring-offset-2 transform transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
                    !loading ? 'hover:scale-105' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sección de Imagen - Solo en desktop */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <img
              src={handshake}
              alt="Imagen de bienvenida - Profesionales trabajando"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-[#56B167]/75 flex items-center justify-center p-8">
              <div className="text-center text-white max-w-md">
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                  Gestiona y evalúa el{' '}
                  <span className="text-yellow-300">
                    talento de tu equipo
                  </span>{' '}
                  de manera eficiente
                </h2>
                <p className="text-green-100 text-lg">
                  Herramientas modernas para el desarrollo profesional
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;