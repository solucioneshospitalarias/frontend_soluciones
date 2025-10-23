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
  onOpenChangePassword?: () => void; // ← opcional
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role?.name?.toLowerCase() || '';

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth <= 800) toggle(); // cerrar al navegar en móvil
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    if (onOpenChangePassword) onOpenChangePassword();
    if (window.innerWidth <= 800) toggle();
  };

  return (
    <>
      {/* Botón de toggle siempre visible */}
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition"
      >
        <Menu className="w-6 h-6 text-[#56B167]" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#56B167] flex flex-col justify-between shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-center mb-6">
            <img src={soluciones} alt="Logo" className="w-16 h-16 object-contain" />
          </div>

          <div ref={menuRef} className="relative mb-6">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-[#56B167]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-white font-medium text-sm truncate">{user?.first_name || 'Usuario'}</p>
                  <p className="text-white/70 text-xs">{user?.role?.name?.toUpperCase() || 'ROL'}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/70 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg py-1">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Cambiar contraseña</span>
                </button>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-[#56B167] font-medium shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm whitespace-nowrap truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              logout();
              navigate('/login');
              if (window.innerWidth <= 800) toggle();
            }}
            className="flex items-center justify-center w-full bg-white text-[#56B167] py-2.5 rounded-lg hover:bg-gray-50"
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
