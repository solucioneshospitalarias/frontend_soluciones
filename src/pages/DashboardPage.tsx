import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, Clock, CheckCircle, AlertCircle,
  Calendar, Target, Activity, UserCheck, FileCheck,
  ArrowRight, Award, Loader2, RefreshCw, Eye,
  AlertTriangle, ChevronUp, ChevronDown, Search, Play,
  SortAsc, SortDesc
} from 'lucide-react';
import { 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
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

// =============== MAIN COMPONENT ===============
const DashboardPage: React.FC = () => {
  // Estados principales
  const [myEvaluations, setMyEvaluations] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<ResumenEvaluacionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      console.log('Cargando mis evaluaciones...');
      const myEvalsData = await servicioEvaluaciones.obtenerMisEvaluaciones();
      console.log('Mis evaluaciones:', myEvalsData);
      setMyEvaluations(myEvalsData);

      if (isAdmin) {
        console.log('Cargando todas las evaluaciones...');
        const evalsData = await servicioEvaluaciones.listarTodasLasEvaluaciones();
        console.log('Todas las evaluaciones (sin normalizar):', evalsData);
        // Normalizar estados
        const normalizedEvals = evalsData.map(e => ({
          ...e,
          status: normalizeStatus(e.status)
        }));
        console.log('Todas las evaluaciones (normalizadas):', normalizedEvals);
        setAllEvaluations(normalizedEvals);
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
        console.warn(`Estado desconocido: ${status}`);
        return 'pendiente'; // Valor por defecto
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      console.log('Estado encontrado:', e.status);
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Conteo de estados:', counts);

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
    console.log('Abriendo reporte para evaluación ID:', evaluation.id);
    setSelectedEvaluationId(evaluation.id);
    setModalReporteOpen(true);
  };

  const closeModal = (): void => {
    setModalReporteOpen(false);
    setSelectedEvaluationId(null);
  };

  const navigateToEvaluations = (): void => {
    window.location.href = '/evaluaciones';
  };

  // Datos calculados
  const filteredEvals = getFilteredEvaluations();
  const sortedEvals = getSortedEvaluations(filteredEvals);
  const statusDistribution = getStatusDistribution();
  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

  const adminStats = isAdmin ? {
    total: allEvaluations.length,
    completed: allEvaluations.filter(e => e.status === 'realizada').length,
    pending: allEvaluations.filter(e => e.status === 'pendiente').length,
    overdue: allEvaluations.filter(e => e.status === 'atrasada').length
  } : null;

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
              </div>
            </div>
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
                  <div key={evaluation.id} className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-900">{evaluation.period_name}</p>
                    <p className="text-sm text-gray-600">Evaluador: {evaluation.evaluator_name}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${servicioEvaluaciones.obtenerColorEstado(evaluation.status)}`}>
                      {servicioEvaluaciones.obtenerTextoEstado(evaluation.status)}
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
              {myEvaluations?.as_evaluator?.evaluations?.filter(e => e.status === 'pendiente').length ? (
                myEvaluations.as_evaluator.evaluations
                  .filter(e => e.status === 'pendiente')
                  .map((evaluation) => (
                    <div key={evaluation.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{evaluation.employee_name}</p>
                      <p className="text-sm text-gray-600">{evaluation.period_name}</p>
                      <button 
                        onClick={() => window.location.href = '/evaluaciones'}
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
        </div>
      )}

      {/* Modal */}
      <VerReporteEvaluacionModal
        show={modalReporteOpen}
        evaluationId={selectedEvaluationId}
        onClose={closeModal}
      />
    </div>
  );
};

export default DashboardPage;