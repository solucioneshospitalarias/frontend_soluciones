import { API_BASE_URL } from '../constants/api';

// Types para las estadísticas del dashboard
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalDepartments: number;
  totalPeriods: number;
  activePeriods: number;
  totalCriteria: number;
  totalTemplates: number;
  activeEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  averageProgress: number;
}

export interface RecentActivity {
  id: number;
  type: 'evaluation_created' | 'evaluation_completed' | 'employee_created' | 'template_created';
  title: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface EvaluationProgress {
  template_name: string;
  progress: number;
  total_evaluations: number;
  completed_evaluations: number;
  in_progress_evaluations: number;
}

export interface DepartmentStats {
  department_name: string;
  total_employees: number;
  active_employees: number;
  evaluations_completed: number;
  average_score: number;
}

// Helper function para headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ==================== DASHBOARD SERVICE ====================
export class DashboardService {
  // Obtener estadísticas generales del dashboard
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Si tienes un endpoint específico para stats del dashboard
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        return response.json();
      }

      // Si no tienes endpoint específico, construir stats desde múltiples endpoints
      const [users, periods, criteria, templates, evaluations] = await Promise.all([
        this.fetchUsers(),
        this.fetchPeriods(),
        this.fetchCriteria(),
        this.fetchTemplates(),
        this.fetchEvaluations()
      ]);

      return this.calculateStats(users, periods, criteria, templates, evaluations);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Retornar stats por defecto en caso de error
      return this.getDefaultStats();
    }
  }

  // Obtener actividad reciente
  static async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/activity`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        return response.json();
      }

      // Si no hay endpoint, retornar actividad simulada
      return this.getSimulatedActivity();
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return this.getSimulatedActivity();
    }
  }

  // Obtener progreso de evaluaciones
  static async getEvaluationProgress(): Promise<EvaluationProgress[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/evaluation-progress`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        return response.json();
      }

      // Simular datos si no hay endpoint
      return this.getSimulatedProgress();
    } catch (error) {
      console.error('Error fetching evaluation progress:', error);
      return this.getSimulatedProgress();
    }
  }

  // Obtener estadísticas por departamento
  static async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/departments`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        return response.json();
      }

      return this.getSimulatedDepartmentStats();
    } catch (error) {
      console.error('Error fetching department stats:', error);
      return this.getSimulatedDepartmentStats();
    }
  }

  // Métodos privados para obtener datos individuales
  private static async fetchUsers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  private static async fetchPeriods(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/periods`, {
        headers: getAuthHeaders()
      });
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  private static async fetchCriteria(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/criteria`, {
        headers: getAuthHeaders()
      });
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  private static async fetchTemplates(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        headers: getAuthHeaders()
      });
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  private static async fetchEvaluations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluations`, {
        headers: getAuthHeaders()
      });
      return response.ok ? response.json() : [];
    } catch {
      return [];
    }
  }

  // Calcular estadísticas desde datos individuales
  private static calculateStats(
    users: any[], 
    periods: any[], 
    criteria: any[], 
    templates: any[], 
    evaluations: any[]
  ): DashboardStats {
    const activeEmployees = users.filter(u => u.is_active).length;
    const inactiveEmployees = users.filter(u => !u.is_active).length;
    const activePeriods = periods.filter(p => p.status === 'active').length;
    const activeEvaluations = evaluations.filter(e => e.status === 'in_progress').length;
    const completedEvaluations = evaluations.filter(e => e.status === 'completed').length;
    const pendingEvaluations = evaluations.filter(e => e.status === 'pending').length;

    // Calcular progreso promedio
    const totalProgress = evaluations.reduce((sum, e) => sum + (e.progress || 0), 0);
    const averageProgress = evaluations.length > 0 ? Math.round(totalProgress / evaluations.length) : 0;

    // Obtener departamentos únicos
    const uniqueDepartments = new Set(users.map(u => u.department).filter(Boolean)).size;

    return {
      totalEmployees: users.length,
      activeEmployees,
      inactiveEmployees,
      totalDepartments: uniqueDepartments,
      totalPeriods: periods.length,
      activePeriods,
      totalCriteria: criteria.length,
      totalTemplates: templates.length,
      activeEvaluations,
      completedEvaluations,
      pendingEvaluations,
      averageProgress
    };
  }

  // Datos por defecto en caso de error
  private static getDefaultStats(): DashboardStats {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      totalDepartments: 0,
      totalPeriods: 0,
      activePeriods: 0,
      totalCriteria: 0,
      totalTemplates: 0,
      activeEvaluations: 0,
      completedEvaluations: 0,
      pendingEvaluations: 0,
      averageProgress: 0
    };
  }

  // Actividad simulada para demo
  private static getSimulatedActivity(): RecentActivity[] {
    return [
      {
        id: 1,
        type: 'evaluation_completed',
        title: 'Evaluación Completada',
        description: 'Juan Pérez completó la evaluación de Mensajeros',
        user: 'Juan Pérez',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
      },
      {
        id: 2,
        type: 'employee_created',
        title: 'Nuevo Empleado',
        description: 'Se registró a María García en el sistema',
        user: 'Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        id: 3,
        type: 'template_created',
        title: 'Nueva Plantilla',
        description: 'Se creó la plantilla "Evaluación Supervisores"',
        user: 'Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
      },
      {
        id: 4,
        type: 'evaluation_created',
        title: 'Evaluación Iniciada',
        description: 'Se inició evaluación para 8 empleados administrativos',
        user: 'Carlos López',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
      }
    ];
  }

  // Progreso simulado para demo
  private static getSimulatedProgress(): EvaluationProgress[] {
    return [
      {
        template_name: 'Mensajeros',
        progress: 75,
        total_evaluations: 12,
        completed_evaluations: 9,
        in_progress_evaluations: 3
      },
      {
        template_name: 'Supervisores',
        progress: 100,
        total_evaluations: 3,
        completed_evaluations: 3,
        in_progress_evaluations: 0
      },
      {
        template_name: 'Administrativos',
        progress: 25,
        total_evaluations: 8,
        completed_evaluations: 2,
        in_progress_evaluations: 6
      }
    ];
  }

  // Estadísticas de departamento simuladas
  private static getSimulatedDepartmentStats(): DepartmentStats[] {
    return [
      {
        department_name: 'Operaciones',
        total_employees: 15,
        active_employees: 14,
        evaluations_completed: 12,
        average_score: 85.5
      },
      {
        department_name: 'Administración',
        total_employees: 8,
        active_employees: 8,
        evaluations_completed: 6,
        average_score: 92.3
      },
      {
        department_name: 'Recursos Humanos',
        total_employees: 4,
        active_employees: 4,
        evaluations_completed: 4,
        average_score: 88.7
      }
    ];
  }
}

// Función de conveniencia para obtener estadísticas de evaluación
export const getEvaluationStats = () => DashboardService.getDashboardStats();

// Exportar todas las funciones principales
export const dashboardService = {
  getDashboardStats: DashboardService.getDashboardStats,
  getRecentActivity: DashboardService.getRecentActivity,
  getEvaluationProgress: DashboardService.getEvaluationProgress,
  getDepartmentStats: DashboardService.getDepartmentStats
};