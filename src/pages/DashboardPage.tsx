// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, Clock, CheckCircle, AlertCircle,
  Calendar, Target, Activity, UserCheck, FileCheck,
  Bell, ArrowRight, Award, Loader2, RefreshCw, Eye,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dashboardService, ApiError } from '../services/dashboardService';
import { useAuth } from '../context/authContext';
import type { 
  HRDashboardDTO, 
  MyEvaluationsResponseDTO, 
  EmployeePerformanceDTO, 
  EvaluatorOverdueDTO 
} from '../services/dashboardService';

// =============== TYPES ===============
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      fullName: string;
      evaluaciones: number;
      completadas: number;
      promedio: number;
      tasa: number;
    };
  }>;
}

// =============== COMPONENTS ===============
const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, color, trend, onClick }) => (
  <div 
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-gradient-to-r ${color} rounded-xl text-white`}>
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

const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-sm">{data.fullName}</p>
      <p className="text-xs text-gray-600 mt-1">Total: {data.evaluaciones}</p>
      <p className="text-xs text-gray-600">Completadas: {data.completadas}</p>
      <p className="text-xs text-gray-600">Promedio: {data.promedio.toFixed(2)}</p>
      <p className="text-xs text-gray-600">Tasa: {data.tasa.toFixed(1)}%</p>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<HRDashboardDTO | null>(null);
  const [myEvaluations, setMyEvaluations] = useState<MyEvaluationsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'personal'>('admin');

  const { user } = useAuth();
  const userRole = user?.role?.name?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole === 'hr_manager';

  useEffect(() => {
    console.log('User:', user); // Debug
    console.log('User Role:', userRole); // Debug
    console.log('isAdmin:', isAdmin); // Debug
    loadData();
  }, [user]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAdmin) {
        console.log('Fetching HR Dashboard...'); // Debug
        try {
          const data = await dashboardService.getHRDashboard();
          console.log('HR Dashboard Data:', data); // Debug
          setDashboardData(data);
        } catch (err) {
          console.log('Error fetching HR Dashboard:', err); // Debug
          if (err instanceof ApiError && err.status === 403) {
            setError('No tienes permisos para ver el dashboard administrativo');
          } else {
            throw err;
          }
        }
      }
      
      console.log('Fetching My Evaluations...'); // Debug
      const myEvalsData = await dashboardService.getMyEvaluations();
      console.log('My Evaluations Data:', myEvalsData); // Debug
      setMyEvaluations(myEvalsData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof ApiError ? err.message : 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
      console.log('Final Dashboard Data:', dashboardData); // Debug
      console.log('Final My Evaluations:', myEvaluations); // Debug
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToEvaluations = (): void => {
    window.location.href = '/evaluaciones';
  };

  const navigateToEmployees = (): void => {
    window.location.href = '/employees';
  };

  // Prepare chart data with null check
  const departmentChartData = (dashboardData?.by_department || []).map(dept => ({
    name: dept.department_name.length > 15 
      ? dept.department_name.substring(0, 15) + '...' 
      : dept.department_name,
    fullName: dept.department_name,
    evaluaciones: dept.total_evaluations,
    completadas: dept.completed_evaluations,
    promedio: dept.average_score,
    tasa: dept.completion_rate
  }));

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
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
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

        {/* Admin Stats */}
        {isAdmin && viewMode === 'admin' && dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Evaluaciones"
              value={dashboardData.total_evaluations}
              subtitle={`${dashboardData.completion_percentage.toFixed(1)}% completadas`}
              icon={<BarChart3 className="w-6 h-6" />}
              color="from-blue-500 to-blue-600"
              trend={0}
            />
            <StatCard
              title="Completadas"
              value={dashboardData.completed_evaluations}
              subtitle="Evaluaciones finalizadas"
              icon={<CheckCircle className="w-6 h-6" />}
              color="from-green-500 to-green-600"
              trend={0}
            />
            <StatCard
              title="Pendientes"
              value={dashboardData.pending_evaluations}
              subtitle="Por completar"
              icon={<Clock className="w-6 h-6" />}
              color="from-yellow-500 to-yellow-600"
              trend={0}
            />
            <StatCard
              title="Vencidas"
              value={dashboardData.overdue_evaluations}
              subtitle="Fuera de plazo"
              icon={<AlertTriangle className="w-6 h-6" />}
              color="from-red-500 to-red-600"
              trend={0}
            />
          </div>
        )}

        {/* Personal Stats */}
        {(!isAdmin || viewMode === 'personal') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Mis Evaluaciones"
              value={myEvaluations?.summary.my_evaluations_total ?? 0}
              subtitle="Como empleado"
              icon={<UserCheck className="w-6 h-6" />}
              color="from-purple-500 to-purple-600"
            />
            <StatCard
              title="Por Evaluar"
              value={myEvaluations?.summary.pending_to_evaluate ?? 0}
              subtitle="Pendientes de calificar"
              icon={<Target className="w-6 h-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatCard
              title="Completadas"
              value={myEvaluations?.summary.completed_evaluating ?? 0}
              subtitle="Evaluaciones realizadas"
              icon={<Award className="w-6 h-6" />}
              color="from-green-500 to-green-600"
            />
            <StatCard
              title="Total Asignadas"
              value={myEvaluations?.summary.total_evaluations ?? 0}
              subtitle="En el sistema"
              icon={<Activity className="w-6 h-6" />}
              color="from-blue-500 to-blue-600"
            />
          </div>
        )}
      </div>

      {/* Main Content - Admin View */}
      {isAdmin && viewMode === 'admin' && dashboardData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Department Performance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Rendimiento por Departamento
              </h2>
              {departmentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="evaluaciones" fill="#3B82F6" name="Total" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="completadas" fill="#10B981" name="Completadas" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos de departamentos disponibles</p>
              )}
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mejores Evaluados</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(dashboardData.top_performers || []).length > 0 ? (
                  dashboardData.top_performers.map((performer: EmployeePerformanceDTO) => (
                    <div key={performer.employee_name} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{performer.employee_name}</p>
                      <p className="text-sm text-gray-600 mt-1">Departamento: {performer.department}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold">Puntaje: {performer.average_score.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">Última: {performer.last_evaluation || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay datos de mejores evaluados</p>
                )}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Menores Evaluados</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(dashboardData.bottom_performers || []).length > 0 ? (
                  dashboardData.bottom_performers.map((performer: EmployeePerformanceDTO) => (
                    <div key={performer.employee_name} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{performer.employee_name}</p>
                      <p className="text-sm text-gray-600 mt-1">Departamento: {performer.department}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold">Puntaje: {performer.average_score.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">Última: {performer.last_evaluation || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay datos de menores evaluados</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Overdue Evaluators */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Evaluadores con Atrasos</h2>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(dashboardData.overdue_evaluators || []).length > 0 ? (
                  dashboardData.overdue_evaluators.map((evaluator: EvaluatorOverdueDTO) => (
                    <div key={evaluator.evaluator_name} className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900 text-sm">{evaluator.evaluator_name}</p>
                      <p className="text-xs text-gray-600 mt-1">Departamento: {evaluator.department}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold">Atrasadas: {evaluator.overdue_count}</span>
                        <span className="text-xs text-gray-500">Más antigua: {evaluator.oldest_overdue || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay evaluadores con atrasos</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <button
                  onClick={navigateToEvaluations}
                  className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">Nueva Evaluación</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
                <button
                  onClick={navigateToEmployees}
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
              {myEvaluations?.as_employee.evaluations.length ? (
                myEvaluations.as_employee.evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-900">{evaluation.period_name}</p>
                    <p className="text-sm text-gray-600 mt-1">Evaluador: {evaluation.evaluator_name}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                      evaluation.status === 'realizada' ? 'bg-green-100 text-green-700' :
                      evaluation.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {evaluation.status}
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
              {myEvaluations?.as_evaluator.evaluations.filter(e => e.status === 'pendiente').length ? (
                myEvaluations.as_evaluator.evaluations
                  .filter(e => e.status === 'pendiente')
                  .map((evaluation) => (
                    <div key={evaluation.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{evaluation.employee_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{evaluation.period_name}</p>
                      <button 
                        onClick={navigateToEvaluations}
                        className="mt-2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600"
                      >
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
    </div>
  );
};

export default DashboardPage;