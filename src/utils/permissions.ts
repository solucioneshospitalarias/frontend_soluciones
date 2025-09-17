export const canManageEmployees = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

export const canManageEvaluations = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

export const canAccessEvaluatorView = (role: string): boolean => {
  return ['supervisor', 'evaluator', 'employee'].includes(role);
};

// ✅ NUEVA FUNCIÓN: Determina quién puede acceder al dashboard
export const canAccessDashboard = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

// ✅ NUEVA FUNCIÓN: Determina quién puede acceder a reportes y análisis
export const canAccessReports = (role: string): boolean => {
  return ['admin', 'hr_manager'].includes(role);
};

// ✅ NUEVA FUNCIÓN: Obtiene la ruta por defecto según el rol
export const getDefaultRouteByRole = (role: string): string => {
  if (canAccessDashboard(role)) {
    return '/dashboard';
  } else if (canAccessEvaluatorView(role)) {
    return '/mis-evaluaciones';
  } else {
    // Fallback por seguridad
    return '/mis-evaluaciones';
  }
};