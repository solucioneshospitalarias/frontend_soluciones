import React from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import LoginPage from './pages/auth/LoginPage';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <p>Cargando...</p>;
  if (!isAuthenticated) return <LoginPage />;

  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
