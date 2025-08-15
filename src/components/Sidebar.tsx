import React from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  Target,
  FileText,
  LogOut,
  Menu,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import soluciones from '../assets/soluciones-ico.png';
import admin from '../assets/admin.jpg';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'employees', label: 'Gestión de empleados', icon: Users, path: '/employees' },
    { id: 'periods', label: 'Gestión de períodos', icon: Calendar, path: '/periods' },
    { id: 'monitoring', label: 'Monitoreo de Evaluaciones', icon: Target, path: '/monitoring' },
    { id: 'reports', label: 'Reportes y Análisis', icon: FileText, path: '/reports' },
  ];

  const getRoleName = () => {
    return user?.role?.name ? user.role.name.toUpperCase() : 'ROL';
  };

  return (
    <>
      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-all"
      >
        <Menu className="w-6 h-6 text-[#56B167]" />
      </button>

      {isOpen && (
        <div className="fixed top-0 left-0 h-screen w-60 bg-[#56B167] flex flex-col justify-between rounded-br-3xl overflow-hidden shadow-lg flex-shrink-0 z-40">
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <img src={soluciones} alt="Logo Soluciones" className="w-16 h-16 object-contain" />
            </div>

            <div className="flex flex-col items-center mb-6">
              <img
                src={admin}
                alt="User"
                className="w-20 h-20 rounded-full object-cover border-4 border-white mb-2"
              />
              <p className="text-white font-semibold">{user?.first_name || 'Usuario'}</p>
              <p className="text-white text-sm">{getRoleName()}</p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center w-full px-4 py-3 rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-white text-[#56B167] font-semibold shadow'
                        : 'text-white hover:bg-[#479254]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-[#56B167]' : 'text-white'}`}
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
              className="flex items-center justify-center w-full bg-white text-[#56B167] py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
