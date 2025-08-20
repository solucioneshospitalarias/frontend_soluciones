import React, { useState, useEffect } from 'react';
import {
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Activity,
  Building,
  UserCheck,
  FileCheck,
  Bell,
  ArrowRight
} from 'lucide-react';
import { 
  dashboardService, 
  type DashboardStats, 
  type RecentActivity, 
  type EvaluationProgress,
  type DepartmentStats 
} from '../services/dashboardService';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [evaluationProgress, setEvaluationProgress] = useState<EvaluationProgress[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, activityData, progressData, departmentData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getEvaluationProgress(),
        dashboardService.getDepartmentStats()
      ]);

      setStats(statsData);
      setRecentActivity(activityData);
      setEvaluationProgress(progressData);
      setDepartmentStats(departmentData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'evaluation_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'evaluation_created':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'employee_created':
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case 'template_created':
        return <FileCheck className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `hace ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `hace ${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Resumen general del sistema de evaluaciones
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <QuickStatCard 
            title="Total Empleados" 
            value={stats?.totalEmployees || 0}
            subtitle={`${stats?.activeEmployees || 0} activos`}
            icon={<Users className="w-5 h-5" />}
            color="from-blue-500 to-blue-600"
            trend="+5%"
          />
          <QuickStatCard 
            title="Evaluaciones Activas" 
            value={stats?.activeEvaluations || 0}
            subtitle={`${stats?.completedEvaluations || 0} completadas`}
            icon={<Clock className="w-5 h-5" />}
            color="from-orange-500 to-orange-600"
            trend="+12%"
          />
          <QuickStatCard 
            title="Progreso General" 
            value={`${stats?.averageProgress || 0}%`}
            subtitle="Del período actual"
            icon={<TrendingUp className="w-5 h-5" />}
            color="from-green-500 to-green-600"
            trend="+8%"
          />
          <QuickStatCard 
            title="Departamentos" 
            value={stats?.totalDepartments || 0}
            subtitle={`${stats?.totalCriteria || 0} criterios`}
            icon={<Building className="w-5 h-5" />}
            color="from-purple-500 to-purple-600"
            trend="0%"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Progress & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evaluation Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Progreso de Evaluaciones</h2>
                  <p className="text-sm text-gray-600">Estado actual por plantilla</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {evaluationProgress.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{item.template_name}</h3>
                    <span className="text-sm font-medium text-gray-600">
                      {item.completed_evaluations}/{item.total_evaluations}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso: {item.progress}%</span>
                    <span>En proceso: {item.in_progress_evaluations}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Estadísticas por Departamento</h2>
                  <p className="text-sm text-gray-600">Rendimiento y progreso</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentStats.map((dept, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">{dept.department_name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Empleados:</span>
                      <span className="font-medium">{dept.total_employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activos:</span>
                      <span className="font-medium">{dept.active_employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Evaluaciones:</span>
                      <span className="font-medium">{dept.evaluations_completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promedio:</span>
                      <span className="font-medium text-green-600">{dept.average_score.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
                  <p className="text-xs text-gray-600">Últimas acciones del sistema</p>
                </div>
              </div>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <QuickActionButton 
                title="Nuevo Empleado"
                description="Registrar empleado en el sistema"
                icon={<UserCheck className="w-5 h-5" />}
                color="bg-blue-50 text-blue-600 hover:bg-blue-100"
                onClick={() => window.location.href = '/employees'}
              />
              <QuickActionButton 
                title="Nueva Evaluación"
                description="Crear evaluación desde plantilla"
                icon={<BarChart3 className="w-5 h-5" />}
                color="bg-green-50 text-green-600 hover:bg-green-100"
                onClick={() => window.location.href = '/evaluaciones'}
              />
              <QuickActionButton 
                title="Nuevo Período"
                description="Configurar período de evaluación"
                icon={<Calendar className="w-5 h-5" />}
                color="bg-purple-50 text-purple-600 hover:bg-purple-100"
                onClick={() => window.location.href = '/evaluaciones'}
              />
              <QuickActionButton 
                title="Nuevo Criterio"
                description="Añadir criterio de evaluación"
                icon={<Target className="w-5 h-5" />}
                color="bg-orange-50 text-orange-600 hover:bg-orange-100"
                onClick={() => window.location.href = '/evaluaciones'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjetas de estadísticas rápidas
const QuickStatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend: string;
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-gradient-to-r ${color} rounded-xl text-white`}>
        {icon}
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        trend.startsWith('+') ? 'bg-green-100 text-green-700' : 
        trend.startsWith('-') ? 'bg-red-100 text-red-700' : 
        'bg-gray-100 text-gray-700'
      }`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

// Componente para botones de acción rápida
const QuickActionButton: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-3 rounded-lg transition-colors text-left group ${color}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-70">{description}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </button>
);

export default DashboardPage;