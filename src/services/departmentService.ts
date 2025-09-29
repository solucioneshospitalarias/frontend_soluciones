import { API_BASE_URL } from '../constants/api';

// ==================== INTERFACES ====================
export interface Department {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentPeriodStats {
  department_id: number;
  department_name: string;
  period_id: number;
  period_name: string;
  total_evaluations: number;
  completed_evaluations: number;
  pending_evaluations: number;
  overdue_evaluations: number;
  completion_rate: number;
  average_score: number;
  unique_employees: number;
  period_start_date: string;
  period_due_date: string;
  generated_at: string;
}

export interface DepartmentEvaluationDetail {
  id: number;
  employee_name: string;
  employee_role: string;
  evaluator_name: string;
  status: string;
  score: number;
  completed_at?: string;
  due_date: string;
  days_overdue?: number;
}

export interface DepartmentPeriodEvaluations {
  department_id: number;
  department_name: string;
  period_id: number;
  period_name: string;
  evaluations: DepartmentEvaluationDetail[];
  total_count: number;
  generated_at: string;
}

export interface DepartmentPerformance {
  id: number;
  name: string;
  promedio: number;
  completadas: number;
  pendientes: number;
  total: number;
  unique_employees: number;
}

// New interface for dashboard data
interface DashboardData {
  department_stats: DepartmentPeriodStats[];
}

// ==================== HELPER FUNCTIONS ====================
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
};

// ==================== API CALLS ====================

export const getDepartments = async (): Promise<Department[]> => {
  try {
    console.log('🔍 Fetching departments...');
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Department[]>(response);
    console.log('✅ Departments loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    throw error;
  }
};

export const getDepartmentPeriodStats = async (
  departmentId: number,
  periodId: number,
  departmentName: string
): Promise<DepartmentPeriodStats> => {
  try {
    console.log(`🔍 Fetching stats for department ${departmentId} (${departmentName}) in period ${periodId}...`);
    const response = await fetch(
      `${API_BASE_URL}/evaluations/dashboard?period_id=${periodId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    const dashboardData = await handleResponse<DashboardData>(response);
    console.log('✅ Dashboard for period loaded:', dashboardData);

    const deptStats = dashboardData.department_stats.find(
      (d: DepartmentPeriodStats) => d.department_name.toLowerCase() === departmentName.toLowerCase()
    );

    if (!deptStats) {
      console.log(`ℹ️ No stats found for department ${departmentId} (${departmentName}) in period ${periodId} - returning defaults`);
      return {
        department_id: departmentId,
        department_name: departmentName,
        period_id: periodId,
        period_name: 'Q3 2025',
        total_evaluations: 0,
        completed_evaluations: 0,
        pending_evaluations: 0,
        overdue_evaluations: 0,
        completion_rate: 0,
        average_score: 0,
        unique_employees: 0,
        period_start_date: '2025-07-01T00:00:00Z',
        period_due_date: '2025-10-15T23:59:59Z',
        generated_at: new Date().toISOString(),
      };
    }

    const calculatedCompletionRate = deptStats.total_evaluations > 0
      ? (deptStats.completed_evaluations / deptStats.total_evaluations) * 100
      : 0;

    return {
      department_id: departmentId,
      department_name: deptStats.department_name,
      period_id: periodId,
      period_name: deptStats.period_name || 'Q3 2025',
      total_evaluations: deptStats.total_evaluations,
      completed_evaluations: deptStats.completed_evaluations,
      pending_evaluations: deptStats.pending_evaluations || (deptStats.total_evaluations - deptStats.completed_evaluations),
      overdue_evaluations: deptStats.overdue_evaluations || 0,
      completion_rate: calculatedCompletionRate,
      average_score: deptStats.average_score,
      unique_employees: deptStats.unique_employees || deptStats.total_evaluations,
      period_start_date: deptStats.period_start_date || '2025-07-01T00:00:00Z',
      period_due_date: deptStats.period_due_date || '2025-10-15T23:59:59Z',
      generated_at: deptStats.generated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error fetching department stats:', error);
    throw error;
  }
};

export const getDepartmentPeriodEvaluations = async (
  departmentId: number,
  periodId: number
): Promise<DepartmentPeriodEvaluations> => {
  try {
    console.log(`🔍 Fetching evaluations for department ${departmentId} in period ${periodId}...`);
    const response = await fetch(
      `${API_BASE_URL}/evaluations/departments/${departmentId}/periods/${periodId}/evaluations`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    const data = await handleResponse<DepartmentPeriodEvaluations>(response);
    console.log('✅ Department evaluations loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching department evaluations:', error);
    throw error;
  }
};

export const exportDepartmentEvaluations = async (
  departmentId: number,
  periodId?: number,
  includeIndividualSheets: boolean = true
): Promise<Blob> => {
  try {
    console.log(`📥 Exporting department ${departmentId} evaluations...`);

    let url = `${API_BASE_URL}/export/department/${departmentId}/evaluations`;
    const params = new URLSearchParams();

    if (periodId) {
      params.append('period_id', periodId.toString());
    }
    params.append('include_individual_sheets', includeIndividualSheets.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      console.error('Export request failed:', response.status, response.statusText);
      throw new Error(`Export failed with status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log('✅ Export successful');
    return blob;
  } catch (error) {
    console.error('❌ Error exporting department evaluations:', error);
    throw error;
  }
};

export const downloadDepartmentReport = async (
  departmentId: number,
  departmentName: string,
  periodId?: number,
  periodName?: string
): Promise<void> => {
  try {
    const blob = await exportDepartmentEvaluations(departmentId, periodId);

    const date = new Date().toISOString().split('T')[0];
    const periodSuffix = periodName ? `_${periodName.replace(/\s+/g, '_')}` : '';
    const fileName = `reporte_${departmentName.replace(/\s+/g, '_')}${periodSuffix}_${date}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(`✅ Downloaded: ${fileName}`);
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};

export const calculateDepartmentPerformance = async (
  periodId?: number
): Promise<DepartmentPerformance[]> => {
  try {
    let url = `${API_BASE_URL}/evaluations/dashboard`;
    if (periodId) {
      url += `?period_id=${periodId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const rawData = await response.json();
    console.log('Raw dashboard response:', rawData);

    const dashboardData: DashboardData = rawData.data || rawData;
    console.log('Dashboard data extracted:', dashboardData);
    console.log('department_stats field:', dashboardData.department_stats);

    if (!dashboardData || !dashboardData.department_stats || dashboardData.department_stats.length === 0) {
      console.log('No department data available in dashboard');
      return [];
    }

    const performance: DepartmentPerformance[] = dashboardData.department_stats.map((dept: DepartmentPeriodStats) => ({
      id: dept.department_id || 0,
      name: dept.department_name,
      promedio: dept.average_score || 0,
      completadas: dept.completed_evaluations || 0,
      pendientes: (dept.total_evaluations || 0) - (dept.completed_evaluations || 0),
      total: dept.total_evaluations || 0,
      unique_employees: dept.unique_employees || 0,
    }));

    console.log('Calculated performance:', performance);
    return performance;
  } catch (error) {
    console.error('Error calculating department performance:', error);
    return [];
  }
};

export default {
  getDepartments,
  getDepartmentPeriodStats,
  getDepartmentPeriodEvaluations,
  exportDepartmentEvaluations,
  downloadDepartmentReport,
  calculateDepartmentPerformance,
};