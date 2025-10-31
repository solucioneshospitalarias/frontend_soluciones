import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestionEmpleadosPage from './pages/GestionEmpleadosPage';
import GestionEvaluacionesPage from './pages/GestionEvaluacionesPage';
import EvaluacionesPage from './pages/EvaluacionesPage';
import OrganizationalConfigPage from './pages/OrganizationalConfigPage';
import Sidebar from './components/Sidebar';
import ChangePasswordModal from './components/ChangePasswordModal';
import { canAccessDashboard, getDefaultRouteByRole } from './utils/permissions';
import TopContent from './components/TopContent';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <p>Cargando...</p>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';

  if (!canAccessDashboard(userRole)) {
    const defaultRoute = getDefaultRouteByRole(userRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';

  if (userRole !== 'admin') {
    const defaultRoute = getDefaultRouteByRole(userRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

const SmartRedirect = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const defaultRoute = getDefaultRouteByRole(userRole);

  return <Navigate to={defaultRoute} replace />;
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 800;
      setIsSidebarOpen(!isMobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <>
      <div className="relative flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          toggle={handleToggle}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
        />

        {/* Overlay para móviles */}
        {isSidebarOpen && window.innerWidth <= 800 && (
          <div
            onClick={handleToggle}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300"
          />
        )}

        {/* Contenedor principal con top bar */}
        <div
          className={`flex flex-col transition-all duration-300 ease-in-out w-full ${
            isSidebarOpen && window.innerWidth > 800 ? 'ml-[var(--sidebar-width)]' : 'ml-0'
          }`}
        >
          <TopContent
            toggleSidebar={handleToggle}
            isSidebarOpen={isSidebarOpen}
          />
          <main className="flex-1 p-6 mt-16">{children}</main>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

const AppContent: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <GestionEmpleadosPage />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluaciones"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MainLayout>
                <GestionEvaluacionesPage />
              </MainLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizational-config"
        element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <MainLayout>
                <OrganizationalConfigPage />
              </MainLayout>
            </AdminOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mis-evaluaciones"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EvaluacionesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SmartRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <SmartRedirect />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
