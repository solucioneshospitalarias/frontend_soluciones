import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GestionEmpleadosPage from './pages/GestionEmpleadosPage';
import GestionEvaluacionesPage from './pages/GestionEvaluacionesPage';
import EvaluacionesPage from './pages/EvaluacionesPage';
import Sidebar from './components/Sidebar';
import { canAccessDashboard, getDefaultRouteByRole } from './utils/permissions';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <p>Cargando...</p>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ✅ NUEVO: Componente que protege rutas administrativas
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  
  if (!canAccessDashboard(userRole)) {
    // Si no tiene permisos de admin, redirigir a su página por defecto
    const defaultRoute = getDefaultRouteByRole(userRole);
    return <Navigate to={defaultRoute} replace />;
  }
  
  return <>{children}</>;
};

// ✅ NUEVO: Componente de redirección inteligente
const SmartRedirect = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const defaultRoute = getDefaultRouteByRole(userRole);
  
  return <Navigate to={defaultRoute} replace />;
};

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

const AppContent: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* ✅ DASHBOARD - Solo para admin y hr_manager */}
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
      
      {/* ✅ GESTIÓN DE EMPLEADOS - Solo para admin y hr_manager */}
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
      
      {/* ✅ SISTEMA DE EVALUACIONES - Solo para admin y hr_manager */}
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
      
      {/* ✅ MIS EVALUACIONES - Para employee, evaluator, supervisor */}
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
      
      {/* ✅ REDIRECCIÓN INTELIGENTE - Basada en rol */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <SmartRedirect />
          </ProtectedRoute>
        } 
      />
      
      {/* ✅ TODAS LAS DEMÁS RUTAS - Redirección inteligente */}
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