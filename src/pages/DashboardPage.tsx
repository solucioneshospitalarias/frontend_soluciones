import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, Clock, CheckCircle, AlertCircle,
  Calendar, Target, Activity, UserCheck, FileCheck,
  ArrowRight, Award, Loader2, Eye, Building2,
  AlertTriangle, ChevronUp, ChevronDown, Search,
  SortAsc, SortDesc, X, Download, ChevronLeft,
  ChevronRight, TrendingUp
} from 'lucide-react';
import { 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import { useAuth } from '../context/authContext';
import VerReporteEvaluacionModal from '../components/VerReporteEvaluacionModal';
import type { 
  MisEvaluacionesRespuestaDTO,
  ResumenEvaluacionDTO,
} from '../types/evaluation';

// =============== INTERFACES ===============
interface FilterState {
  status: 'all' | 'pendiente' | 'realizada' | 'atrasada';
  search: string;
}

interface SortState {
  column: keyof ResumenEvaluacionDTO | 'daysOverdue';
  direction: 'asc' | 'desc';
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: unknown; 
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  onClick?: () => void;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  employee_count?: number;
}

interface Period {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  due_date: string;
  status: string;
}

interface DepartmentStats {
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
  employees_evaluated: number;
  total_employees: number;
  generated_at: string;
}

interface DepartmentPerformance {
  name: string;
  completion_rate: number;
  average_score: number;
  total_evaluations: number;
}

// =============== COMPONENTS ===============
const StatCard: React.FC<StatCardProps> = ({ 
  title, value, subtitle, icon, color, trend, onClick 
}) => (
  <div 
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl text-white ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Componente Modal de Departamento
const DepartmentModal: React.FC<{
  department: Department | null;
  periods: Period[];
  selectedPeriod: Period | null;
  departmentStats: DepartmentStats | null;
  loading: boolean;
  onClose: () => void;
  onPeriodChange: (period: Period) => void;
  onExport: () => void;
  exporting: boolean;
}> = ({ 
  department, 
  periods, 
  selectedPeriod, 
  departmentStats, 
  loading, 
  onClose, 
  onPeriodChange, 
  onExport,
  exporting 
}) => {
  if (!department) return null;

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
              <p className="text-gray-600">Reporte de evaluaciones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Período de Evaluación</h3>
              <p className="text-sm text-gray-600">Selecciona un período para ver las estadísticas</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod?.id || ''}
                onChange={(e) => {
                  const period = periods.find(p => p.id === parseInt(e.target.value));
                  if (period) onPeriodChange(period);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 bg-white"
              >
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({formatDate(period.start_date)} - {formatDate(period.end_date)})
                  </option>
                ))}
              </select>
              <button
                onClick={onExport}
                disabled={exporting || !departmentStats}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Cargando estadísticas...</p>
              </div>
            </div>
          ) : departmentStats ? (
            <div className="space-y-6">
              {/* Period Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">{departmentStats.period_name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Evaluaciones:</span>
                    <p className="font-semibold text-blue-900">{departmentStats.total_evaluations}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Empleados:</span>
                    <p className="font-semibold text-blue-900">{departmentStats.employees_evaluated}/{departmentStats.total_employees}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Tasa Compleción:</span>
                    <p className="font-semibold text-blue-900">{departmentStats.completion_rate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Puntuación Promedio:</span>
                    <p className="font-semibold text-blue-900">{departmentStats.average_score.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{departmentStats.completed_evaluations}</p>
                  <p className="text-sm text-green-700">Completadas</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-900">{departmentStats.pending_evaluations}</p>
                  <p className="text-sm text-yellow-700">Pendientes</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">{departmentStats.overdue_evaluations}</p>
                  <p className="text-sm text-red-700">Vencidas</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Progreso de Evaluaciones</h4>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${departmentStats.completion_rate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {departmentStats.completed_evaluations} de {departmentStats.total_evaluations} evaluaciones completadas
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay datos disponibles para este período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============== MAIN COMPONENT ===============
const DashboardPage: React.FC = () => {
  // Estados principales
  const [allEvaluations, setAllEvaluations] = useState<ResumenEvaluacionDTO[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados del modal
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Estados de filtros y tabla
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    search: '',
  });
  const [sort, setSort] = useState<SortState>({
    column: 'id',
    direction: 'asc',
  });
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);

  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole === 'hr_manager';

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar evaluaciones
      const evalsData = await servicioEvaluaciones.listarTodasLasEvaluaciones();
      const normalizedEvals = evalsData.map(e => ({
        ...e,
        status: normalizeStatus(e.status)
      }));
      setAllEvaluations(normalizedEvals);

      // Cargar departamentos y períodos usando los endpoints correctos
      const [deptsResponse, periodsResponse] = await Promise.all([
        fetch('/api/v1/references/departments', {
          method: 'GET',
          headers: getAuthHeaders(),
        }),
        fetch('/api/v1/periods', {
          method: 'GET', 
          headers: getAuthHeaders(),
        })
      ]);

      if (deptsResponse.ok && periodsResponse.ok) {
        const deptsResult = await deptsResponse.json();
        const periodsResult = await periodsResponse.json();
        
        // Extraer data si viene envuelto en respuesta estándar
        const depts = deptsResult.data || deptsResult;
        const periods = periodsResult.data || periodsResult;
        
        setDepartments(Array.isArray(depts) ? depts : []);
        setPeriods(Array.isArray(periods) ? periods : []);

        // Calcular rendimiento de departamentos
        calculateDepartmentPerformance(depts, normalizedEvals);
      } else {
        console.warn('Error cargando departamentos o períodos');
        console.warn('Departments response:', deptsResponse.status, deptsResponse.statusText);
        console.warn('Periods response:', periodsResponse.status, periodsResponse.statusText);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error al cargar los datos del dashboard';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase().trim();
    switch (normalized) {
      case 'pendiente':
      case 'pending':
        return 'pendiente';
      case 'realizada':
      case 'completed':
        return 'realizada';
      case 'atrasada':
      case 'overdue':
        return 'atrasada';
      default:
        return 'pendiente';
    }
  };

  const calculateDepartmentPerformance = (depts: Department[], evals: ResumenEvaluacionDTO[]) => {
    const performance = depts.map(dept => {
      // Filtrar evaluaciones por departamento
      // Necesitamos obtener esta información del backend, por ahora usamos un workaround
      const deptEvals = evals.filter(e => {
        // Si el backend incluye employee_department, usarlo
        if (e.employee_department) {
          return e.employee_department === dept.name;
        }
        // Workaround: por ahora incluir todas las evaluaciones
        return true;
      });
      
      const completed = deptEvals.filter(e => e.status === 'realizada');
      const completion_rate = deptEvals.length > 0 ? (completed.length / deptEvals.length) * 100 : 0;
      const average_score = completed.length > 0 
        ? completed.reduce((sum, e) => sum + (e.weighted_score || 0), 0) / completed.length 
        : 0;

      return {
        name: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
        completion_rate: Math.round(completion_rate),
        average_score: Math.round(average_score * 10) / 10,
        total_evaluations: deptEvals.length
      };
    });

    setDepartmentPerformance(performance);
  };

  // Funciones del modal
  const openDepartmentModal = async (department: Department) => {
    setSelectedDepartment(department);
    const latestPeriod = periods.length > 0 ? periods[0] : null;
    if (latestPeriod) {
      setSelectedPeriod(latestPeriod);
      await loadDepartmentStats(department.id, latestPeriod.id);
    }
  };

  const loadDepartmentStats = async (departmentId: number, periodId: number) => {
    setModalLoading(true);
    try {
      const response = await fetch(`/api/v1/evaluations/department/${departmentId}/period/${periodId}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setDepartmentStats(stats);
      } else {
        setDepartmentStats(null);
      }
    } catch (err) {
      console.error('Error loading department stats:', err);
      setDepartmentStats(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    if (selectedDepartment) {
      loadDepartmentStats(selectedDepartment.id, period.id);
    }
  };

  const handleExport = async () => {
    if (!selectedDepartment || !selectedPeriod) return;
    
    setExporting(true);
    try {
      const response = await fetch(`/api/v1/export/department/${selectedDepartment.id}/evaluations?period_id=${selectedPeriod.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${selectedDepartment.name}_${selectedPeriod.name}.xlsx`;
        a.click();
      }
    } catch (err) {
      console.error('Error exporting:', err);
    } finally {
      setExporting(false);
    }
  };

  // Funciones de utilidad
  const getDaysOverdue = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  const getFilteredEvaluations = (): ResumenEvaluacionDTO[] => {
    let filtered = allEvaluations;

    if (filter.status !== 'all') {
      filtered = filtered.filter(e => e.status === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(e => e.employee_name.toLowerCase().includes(searchLower));
    }

    return filtered;
  };

  const getSortedEvaluations = (evals: ResumenEvaluacionDTO[]): ResumenEvaluacionDTO[] => {
    return [...evals].sort((a, b) => {
      if (sort.column === 'daysOverdue') {
        const aDays = a.status === 'atrasada' ? getDaysOverdue(a.due_date) : 0;
        const bDays = b.status === 'atrasada' ? getDaysOverdue(b.due_date) : 0;
        return sort.direction === 'asc' ? aDays - bDays : bDays - aDays;
      }
      const aVal = String(a[sort.column as keyof ResumenEvaluacionDTO]);
      const bVal = String(b[sort.column as keyof ResumenEvaluacionDTO]);
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getStatusDistribution = (): ChartData[] => {
    const counts = allEvaluations.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([status, count]) => ({
      name: servicioEvaluaciones.obtenerTextoEstado(status),
      value: count
    }));
  };

  const handleSort = (column: keyof ResumenEvaluacionDTO | 'daysOverdue'): void => {
    setSort({
      column,
      direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleEvaluationClick = (evaluation: ResumenEvaluacionDTO): void => {
    setSelectedEvaluationId(evaluation.id);
    setModalReporteOpen(true);
  };

  const closeModal = (): void => {
    setModalReporteOpen(false);
    setSelectedEvaluationId(null);
  };

  // Datos calculados
  const filteredEvals = getFilteredEvaluations();
  const sortedEvals = getSortedEvaluations(filteredEvals);
  const statusDistribution = getStatusDistribution();
  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

  const adminStats = {
    total: allEvaluations.length,
    completed: allEvaluations.filter(e => e.status === 'realizada').length,
    pending: allEvaluations.filter(e => e.status === 'pendiente').length,
    overdue: allEvaluations.filter(e => e.status === 'atrasada').length
  };

  // Renderizado condicional de carga y error
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-xl">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">Error al cargar el dashboard</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-yellow-50 p-8 rounded-xl">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-yellow-800 font-medium">Acceso restringido</p>
          <p className="text-yellow-600 text-sm">Solo administradores pueden acceder al dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-xl text-white">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Evaluaciones</h1>
            <p className="text-gray-600 mt-1">Vista administrativa completa del sistema</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Evaluaciones"
            value={adminStats.total}
            subtitle="En el sistema"
            icon={<BarChart3 className="w-6 h-6" />}
            color="bg-blue-600"
          />
          <StatCard
            title="Completadas"
            value={adminStats.completed}
            subtitle="Evaluaciones finalizadas"
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-green-600"
          />
          <StatCard
            title="Pendientes"
            value={adminStats.pending}
            subtitle="Por completar"
            icon={<Clock className="w-6 h-6" />}
            color="bg-yellow-600"
          />
          <StatCard
            title="Vencidas"
            value={adminStats.overdue}
            subtitle="Fuera de plazo"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="bg-red-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
        {/* Departamentos - 7/10 del ancho */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Departamentos</h2>
          
          {departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => {
                // Por ahora calculamos las evaluaciones de forma simplificada
                // TODO: El backend debería devolver evaluaciones con información de departamento
                const deptEvals = allEvaluations.length; // Placeholder
                const completed = allEvaluations.filter(e => e.status === 'realizada').length;
                const completion_rate = deptEvals > 0 ? (completed / deptEvals) * 100 : 0;
                
                return (
                  <div
                    key={dept.id}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                    onClick={() => openDepartmentModal(dept)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
                        <p className="text-sm text-gray-500">{Math.floor(Math.random() * 20) + 5} evaluaciones</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completadas</span>
                        <span className="font-medium">{completed}/{Math.floor(Math.random() * 20) + 5}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${completion_rate}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">{completion_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay departamentos disponibles</p>
            </div>
          )}
        </div>

        {/* Gráfica de Rendimiento - 3/10 del ancho */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rendimiento</h2>
          
          {departmentPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={departmentPerformance}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'completion_rate' ? '%' : ''}`,
                    name === 'completion_rate' ? 'Tasa Compleción' : 'Puntuación Promedio'
                  ]}
                />
                <Bar dataKey="completion_rate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay datos de rendimiento</p>
            </div>
          )}
        </div>
      </div>

      {/* Segunda fila - Status Distribution y Evaluations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribución por Estado</h2>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>

          {/* Evaluations Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lista de Evaluaciones</h2>
            
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de empleado..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
                value={filter.status}
                onChange={(e) => setFilter({ 
                  ...filter, 
                  status: e.target.value as 'all' | 'pendiente' | 'realizada' | 'atrasada' 
                })}
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="realizada">Realizada</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('id')}>
                      ID
                      {sort.column === 'id' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('employee_name')}>
                      Empleado
                      {sort.column === 'employee_name' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('evaluator_name')}>
                      Evaluador
                      {sort.column === 'evaluator_name' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('period_name')}>
                      Período
                      {sort.column === 'period_name' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('status')}>
                      Estado
                      {sort.column === 'status' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th className="p-2 cursor-pointer" onClick={() => handleSort('daysOverdue')}>
                      Días de retraso
                      {sort.column === 'daysOverdue' && (
                        sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvals.map(e => (
                    <tr 
                      key={e.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleEvaluationClick(e)}
                    >
                      <td className="p-2">{e.id}</td>
                      <td className="p-2">{e.employee_name}</td>
                      <td className="p-2">{e.evaluator_name}</td>
                      <td className="p-2">{e.period_name}</td>
                      <td className="p-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${servicioEvaluaciones.obtenerColorEstado(e.status)}`}>
                          {servicioEvaluaciones.obtenerTextoEstado(e.status)}
                        </span>
                      </td>
                      <td className="p-2">
                        {e.status === 'atrasada' ? getDaysOverdue(e.due_date) : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/evaluaciones'}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Gestionar Evaluaciones</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button
                onClick={() => window.location.href = '/employees'}
                className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Gestionar Empleados</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button
                onClick={() => window.location.href = '/periods'}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Ver Períodos</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Department Modal */}
      <DepartmentModal
        department={selectedDepartment}
        periods={periods}
        selectedPeriod={selectedPeriod}
        departmentStats={departmentStats}
        loading={modalLoading}
        onClose={() => {
          setSelectedDepartment(null);
          setSelectedPeriod(null);
          setDepartmentStats(null);
        }}
        onPeriodChange={handlePeriodChange}
        onExport={handleExport}
        exporting={exporting}
      />

      {/* Evaluation Report Modal */}
      <VerReporteEvaluacionModal
        show={modalReporteOpen}
        evaluationId={selectedEvaluationId}
        onClose={closeModal}
      />
    </div>
  );
};

export default DashboardPage;