import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  // estado inicial: abierta solo si la pantalla es mayor a 800px
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);

  // 🚚 log inicial
  console.log(
    '🚚 [INIT] ancho de pantalla:',
    window.innerWidth,
    '| Sidebar abierta:',
    window.innerWidth > 800
  );

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 800;
      console.log(
        '🚚 [RESIZE] ancho:',
        window.innerWidth,
        '| isMobile:',
        isMobile,
        '| se debe abrir?:',
        !isMobile
      );
      setIsSidebarOpen(!isMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="relative flex">
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={handleToggle}
        onOpenChangePassword={() => {}}
      />

      <main
        className={`transition-all duration-300 p-6 w-full ${
          window.innerWidth > 800 && isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="text-gray-500 text-sm mb-2 select-none">
          Estado Sidebar: {isSidebarOpen ? 'ABIERTO' : 'CERRADO'} | Ancho: {window.innerWidth}px
        </div>

        {children}
      </main>
    </div>
  );
};

export default MainLayout;
