import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Activity,
  Target,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import {
  canManageEmployees,
  canManageEvaluations,
  canAccessDashboard,
  canAccessMyEvaluations,
} from '../utils/permissions';
import soluciones from '../assets/soluciones-ico.png';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  onOpenChangePassword: () => void; // ← Nueva prop para abrir modal
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role?.name?.toLowerCase() || '';

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = () => userRole === 'admin';

  // ✅ ORDEN MEJORADO: Dashboard > Evaluaciones > Empleados > Mis Evaluaciones
  const menuItems = [
    ...(canAccessDashboard(userRole)
      ? [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' }]
      : []),
    
    ...(canManageEvaluations(userRole)
      ? [{ id: 'evaluaciones', label: 'Sistema de Evaluaciones', icon: Activity, path: '/evaluaciones' }]
      : []),
    
    ...(canManageEmployees(userRole)
      ? [{ id: 'employees', label: 'Gestión de Empleados', icon: Users, path: '/employees' }]
      : []),
    
    ...(isAdmin()
      ? [{ id: 'org-config', label: 'Configuración Organizacional', icon: Settings, path: '/organizational-config' }]
      : []),
    
    ...(canAccessMyEvaluations(userRole)
      ? [{ id: 'my-evaluations', label: 'Mis Evaluaciones', icon: Target, path: '/mis-evaluaciones' }]
      : []),
  ];

  const getRoleName = () => {
    return user?.role?.name ? user.role.name.toUpperCase() : 'ROL';
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    onOpenChangePassword();
  };

  return (
    <>
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-6 h-6 text-[#56B167]" />
      </button>

      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#56B167] flex flex-col justify-between shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={soluciones} alt="Logo Soluciones" className="w-16 h-16 object-contain" />
          </div>

          {/* Menú de Usuario con Dropdown */}
          <div ref={menuRef} className="relative mb-6">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-[#56B167]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.first_name || 'Usuario'}
                  </p>
                  <p className="text-white/70 text-xs">{getRoleName()}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/70 transition-transform flex-shrink-0 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Cambiar contraseña</span>
                </button>
              </div>
            )}
          </div>

          {/* Navegación Principal */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#56B167] font-medium shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botón de Cerrar Sesión */}
        <div className="p-4">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center justify-center w-full bg-white text-[#56B167] py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;