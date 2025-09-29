export const canManageEmployees = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

export const canManageEvaluations = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

// ✅ TODOS los roles pueden acceder a "Mis Evaluaciones"
// Solo verán las evaluaciones donde son evaluadores o evaluados
export const canAccessMyEvaluations = (role: string): boolean => {
  return ['admin', 'hr_manager', 'supervisor', 'evaluator', 'employee'].includes(role);
};

export const canAccessDashboard = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

// ✅ Obtiene la ruta por defecto según el rol
export const getDefaultRouteByRole = (role: string): string => {
  if (canAccessDashboard(role)) {
    return '/dashboard';
  }
  // Todos los demás roles van a "Mis Evaluaciones"
  return '/mis-evaluaciones';
};