// src/components/MainLayout.tsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-60' : 'ml-0'} p-6 w-full`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
