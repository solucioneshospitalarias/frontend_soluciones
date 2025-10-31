import React, { useState } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/authContext';

interface TopContentProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const TopContent: React.FC<TopContentProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div
      className={`fixed top-0 h-16 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm px-4 md:px-8 z-40 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'left-[var(--sidebar-width)] w-[calc(100%-var(--sidebar-width))]' : 'left-0 w-full'}
      `}
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      <div className={`relative flex items-center gap-2 transition-opacity duration-300 ${isSidebarOpen ? 'max-[800px]:opacity-0 max-[800px]:pointer-events-none' : ''}`}>
        <span className="font-semibold text-gray-800">{user?.first_name || 'Usuario'}</span>
        <button
          onClick={() => setShowLogout(!showLogout)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-gray-700" />
        </button>

        {showLogout && (
          <div className="absolute right-0 top-10 bg-white border border-gray-200 shadow-lg rounded-lg py-2 w-40 animate-fadeIn">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopContent;
