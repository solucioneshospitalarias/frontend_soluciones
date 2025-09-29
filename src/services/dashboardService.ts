import { API_CONFIG } from '../constants/api';

// ==================== INTERFACES ESTRICTAS ====================

export interface HRDashboardDTO {
  total_evaluations: number;
  completed_evaluations: number;
  pending_evaluations: number;
  overdue_evaluations: number;
  completion_rate: number;
  department_stats: DepartmentStatsDTO[];
  by_period: PeriodStatsDTO[];
  top_performers: EmployeePerformanceDTO[];
  bottom_performers: EmployeePerformanceDTO[];
  overdue_evaluators: EvaluatorOverdueDTO[];
}


export interface DepartmentStatsDTO {
  department_id: number;
  department_name: string;
  total_evaluations: number;
  completed_evaluations: number;
  average_score: number;
  completion_rate: number;
  pending_evaluations: number;
  overdue_evaluations: number;
  unique_employees: number;
  period_name?: string;
}

export interface PeriodStatsDTO {
  period_name: string;
  total_evaluations: number;
  completed_evaluations: number;
  average_score: number;
  completion_rate: number;
}

export interface EmployeePerformanceDTO {
  employee_name: string;
  department: string;
  average_score: number;
  evaluations_count: number;
  last_evaluation: string;
}

export interface EvaluatorOverdueDTO {
  evaluator_name: string;
  department: string;
  overdue_count: number;
  oldest_overdue: string;
}

export interface MyEvaluationsResponseDTO {
  as_employee: {
    count: number;
    evaluations: EvaluationSummaryDTO[];
  };
  as_evaluator: {
    count: number;
    evaluations: EvaluationSummaryDTO[];
  };
  summary: {
    total_evaluations: number;
    pending_to_evaluate: number;
    completed_evaluating: number;
    my_evaluations_total: number;
  };
}

export interface EvaluationSummaryDTO {
  id: number;
  employee_name: string;
  evaluator_name: string;
  period_name: string;
  status: 'pendiente' | 'realizada' | 'atrasada';
  completed_at?: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  department?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  role?: {
    id: number;
    name: string;
  };
}

export interface Period {
  id: number;
  name: string;
  description: string;
  start_date: string;
  due_date: string;
  is_active: boolean;
}

export interface Criteria {
  id: number;
  name: string;
  description: string;
  category: string;
  weight: number;
  is_active: boolean;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  criteria_count?: number;
  total_weight?: number;
}

export interface Evaluation {
  id: number;
  employee_id: number;
  evaluator_id: number;
  period_id: number;
  template_id: number;
  status: 'pendiente' | 'realizada' | 'atrasada';
  is_completed: boolean;
  total_score?: number;
  weighted_score?: number;
  completed_at?: string;
}

// Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Error personalizado para manejar errores de API
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ==================== SERVICIO ====================

class DashboardServiceClass {
  private readonly baseUrl: string = API_CONFIG.BASE_URL;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new ApiError('No authentication token found', 401);
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const status = response.status;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use default error message
      }
      throw new ApiError(errorMessage, status);
    }

    const data = await response.json() as ApiResponse<T>;
    if (!data.success) {
      throw new ApiError(data.message, 400);
    }
    return data.data;
  }

  // ========== MÉTODOS PÚBLICOS ==========

  async getHRDashboard(): Promise<HRDashboardDTO> {
    const response = await fetch(`${this.baseUrl}/evaluations/dashboard`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<HRDashboardDTO>(response);
  }

  async getMyEvaluations(filters?: {
    period_id?: number;
    status?: 'pendiente' | 'realizada' | 'atrasada';
  }): Promise<MyEvaluationsResponseDTO> {
    const queryParams = new URLSearchParams();
    if (filters?.period_id) {
      queryParams.append('period_id', filters.period_id.toString());
    }
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}/me/evaluations?${queryParams}`
      : `${this.baseUrl}/me/evaluations`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<MyEvaluationsResponseDTO>(response);
  }

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User[]>(response);
  }

  async getPeriods(): Promise<Period[]> {
    const response = await fetch(`${this.baseUrl}/periods`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Period[]>(response);
  }

  async getCriteria(): Promise<Criteria[]> {
    const response = await fetch(`${this.baseUrl}/criteria`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Criteria[]>(response);
  }

  async getTemplates(): Promise<Template[]> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Template[]>(response);
  }

  async getEvaluations(): Promise<Evaluation[]> {
    const response = await fetch(`${this.baseUrl}/evaluations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Evaluation[]>(response);
  }

  async getGeneralStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    totalPeriods: number;
    activePeriods: number;
    totalCriteria: number;
    totalTemplates: number;
    totalEvaluations: number;
    completedEvaluations: number;
    pendingEvaluations: number;
    averageProgress: number;
  }> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdminOrHR = user?.role?.name === 'admin' || user?.role?.name === 'hr_manager';

      if (isAdminOrHR) {
        const hrDashboard = await this.getHRDashboard();
        const [users, criteria, templates] = await Promise.all([
          this.getUsers().catch(() => [] as User[]),
          this.getCriteria().catch(() => [] as Criteria[]),
          this.getTemplates().catch(() => [] as Template[]),
        ]);

        return {
          totalEmployees: users.length,
          activeEmployees: users.filter(u => u.is_active).length,
          totalDepartments: hrDashboard.department_stats.length, // Fixed: changed from by_department
          totalPeriods: hrDashboard.by_period.length,
          activePeriods: hrDashboard.by_period.filter(p => p.completion_rate > 0).length,
          totalCriteria: criteria.length,
          totalTemplates: templates.length,
          totalEvaluations: hrDashboard.total_evaluations,
          completedEvaluations: hrDashboard.completed_evaluations,
          pendingEvaluations: hrDashboard.pending_evaluations,
          averageProgress: hrDashboard.completion_rate, // Cambiado de completion_percentage a completion_rate
        };
      } else {
        const [users, periods, criteria, templates, evaluations] = await Promise.all([
          this.getUsers().catch(() => [] as User[]),
          this.getPeriods().catch(() => [] as Period[]),
          this.getCriteria().catch(() => [] as Criteria[]),
          this.getTemplates().catch(() => [] as Template[]),
          this.getEvaluations().catch(() => [] as Evaluation[]),
        ]);

        const activeEmployees = users.filter(u => u.is_active).length;
        const activePeriods = periods.filter(p => p.is_active).length;
        const completedEvaluations = evaluations.filter(e => e.is_completed).length;
        const pendingEvaluations = evaluations.filter(e => e.status === 'pendiente').length;
        const departments = new Set(users.map(u => u.department?.id).filter(id => id !== undefined));

        const averageProgress = evaluations.length > 0
          ? Math.round((completedEvaluations / evaluations.length) * 100)
          : 0;

        return {
          totalEmployees: users.length,
          activeEmployees,
          totalDepartments: departments.size,
          totalPeriods: periods.length,
          activePeriods,
          totalCriteria: criteria.length,
          totalTemplates: templates.length,
          totalEvaluations: evaluations.length,
          completedEvaluations,
          pendingEvaluations,
          averageProgress,
        };
      }
    } catch (error) {
      console.error('Error fetching general stats:', error);
      throw new ApiError('Failed to fetch general statistics', (error as ApiError).status || 500);
    }
  }
}

// Exportar instancia única del servicio
export const dashboardService = new DashboardServiceClass();