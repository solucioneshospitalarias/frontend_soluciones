import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, BarChart3, Clock, CheckCircle, AlertCircle,
  Calendar, Target, Activity, UserCheck, FileCheck,
  ArrowRight, Award, Loader2, RefreshCw, Eye,
  AlertTriangle, ChevronUp, ChevronDown, Search, Play,
  SortAsc, SortDesc, Download, Settings
} from 'lucide-react';
import { 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { evaluationService, ErrorEvaluacion } from '../services/evaluationService';
import { useAuth } from '../context/authContext';
import VerReporteEvaluacionModal from '../components/VerReporteEvaluacionModal';
import type {
  MisEvaluacionesRespuestaDTO,
  ResumenEvaluacionDTO,
  HRDashboardDTO,
  AverageByDepartmentResponseDTO,
  PendingByDepartmentResponseDTO,
  EmployeePerformanceResponseDTO,
  Period,
  Employee,
  Template,
  CreateEvaluationsFromTemplateDTO,
  CreateEvaluationsResponseDTO,
  EvaluationReportDTO
} from '../types/evaluation';

// Extend ResumenEvaluacionDTO to include missing fields
interface ExtendedResumenEvaluacionDTO extends ResumenEvaluacionDTO {
  evaluator_id: number;
  weighted_score: number;
}

// Interfaces
interface FilterState {
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
  search: string;
  evaluatorId?: number;
  periodId?: number;
}

interface SortState {
  column: keyof ExtendedResumenEvaluacionDTO | 'daysOverdue';
  direction: 'asc' | 'desc';
}

interface ChartData {
  name: string;
  value: number;
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

interface CreateEvaluationModalProps {
  show: boolean;
  onClose: () => void;
}

interface ExportConfigModalProps {
  show: boolean;
  onClose: () => void;
  onExport: (config: { includeOnlyCompleted: boolean; addPerformanceColors: boolean }) => void;
}

// Components
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

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({ show, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<CreateEvaluationsFromTemplateDTO>({
    template_id: 0,
    period_id: 0,
    evaluator_id: 0,
    employee_ids: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [temps, pers, emps] = await Promise.all([
            evaluationService.getTemplates(),
            evaluationService.getPeriods(),
            evaluationService.getEmployees(),
          ]);
          setTemplates(temps);
          setPeriods(pers);
          setEmployees(emps);
        } catch (err) {
          setError(err instanceof ErrorEvaluacion ? err.message : 'Error loading modal data');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [show]);

  const handleSubmit = async () => {
    if (!formData.template_id || !formData.period_id || !formData.evaluator_id || formData.employee_ids.length === 0) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const response: CreateEvaluationsResponseDTO = await evaluationService.createEvaluationsFromTemplate(formData);
      alert(`Created ${response.created_count} evaluations successfully`);
      onClose();
    } catch (err) {
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error creating evaluations');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Evaluations</h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        ) : (
          <>
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: parseInt(e.target.value) })}
            >
              <option value={0}>Select Template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={formData.period_id}
              onChange={(e) => setFormData({ ...formData, period_id: parseInt(e.target.value) })}
            >
              <option value={0}>Select Period</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={formData.evaluator_id}
              onChange={(e) => setFormData({ ...formData, evaluator_id: parseInt(e.target.value) })}
            >
              <option value={0}>Select Evaluator</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{`${e.first_name} ${e.last_name}`}</option>
              ))}
            </select>
            <select
              multiple
              className="w-full p-2 border rounded-lg mb-4"
              value={formData.employee_ids.map(String)}
              onChange={(e) => setFormData({
                ...formData,
                employee_ids: Array.from(e.target.selectedOptions, opt => parseInt(opt.value))
              })}
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>{`${e.first_name} ${e.last_name}`}</option>
              ))}
            </select>
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({ show, onClose, onExport }) => {
  const [config, setConfig] = useState<{ includeOnlyCompleted: boolean; addPerformanceColors: boolean }>({
    includeOnlyCompleted: false,
    addPerformanceColors: true,
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Export Configuration</h2>
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeOnlyCompleted}
              onChange={(e) => setConfig({ ...config, includeOnlyCompleted: e.target.checked })}
            />
            Include only completed evaluations
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.addPerformanceColors}
              onChange={(e) => setConfig({ ...config, addPerformanceColors: e.target.checked })}
            />
            Add performance colors
          </label>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onExport(config)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const DashboardPage: React.FC = () => {
  // States
  const [myEvaluations, setMyEvaluations] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<ExtendedResumenEvaluacionDTO[]>([]);
  const [hrDashboard, setHrDashboard] = useState<HRDashboardDTO | null>(null);
  const [averageScores, setAverageScores] = useState<AverageByDepartmentResponseDTO[]>([]);
  const [pendingByDepartment, setPendingByDepartment] = useState<PendingByDepartmentResponseDTO[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceResponseDTO[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [periodEvals, setPeriodEvals] = useState<ExtendedResumenEvaluacionDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAverageScores, setLoadingAverageScores] = useState<boolean>(false);
  const [loadingPendingByDept, setLoadingPendingByDept] = useState<boolean>(false);
  const [loadingPerformance, setLoadingPerformance] = useState<boolean>(false);
  const [loadingPeriodEvals, setLoadingPeriodEvals] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'personal'>('admin');
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    search: '',
  });
  const [sort, setSort] = useState<SortState>({
    column: 'id',
    direction: 'asc',
  });
  const [modalReporteOpen, setModalReporteOpen] = useState<boolean>(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportPeriodId, setExportPeriodId] = useState<number | null>(null);

  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole === 'hr_manager';
  const currentUserId = user?.id || 0;

  // Load initial data
  useEffect(() => {
    loadData();
  }, [user]);

  // Load department and period-specific data
  useEffect(() => {
    if (isAdmin && viewMode === 'admin') {
      loadAverageScores(selectedPeriodId ?? undefined);
      loadPendingByDepartment();
    }
  }, [isAdmin, viewMode, selectedPeriodId]);

  // Load employee performance
  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeePerformance(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  // Load period evaluations
  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodEvaluations(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const myEvalsData = await evaluationService.getMyEvaluations();
      setMyEvaluations(myEvalsData);

      const [pers, emps] = await Promise.all([
        evaluationService.getPeriods(),
        evaluationService.getEmployees(),
      ]);
      setPeriods(pers);
      setEmployees(emps);

      if (isAdmin) {
        const [evalsData, dashboardData] = await Promise.all([
          evaluationService.listAllEvaluations(),
          evaluationService.getHRDashboard(),
        ]);
        setAllEvaluations(evalsData as ExtendedResumenEvaluacionDTO[]);
        setHrDashboard(dashboardData);
      }

      setSelectedEmployeeId(currentUserId);
    } catch (err) {
      console.error('Error cargando datos:', err);
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error al cargar los datos del dashboard';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const loadAverageScores = async (periodId?: number): Promise<void> => {
    setLoadingAverageScores(true);
    try {
      const data = await evaluationService.getAverageScoresByDepartment(periodId);
      setAverageScores(data);
    } catch (err) {
      console.error('Error loading average scores:', err);
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error loading department averages');
    } finally {
      setLoadingAverageScores(false);
    }
  };

  const loadPendingByDepartment = async (): Promise<void> => {
    setLoadingPendingByDept(true);
    try {
      const data = await evaluationService.getPendingEvaluationsByDepartment();
      setPendingByDepartment(data);
    } catch (err) {
      console.error('Error loading pending by dept:', err);
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error loading pending evaluations');
    } finally {
      setLoadingPendingByDept(false);
    }
  };

  const loadEmployeePerformance = async (employeeId: number): Promise<void> => {
    setLoadingPerformance(true);
    try {
      const data = await evaluationService.getEmployeePerformance(employeeId);
      setEmployeePerformance(data);
    } catch (err) {
      console.error('Error loading employee performance:', err);
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error loading employee performance');
    } finally {
      setLoadingPerformance(false);
    }
  };

  const loadPeriodEvaluations = async (periodId: number): Promise<void> => {
    setLoadingPeriodEvals(true);
    try {
      const data = await evaluationService.getEvaluationsByPeriod(periodId);
      setPeriodEvals(data as ExtendedResumenEvaluacionDTO[]);
    } catch (err) {
      console.error('Error loading period evaluations:', err);
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error loading period evaluations');
    } finally {
      setLoadingPeriodEvals(false);
    }
  };

  const normalizeStatus = (status: string): EstadoEvaluacion => {
    switch (status.toLowerCase().trim()) {
      case 'pendiente':
      case 'pending':
        return 'pending';
      case 'realizada':
      case 'completed':
        return 'completed';
      case 'atrasada':
      case 'overdue':
        return 'overdue';
      case 'in_progress':
      case 'en_progreso':
        return 'in_progress';
      default:
        console.warn(`Estado desconocido: ${status}`);
        return 'pending';
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDaysOverdue = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  const getFilteredEvaluations = (): ExtendedResumenEvaluacionDTO[] => {
    let filtered = selectedPeriodId ? periodEvals : allEvaluations;

    if (filter.status !== 'all') {
      filtered = filtered.filter(e => normalizeStatus(e.status) === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(e => e.employee_name.toLowerCase().includes(searchLower));
    }

    if (filter.evaluatorId) {
      filtered = filtered.filter(e => e.evaluator_id === filter.evaluatorId);
    }

    return filtered;
  };

  const getSortedEvaluations = (evals: ExtendedResumenEvaluacionDTO[]): ExtendedResumenEvaluacionDTO[] => {
    return [...evals].sort((a, b) => {
      if (sort.column === 'daysOverdue') {
        const aDays = normalizeStatus(a.status) === 'overdue' ? getDaysOverdue(a.due_date) : 0;
        const bDays = normalizeStatus(b.status) === 'overdue' ? getDaysOverdue(b.due_date) : 0;
        return sort.direction === 'asc' ? aDays - bDays : bDays - aDays;
      }
      if (sort.column === 'weighted_score') {
        const aVal = a.weighted_score || 0;
        const bVal = b.weighted_score || 0;
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aVal = String(a[sort.column as keyof ExtendedResumenEvaluacionDTO]);
      const bVal = String(b[sort.column as keyof ExtendedResumenEvaluacionDTO]);
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getStatusDistribution = (): ChartData[] => {
    const counts = (selectedPeriodId ? periodEvals : allEvaluations).reduce((acc, e) => {
      const status = normalizeStatus(e.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([status, count]) => ({
      name: evaluationService.obtenerTextoEstado(status as EstadoEvaluacion),
      value: count
    }));
  };

  const getPerformanceTrend = (): number => {
    if (employeePerformance.length < 2) return 0;
    const lastScore = employeePerformance[0].weightedScore;
    const prevScore = employeePerformance[1].weightedScore;
    return Math.round(((lastScore - prevScore) / prevScore) * 100);
  };

  const handleSort = (column: keyof ExtendedResumenEvaluacionDTO | 'daysOverdue'): void => {
    setSort({
      column,
      direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleEvaluationClick = (evaluation: ExtendedResumenEvaluacionDTO): void => {
    setSelectedEvaluationId(evaluation.id);
    setModalReporteOpen(true);
  };

  const handleExportReport = async (evaluationId: number): Promise<void> => {
    try {
      await evaluationService.exportEvaluationReport(evaluationId);
      alert('Report exported successfully');
    } catch (err) {
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error exporting report');
    }
  };

  const handleExportPeriod = async (config: { includeOnlyCompleted: boolean; addPerformanceColors: boolean }): Promise<void> => {
    if (!exportPeriodId) return;
    try {
      await evaluationService.exportPeriodEvaluations(exportPeriodId, {
        company_name: 'Control Caribe - Sector Salud',
        emotional_phrase: 'Cada evaluación es una oportunidad de crecer',
        ...config
      });
      alert('Period report exported successfully');
    } catch (err) {
      setError(err instanceof ErrorEvaluacion ? err.message : 'Error exporting period');
    } finally {
      setExportModalOpen(false);
      setExportPeriodId(null);
    }
  };

  const handleResetFilters = () => {
    setFilter({ status: 'all', search: '' });
    setSelectedPeriodId(null);
    setSelectedEmployeeId(currentUserId);
  };

  const navigateToEvaluations = (): void => {
    window.location.href = '/evaluaciones';
  };

  // Datos calculados
  const filteredEvals = useMemo(() => getFilteredEvaluations(), [allEvaluations, periodEvals, filter, selectedPeriodId]);
  const sortedEvals = useMemo(() => getSortedEvaluations(filteredEvals), [filteredEvals, sort]);
  const statusDistribution = useMemo(() => getStatusDistribution(), [allEvaluations, periodEvals, selectedPeriodId]);
  const performanceTrend = useMemo(() => getPerformanceTrend(), [employeePerformance]);
  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

  // Render loading and error states
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
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Evaluaciones</h1>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Vista administrativa completa' : 'Resumen de tus evaluaciones'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setViewMode(viewMode === 'admin' ? 'personal' : 'admin')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Vista {viewMode === 'admin' ? 'Personal' : 'Admin'}
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {isAdmin && viewMode === 'admin' && hrDashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Total Evaluaciones"
              value={hrDashboard.totalEvaluations}
              subtitle="En el sistema"
              icon={<BarChart3 className="w-6 h-6" />}
              color="bg-blue-600"
            />
            <StatCard
              title="Completadas"
              value={hrDashboard.completedEvaluations}
              subtitle="Evaluaciones finalizadas"
              icon={<CheckCircle className="w-6 h-6" />}
              color="bg-green-600"
            />
            <StatCard
              title="Pendientes"
              value={hrDashboard.pendingEvaluations}
              subtitle="Por completar"
              icon={<Clock className="w-6 h-6" />}
              color="bg-yellow-600"
            />
            <StatCard
              title="Vencidas"
              value={hrDashboard.overdueEvaluations}
              subtitle="Fuera de plazo"
              icon={<AlertTriangle className="w-6 h-6" />}
              color="bg-red-600"
            />
            <StatCard
              title="Tasa de Completitud"
              value={`${hrDashboard.completionRate}%`}
              subtitle="Progreso general"
              icon={<Activity className="w-6 h-6" />}
              color="bg-purple-600"
            />
          </div>
        )}

        {(!isAdmin || viewMode === 'personal') && myEvaluations && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Mis Evaluaciones"
              value={myEvaluations.as_employee.summary.total}
              subtitle="Como empleado"
              icon={<UserCheck className="w-6 h-6" />}
              color="bg-purple-600"
            />
            <StatCard
              title="Por Evaluar"
              value={myEvaluations.as_evaluator.summary.pending_to_evaluate}
              subtitle="Pendientes de calificar"
              icon={<Target className="w-6 h-6" />}
              color="bg-orange-600"
              onClick={navigateToEvaluations}
            />
            <StatCard
              title="Completadas"
              value={myEvaluations.as_evaluator.summary.completed}
              subtitle="Evaluaciones realizadas"
              icon={<Award className="w-6 h-6" />}
              color="bg-green-600"
            />
            <StatCard
              title="Total Asignadas"
              value={myEvaluations.as_evaluator.summary.total + myEvaluations.as_employee.summary.total}
              subtitle="En el sistema"
              icon={<Activity className="w-6 h-6" />}
              color="bg-blue-600"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {isAdmin && viewMode === 'admin' ? (
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
                      outerRadius=80
                      label
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            {/* Department Average Scores */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Puntuaciones Promedio por Departamento</h2>
              <select
                className="mb-4 p-2 border rounded-lg"
                value={selectedPeriodId ?? ''}
                onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Todos los períodos</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {loadingAverageScores ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : averageScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={averageScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Bar dataKey="averageScore" fill="#0088FE">
                      {averageScores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.averageScore > 80 ? '#00C49F' : entry.averageScore > 60 ? '#FFBB28' : '#FF8042'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            {/* Pending Evaluations by Department */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Evaluaciones Pendientes por Departamento</h2>
              {loadingPendingByDept ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : pendingByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pendingByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="department" type="category" width={150} />
                    <RechartsTooltip />
                    <Bar dataKey="pendingCount" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            {/* Evaluations Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lista de Evaluaciones</h2>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
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
                  onChange={(e) => setFilter({ ...filter, status: e.target.value as 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' })}
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="overdue">Atrasada</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
                  value={filter.evaluatorId ?? ''}
                  onChange={(e) => setFilter({ ...filter, evaluatorId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Todos los evaluadores</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{`${e.first_name} ${e.last_name}`}</option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
                  value={selectedPeriodId ?? ''}
                  onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Todos los períodos</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Reset Filters
                </button>
                {selectedPeriodId && (
                  <button
                    onClick={() => { setExportPeriodId(selectedPeriodId); setExportModalOpen(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Period
                  </button>
                )}
              </div>
              {loadingPeriodEvals && selectedPeriodId ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
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
                        <th className="p-2 cursor-pointer" onClick={() => handleSort('weighted_score')}>
                          Puntuación
                          {sort.column === 'weighted_score' && (
                            sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                          )}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => handleSort('daysOverdue')}>
                          Días de retraso
                          {sort.column === 'daysOverdue' && (
                            sort.direction === 'asc' ? <SortAsc className="inline w-4 h-4 ml-1" /> : <SortDesc className="inline w-4 h-4 ml-1" />
                          )}
                        </th>
                        <th className="p-2">Acciones</th>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${evaluationService.obtenerColorEstado(normalizeStatus(e.status))}`}>
                              {evaluationService.obtenerTextoEstado(normalizeStatus(e.status))}
                            </span>
                          </td>
                          <td className="p-2">{e.weighted_score.toFixed(1)}</td>
                          <td className="p-2">{normalizeStatus(e.status) === 'overdue' ? getDaysOverdue(e.due_date) : 0}</td>
                          <td className="p-2">
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleExportReport(e.id); }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions and Period Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <button
                  onClick={navigateToEvaluations}
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
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium">Crear Evaluaciones</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>

            {hrDashboard && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas por Período</h2>
                <div className="space-y-3">
                  {hrDashboard.departmentStats.map(p => (
                    <div key={p.department} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{p.department}</p>
                      <p className="text-sm text-gray-600">Completitud: {p.completionRate}%</p>
                      <p className="text-sm text-gray-600">Puntuación Promedio: {p.averageScore.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Personal View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Evaluations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Evaluaciones</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myEvaluations?.as_employee?.evaluations?.length ? (
                myEvaluations.as_employee.evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEvaluationClick(evaluation as ExtendedResumenEvaluacionDTO)}
                  >
                    <p className="font-medium text-gray-900">{evaluation.period_name}</p>
                    <p className="text-sm text-gray-600">Evaluador: {evaluation.evaluator_name}</p>
                    <p className="text-sm text-gray-600">Puntuación: {(evaluation as ExtendedResumenEvaluacionDTO).weighted_score.toFixed(1)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${evaluationService.obtenerColorEstado(normalizeStatus(evaluation.status))}`}>
                      {evaluationService.obtenerTextoEstado(normalizeStatus(evaluation.status))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No tienes evaluaciones asignadas</p>
              )}
            </div>
          </div>

          {/* Pending to Evaluate */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Por Evaluar</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myEvaluations?.as_evaluator?.evaluations?.filter(e => normalizeStatus(e.status) === 'pending').length ? (
                myEvaluations.as_evaluator.evaluations
                  .filter(e => normalizeStatus(e.status) === 'pending')
                  .map((evaluation) => (
                    <div key={evaluation.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{evaluation.employee_name}</p>
                      <p className="text-sm text-gray-600">{evaluation.period_name}</p>
                      <button 
                        onClick={() => handleEvaluationClick(evaluation as ExtendedResumenEvaluacionDTO)}
                        className="mt-2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Evaluar
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">No tienes evaluaciones pendientes</p>
              )}
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tendencias de Desempeño</h2>
            {loadingPerformance ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            ) : employeePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={employeePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodName" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="weightedScore" stroke="#0088FE" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de desempeño</p>
            )}
            {employeePerformance.length > 1 && (
              <p className={`text-sm mt-2 ${performanceTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Tendencia: {performanceTrend >= 0 ? '+' : ''}{performanceTrend}% respecto al período anterior
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedEvaluationId !== null && (
        <VerReporteEvaluacionModal
          show={modalReporteOpen}
          evaluationId={selectedEvaluationId}
          onClose={() => {
            setModalReporteOpen(false);
            setSelectedEvaluationId(null);
          }}
        />
      )}
      <CreateEvaluationModal
        show={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <ExportConfigModal
        show={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportPeriod}
      />
    </div>
  );
};

export default DashboardPage;