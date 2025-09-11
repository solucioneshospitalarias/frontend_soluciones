import React from 'react';
import { BarChart3, Users, Calendar, Target, FileText, LogOut, Menu, Activity, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { canManageEmployees, canManageEvaluations, canAccessEvaluatorView } from '../utils/permissions';
import soluciones from '../assets/soluciones-ico.png';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role?.name?.toLowerCase() || '';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    ...(canManageEmployees(userRole)
      ? [{ id: 'employees', label: 'Gestión de empleados', icon: Users, path: '/employees' }]
      : []),
    ...(canManageEvaluations(userRole)
      ? [
          { id: 'evaluaciones', label: 'Sistema de Evaluaciones', icon: Activity, path: '/evaluaciones' },
          { id: 'periods', label: 'Gestión de períodos', icon: Calendar, path: '/periods' },
        ]
      : []),
    ...(canAccessEvaluatorView(userRole)
      ? [{ id: 'my-evaluations', label: 'Mis Evaluaciones', icon: Target, path: '/my-evaluations' }]
      : []),
    { id: 'reports', label: 'Reportes y Análisis', icon: FileText, path: '/reports' },
  ];

  const getRoleName = () => {
    return user?.role?.name ? user.role.name.toUpperCase() : 'ROL';
  };

  return (
    <>
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-all duration-200"
      >
        <Menu className="w-6 h-6 text-[#56B167]" />
      </button>

      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#56B167] flex flex-col justify-between shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-center mb-6">
            <img src={soluciones} alt="Logo Soluciones" className="w-16 h-16 object-contain" />
          </div>

          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <User className="w-6 h-6 text-[#56B167]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm truncate">{user?.first_name || 'Usuario'}</p>
              <p className="text-gray-200 text-xs">{getRoleName()}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#56B167] font-semibold shadow-sm'
                      : 'text-white hover:bg-[#479254]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-2 ${isActive ? 'text-[#56B167]' : 'text-white'}`}
                  />
                  <span className="text-sm">{item.label}</span>
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
            }}
            className="flex items-center justify-center w-full bg-white text-[#56B167] py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
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