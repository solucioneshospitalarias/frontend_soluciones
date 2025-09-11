// src/utils/permissions.ts
export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  EVALUATOR: 'evaluator',
  EMPLOYEE: 'employee',
};

export const hasPermission = (userRole: string, requiredRole: string | string[]) => {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole.toLowerCase());
  }
  return userRole.toLowerCase() === requiredRole.toLowerCase();
};

export const canAccessAdminDashboard = (userRole: string) =>
  hasPermission(userRole, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const canAccessEvaluatorView = (userRole: string) =>
  hasPermission(userRole, [ROLES.EVALUATOR, ROLES.ADMIN, ROLES.HR_MANAGER]);

export const canAccessEmployeeView = (userRole: string) =>
  hasPermission(userRole, [ROLES.EMPLOYEE, ROLES.EVALUATOR, ROLES.ADMIN, ROLES.HR_MANAGER]);

export const canManageEmployees = (userRole: string) =>
  hasPermission(userRole, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const canManageEvaluations = (userRole: string) =>
  hasPermission(userRole, [ROLES.ADMIN, ROLES.HR_MANAGER]);