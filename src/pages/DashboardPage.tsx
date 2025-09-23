import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, BarChart3, Clock, CheckCircle, AlertCircle,
  Calendar, Target, Activity, FileCheck,
  ArrowRight, Loader2, AlertTriangle,
  ChevronUp, ChevronDown, Search, Play, SortAsc, SortDesc, Bell, User, Eye
} from 'lucide-react';

import { 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid
} from 'recharts';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import { useAuth } from '../context/authContext';
import VerReporteEvaluacionModal from '../components/VerReporteEvaluacionModal';
import RealizarEvaluacionModal from '../components/RealizarEvaluacionModal';
import type { 
  MisEvaluacionesRespuestaDTO,
  ResumenEvaluacionDTO,
  Period,
  PendingByDepartmentResponseDTO,
  AverageByDepartmentResponseDTO,
  EmployeePerformanceResponseDTO
} from '../types/evaluation';

// =============== INTERFACES ===============
interface FilterState {
  status: 'all' | 'pendiente' | 'realizada' | 'atrasada';
  search: string;
  periodId?: number;
}

interface SortState {
  column: keyof ResumenEvaluacionDTO | 'daysOverdue';
  direction: 'asc' | 'desc';
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
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

interface OverdueEvaluationsAlertProps {
  overdueCount: number;
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
          {trend >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 ml-1" />}
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

const OverdueEvaluationsAlert: React.FC<OverdueEvaluationsAlertProps> = ({ overdueCount }) => {
  if (overdueCount === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-800">
            {overdueCount} evaluaciones vencidas
          </h3>
          <p className="text-sm text-red-600">
            Requieren atención inmediata
          </p>
        </div>
      </div>
    </div>
  );
};

const BadgeEstado: React.FC<{ estado: string }> = ({ estado }) => {
  const getEstadoConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'pendiente':
      case 'pending':
      case 'false':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          texto: 'Pendiente',
        };
      case 'realizada':
      case 'completed':
      case 'completada':
      case 'completado':
      case 'true':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          texto: 'Completada',
        };
      case 'atrasada':
      case 'overdue':
      case 'vencida':
      case 'vencido':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          texto: 'Vencida',
        };
      case 'in_progress':
      case 'en_progreso':
      case 'en_proceso':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          texto: 'En Progreso',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          texto: `${status} [DEBUG]`,
        };
    }
  };

  const config = getEstadoConfig(estado);
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.texto}
    </span>
  );
};

// =============== MAIN COMPONENT ===============
const DashboardPage: React.FC = () => {
  // Estados principales
  const [myEvaluations, setMyEvaluations] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<ResumenEvaluacionDTO[]>([]);
  const [pendingByDepartment, setPendingByDepartment] = useState<PendingByDepartmentResponseDTO[]>([]);
  const [averageByDepartment, setAverageByDepartment] = useState<AverageByDepartmentResponseDTO[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceResponseDTO[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'personal'>('admin');
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    search: '',
    periodId: undefined,
  });
  const [sort, setSort] = useState<SortState>({
    column: 'id',
    direction: 'asc',
  });
  const [modalRealizarOpen, setModalRealizarOpen] = useState(false);
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<number | null>(null);
  const [personalFilter, setPersonalFilter] = useState<{ status: 'todos' | 'pendiente' | 'realizada' | 'atrasada'; search: string }>({
    status: 'todos',
    search: '',
  });

  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole === 'hr_manager';

  // Verificar si hay evaluaciones pendientes o atrasadas
  const hasPendingOrOverdue = myEvaluations?.as_evaluator.evaluations.some(
    e => e.status === 'pendiente' || e.status === 'atrasada'
  ) || false;

  // Cargar datos con polling automático
  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar mis evaluaciones
      console.log('Cargando mis evaluaciones...');
      const myEvalsData = await servicioEvaluaciones.obtenerMisEvaluaciones();
      console.log('Datos de mis evaluaciones:', JSON.stringify(myEvalsData, null, 2));
      setMyEvaluations(myEvalsData);

      // Cargar períodos
      console.log('Cargando períodos...');
      const periodsData = await servicioEvaluaciones.getPeriods();
      setPeriods(periodsData);

      if (isAdmin) {
        // Cargar todas las evaluaciones
        console.log('Cargando todas las evaluaciones...');
        const evalsData = await servicioEvaluaciones.listarTodasLasEvaluaciones({ period_id: filter.periodId });
        const normalizedEvals = evalsData.map(e => ({
          ...e,
          status: normalizeStatus(e.status)
        }));
        console.log('Evaluaciones normalizadas:', normalizedEvals);
        setAllEvaluations(normalizedEvals);

        // Cargar pendientes por departamento
        console.log('Cargando pendientes por departamento...');
        const pendingData = await servicioEvaluaciones.getPendingEvaluationsByDepartment();
        setPendingByDepartment(pendingData);

        // Cargar promedios por departamento
        console.log('Cargando promedios por departamento...');
        const avgData = await servicioEvaluaciones.getAverageScoresByDepartment(filter.periodId);
        setAverageByDepartment(avgData);
      }

      // Cargar desempeño del empleado actual
      if (user?.id) {
        console.log('Cargando desempeño del empleado...');
        const perfData = await servicioEvaluaciones.getEmployeePerformance(user.id);
        setEmployeePerformance(perfData);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error al cargar los datos del dashboard';
      setError(mensaje);
      setMyEvaluations({
        as_employee: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending: 0 },
        },
        as_evaluator: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending_to_evaluate: 0 },
        },
      });
      setAllEvaluations([]);
      setPendingByDepartment([]);
      setAverageByDepartment([]);
      setEmployeePerformance([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filter.periodId, user?.id]);

  // Polling para actualización automática
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const normalizeStatus = (status: string | boolean): 'pendiente' | 'realizada' | 'atrasada' => {
    const statusStr = String(status).toLowerCase().trim();
    switch (statusStr) {
      case 'pendiente':
      case 'pending':
      case 'false':
        return 'pendiente';
      case 'realizada':
      case 'completed':
      case 'true':
        return 'realizada';
      case 'atrasada':
      case 'overdue':
        return 'atrasada';
      default:
        console.warn(`Estado desconocido: ${statusStr}`);
        return 'pendiente';
    }
  };

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
      filtered = filtered.filter(e => 
        e.employee_name.toLowerCase().includes(searchLower) ||
        e.period_name.toLowerCase().includes(searchLower)
      );
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

  const handleEvaluationClick = (evaluationId: number): void => {
    setEvaluacionSeleccionada(evaluationId);
    setModalReporteOpen(true);
  };

  const handleRealizarEvaluacion = (evaluacionId: number): void => {
    console.log('Abriendo evaluación ID:', evaluacionId);
    setEvaluacionSeleccionada(evaluacionId);
    setModalRealizarOpen(true);
  };

  const handleEvaluacionCompletada = (): void => {
    loadData();
    setModalRealizarOpen(false);
    setEvaluacionSeleccionada(null);
  };

  const handleReporteCerrado = (): void => {
    setModalReporteOpen(false);
    setEvaluacionSeleccionada(null);
  };

  const navigateToEvaluations = (): void => {
    window.location.href = '/evaluaciones';
  };

  // Filtrar evaluaciones personales (como evaluador)
  const getFilteredPersonalEvaluations = (): ResumenEvaluacionDTO[] => {
    if (!myEvaluations) {
      console.log('myEvaluations es null');
      return [];
    }
    const evaluations = myEvaluations.as_evaluator.evaluations.map(e => ({
      ...e,
      status: normalizeStatus(e.status)
    }));
    console.log('Evaluaciones como evaluador:', evaluations);
    
    const filtered = evaluations.filter(evaluacion => {
      const coincideBusqueda = evaluacion.employee_name.toLowerCase().includes(personalFilter.search.toLowerCase()) ||
                              evaluacion.period_name.toLowerCase().includes(personalFilter.search.toLowerCase());
      const coincideEstado = personalFilter.status === 'todos' || 
                            evaluacion.status === personalFilter.status;
      return coincideBusqueda && coincideEstado;
    });
    console.log('Evaluaciones filtradas:', filtered);
    return filtered;
  };

  // Datos calculados
  const filteredEvals = getFilteredEvaluations();
  const sortedEvals = getSortedEvaluations(filteredEvals);
  const statusDistribution = getStatusDistribution();
  const filteredPersonalEvals = getFilteredPersonalEvaluations();
  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

  const adminStats = isAdmin ? {
    total: allEvaluations.length,
    completed: allEvaluations.filter(e => e.status === 'realizada').length,
    pending: allEvaluations.filter(e => e.status === 'pendiente').length,
    overdue: allEvaluations.filter(e => e.status === 'atrasada').length
  } : null;

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error al cargar el dashboard</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
                {isAdmin && viewMode === 'admin' ? 'Vista administrativa completa' : 'Evaluaciones que debo realizar'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setViewMode(viewMode === 'admin' ? 'personal' : 'admin')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 relative"
            >
              <Eye className="w-4 h-4" />
              Vista {viewMode === 'admin' ? 'Personal' : 'Admin'}
              {hasPendingOrOverdue && (
                <Bell className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
              )}
            </button>
          )}
        </div>

        {/* Stats Cards - Admin */}
        {isAdmin && viewMode === 'admin' && adminStats && (
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
        )}

        {/* Stats Cards - Personal */}
        {(!isAdmin || viewMode === 'personal') && myEvaluations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Total Asignadas"
              value={myEvaluations.as_evaluator.summary.total}
              subtitle="Evaluaciones asignadas"
              icon={<User className="w-6 h-6" />}
              color="bg-blue-600"
            />
            <StatCard
              title="Por Calificar"
              value={myEvaluations.as_evaluator.summary.pending_to_evaluate}
              subtitle="Pendientes de calificar"
              icon={<Clock className="w-6 h-6" />}
              color="bg-yellow-600"
              onClick={navigateToEvaluations}
            />
            <StatCard
              title="Completadas"
              value={myEvaluations.as_evaluator.summary.completed}
              subtitle="Evaluaciones realizadas"
              icon={<CheckCircle className="w-6 h-6" />}
              color="bg-green-600"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {isAdmin && viewMode === 'admin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overdue Evaluations Alert */}
            {adminStats && <OverdueEvaluationsAlert overdueCount={adminStats.overdue} />}

            {/* Period Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtro por Período</h2>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filter.periodId || ''}
                onChange={(e) => setFilter({ ...filter, periodId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Todos los períodos</option>
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({new Date(period.start_date).toLocaleDateString('es-ES')} - {new Date(period.due_date).toLocaleDateString('es-ES')})
                  </option>
                ))}
              </select>
            </div>

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
                    <Tooltip formatter={(value: number) => `${value} evaluaciones`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            {/* Pending Evaluations by Department */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Evaluaciones Pendientes por Departamento</h2>
              {pendingByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pendingByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value} pendientes`} />
                    <Legend />
                    <Bar dataKey="pending_evaluations" fill="#FF8042" name="Pendientes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            {/* Average Scores by Department */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Promedio de Puntuaciones por Departamento</h2>
              {averageByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={averageByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="average_score" fill="#00C49F" name="Puntuación Promedio" />
                  </BarChart>
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
                    placeholder="Buscar por nombre de empleado o período..."
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
                    status: e.target.value as FilterState['status']
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
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvals.map(e => (
                      <tr 
                        key={e.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer" 
                        onClick={() => handleEvaluationClick(e.id)}
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
                        <td className="p-2">{e.weighted_score.toFixed(2)}</td>
                        <td className="p-2">
                          {e.status === 'atrasada' ? getDaysOverdue(e.due_date) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedEvals.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No se encontraron evaluaciones con los filtros aplicados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Performance and Actions */}
          <div className="space-y-6">
            {/* Employee Performance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Mi Desempeño</h2>
              {employeePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={employeePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period_name" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weighted_score" 
                      stroke="#0088FE" 
                      name="Puntuación" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos de desempeño disponibles</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-[450px]">
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
                    <Users className="w-5 h-5 text-blue-600" />
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
      ) : (
        /* Personal View */
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de empleado o período..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={personalFilter.search}
                  onChange={(e) => setPersonalFilter({ ...personalFilter, search: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={personalFilter.status}
                  onChange={(e) => setPersonalFilter({ ...personalFilter, status: e.target.value as 'todos' | 'pendiente' | 'realizada' | 'atrasada' })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="realizada">Completadas</option>
                  <option value="atrasada">Vencidas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Evaluations List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Evaluaciones Asignadas ({filteredPersonalEvals.length})
              </h3>
            </div>
            {filteredPersonalEvals.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No se encontraron evaluaciones</p>
                <p className="text-gray-400 text-sm">
                  {personalFilter.search || personalFilter.status !== 'todos'
                    ? 'Prueba ajustando los filtros de búsqueda'
                    : 'No tienes evaluaciones asignadas en este momento'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPersonalEvals.map((evaluacion) => (
                  <div key={evaluacion.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {evaluacion.employee_name}
                          </h4>
                          <BadgeEstado estado={evaluacion.status} />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Período: {evaluacion.period_name}</span>
                          </div>
                          {evaluacion.completed_at && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Completada: {new Date(evaluacion.completed_at).toLocaleDateString('es-ES')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {(evaluacion.status === 'pendiente' || evaluacion.status === 'atrasada') ? (
                          <button
                            onClick={() => handleRealizarEvaluacion(evaluacion.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              evaluacion.status === 'atrasada'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            {evaluacion.status === 'atrasada' ? 'CALIFICAR (ATRASADA)' : 'CALIFICAR AHORA'}
                          </button>
                        ) : evaluacion.status === 'realizada' ? (
                          <button 
                            onClick={() => handleEvaluationClick(evaluacion.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            VER REPORTE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRealizarEvaluacion(evaluacion.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            EVALUAR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <RealizarEvaluacionModal
        show={modalRealizarOpen}
        evaluationId={evaluacionSeleccionada}
        onClose={handleReporteCerrado}
        onComplete={handleEvaluacionCompletada}
      />
      <VerReporteEvaluacionModal
        show={modalReporteOpen}
        evaluationId={evaluacionSeleccionada}
        onClose={handleReporteCerrado}
      />
    </div>
  );
};

export default DashboardPage;