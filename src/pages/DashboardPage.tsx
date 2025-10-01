import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Loader2,
  Target,
  Award,
} from 'lucide-react';
import {
  getDepartments,
  getDepartmentPeriodStats,
  downloadDepartmentReport,
  calculateDepartmentPerformance,
  type Department,
  type DepartmentPeriodStats,
  type DepartmentPerformance,
} from '../services/departmentService';
import { getPeriods, type Period } from '../services/evaluationService';
import VerReporteDepartamentoModal from '../components/VerReporteDepartamentoModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// =============== INTERFACES ===============
interface DepartmentWithStats extends Department {
  evaluation_stats?: {
    total: number;
    completed: number;
    pending: number;
  };
  employee_count?: number;
}

// Interface for Tooltip props
interface TooltipProps {
  payload?: Array<{
    name: string;
    payload: {
      name: string;
      promedio: number;
      completionRate: number;
      completadas: number;
      total: number;
    };
  }>;
}

// =============== COMPONENTES ===============

// Card de Departamento - Diseño elegante y compacto
const DepartmentCard: React.FC<{
  department: DepartmentWithStats;
  onClick: () => void;
}> = ({ department, onClick }) => {
  const completionRate = department.evaluation_stats
    ? Math.round((department.evaluation_stats.completed / department.evaluation_stats.total) * 100) || 0
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
              {department.name}
            </h3>
            {department.employee_count ? (
              <p className="text-xs text-gray-500">{department.employee_count} empleados</p>
            ) : department.evaluation_stats ? (
              <p className="text-xs text-gray-500">{department.evaluation_stats.total} evaluaciones</p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>

      {department.evaluation_stats && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Progreso</span>
            <span className="font-medium text-gray-700">
              {department.evaluation_stats.completed}/{department.evaluation_stats.total}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span className="text-xs text-gray-500">
                {department.evaluation_stats.completed} Completadas
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-gray-500">
                {department.evaluation_stats.pending} Pendientes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Gráfico de Comparación - Elegante Bar Chart con Recharts
const DepartmentComparisonChart: React.FC<{
  data: DepartmentPerformance[];
  selectedPeriod: Period | null;
  onPeriodChange: (period: Period) => void;
  periods: Period[];
}> = ({ data, selectedPeriod, onPeriodChange, periods }) => {
  // Verificar que data sea un arreglo válido
  const sortedData = Array.isArray(data) ? [...data].sort((a, b) => b.promedio - a.promedio) : [];

  // Prepara datos para Recharts
  const chartData = sortedData.map((dept) => ({
    name: dept.name,
    promedio: dept.promedio,
    completionRate: dept.total > 0 ? (dept.completadas / dept.total) * 100 : 0,
    completadas: dept.completadas,
    total: dept.total,
  }));

  console.log('Chart data for Recharts:', chartData); // Debug log

  const getBarColor = (value: number) => {
    if (value >= 90) return '#10B981'; // Emerald
    if (value >= 80) return '#3B82F6'; // Blue
    if (value >= 70) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-[600px] flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rendimiento por Departamento</h2>
            <p className="text-xs text-gray-500 mt-1">Puntuación promedio y progreso</p>
          </div>
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>

        <select
          value={selectedPeriod?.id || ''}
          onChange={(e) => {
            const period = periods.find((p: Period) => p.id === parseInt(e.target.value));
            if (period) onPeriodChange(period);
          }}
          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        >
          <option value="">📊 Todos los períodos</option>
          {periods.map((period: Period) => (
            <option key={period.id} value={period.id}>
              📅 {period.name}
            </option>
          ))}
        </select>
      </div>

      {chartData.length > 0 ? (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                fontFamily="'Inter', sans-serif"
                fontSize={12}
                tick={{ fill: '#4B5563' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                fontFamily="'Inter', sans-serif"
                fontSize={12}
                tick={{ fill: '#4B5563' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Puntuación (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fill: '#1F2937',
                  offset: -5,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  padding: '8px',
                }}
                formatter={(_value: number, _name: string, props: TooltipProps) => [
                  `Puntuación: ${props.payload && props.payload[0]?.payload?.promedio.toFixed(1)}%`,
                  `Completitud: ${props.payload && props.payload[0]?.payload?.completionRate.toFixed(1)}% (${props.payload && props.payload[0]?.payload?.completadas}/${props.payload && props.payload[0]?.payload?.total})`,
                ]}
                labelStyle={{ color: '#fff', fontWeight: '600' }}
              />
              <Bar
                dataKey="promedio"
                radius={[6, 6, 0, 0]}
                barSize={40}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Bar
                    key={`${entry.name}-${index}`}
                    dataKey="promedio"
                    fill={getBarColor(entry.promedio)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px] text-center">
          <div className="p-3 bg-gray-100 rounded-full mb-2">
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No hay datos disponibles</p>
          <p className="text-gray-400 text-xs mt-1">Selecciona un período para ver estadísticas</p>
        </div>
      )}

      {sortedData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-gray-700">Promedio General</span>
              </div>
              <p className="text-base font-semibold text-gray-900">
                {(sortedData.reduce((acc, d) => acc + d.promedio, 0) / sortedData.length).toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Award className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Mejor Depto.</span>
              </div>
              <p className="text-base font-semibold text-gray-900 truncate">
                {sortedData[0]?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============== COMPONENTE PRINCIPAL ===============
const DashboardPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithStats | null>(null);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<Period | null>(null);
  const [modalPeriod, setModalPeriod] = useState<Period | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentPeriodStats | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para el filtro de período del gráfico
  const [chartPeriod, setChartPeriod] = useState<Period | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [departmentsData, periodsData] = await Promise.all([
        getDepartments(),
        getPeriods(),
      ]);

      console.log('Departments:', departmentsData);
      console.log('Periods:', periodsData);

      setDepartments(departmentsData);
      setPeriods(periodsData);

      const activePeriod = periodsData.find((p: Period) => p.is_active);
      let performanceData: DepartmentPerformance[] = [];

      if (activePeriod) {
        setSelectedReportPeriod(activePeriod);
        setModalPeriod(activePeriod);
        setChartPeriod(activePeriod);

        performanceData = await calculateDepartmentPerformance(activePeriod.id);
        console.log('Performance data:', performanceData);
        setDepartmentPerformance(performanceData);
      } else {
        performanceData = await calculateDepartmentPerformance();
        console.log('Performance data (no active period):', performanceData);
        setDepartmentPerformance(performanceData);
      }

      const departmentsWithStats: DepartmentWithStats[] = departmentsData.map((dept: Department) => {
        const stats = performanceData.find(
          (d: DepartmentPerformance) => d.name.toLowerCase() === dept.name.toLowerCase(),
        );

        return {
          ...dept,
          employee_count: stats ? stats.unique_employees : undefined,
          evaluation_stats: stats
            ? {
                total: stats.total,
                completed: stats.completadas,
                pending: stats.pendientes,
              }
            : undefined,
        };
      });
      setDepartments(departmentsWithStats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openDepartmentModal = async (department: DepartmentWithStats) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);

    const periodToUse = selectedReportPeriod || periods[0];
    if (periodToUse) {
      await loadDepartmentStats(department.id, periodToUse.id, department.name);
    }
  };

  const loadDepartmentStats = async (departmentId: number, periodId: number, departmentName: string) => {
    setModalLoading(true);
    setDepartmentStats(null);

    try {
      const stats = await getDepartmentPeriodStats(departmentId, periodId, departmentName);
      setDepartmentStats(stats);
    } catch (err) {
      console.error('Error loading department stats:', err);
      setDepartmentStats(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalPeriodChange = (period: Period) => {
    setModalPeriod(period);
    if (selectedDepartment) {
      loadDepartmentStats(selectedDepartment.id, period.id, selectedDepartment.name);
    }
  };

  const handleReportPeriodChange = async (period: Period) => {
    setSelectedReportPeriod(period);
    try {
      const performanceData = await calculateDepartmentPerformance(period.id);
      setDepartmentPerformance(performanceData);
      const departmentsWithStats: DepartmentWithStats[] = departments.map((dept: Department) => {
        const stats = performanceData.find(
          (d: DepartmentPerformance) => d.name.toLowerCase() === dept.name.toLowerCase(),
        );

        return {
          ...dept,
          employee_count: stats ? stats.unique_employees : undefined,
          evaluation_stats: stats
            ? {
                total: stats.total,
                completed: stats.completadas,
                pending: stats.pendientes,
              }
            : undefined,
        };
      });
      setDepartments(departmentsWithStats);
    } catch (err) {
      console.error('Error updating report data:', err);
    }
  };

  const handleChartPeriodChange = async (period: Period) => {
    setChartPeriod(period);
    try {
      const performanceData = await calculateDepartmentPerformance(period.id);
      setDepartmentPerformance(performanceData);
    } catch (err) {
      console.error('Error updating chart data:', err);
    }
  };

  const handleExport = async () => {
    if (!selectedDepartment || !modalPeriod) {
      console.error('Export failed: missing department or period');
      alert('Error: Departamento o período no seleccionado.');
      return;
    }

    setExporting(true);
    try {
      console.log(
        `Exporting report for department ${selectedDepartment.id} (${selectedDepartment.name}), period ${modalPeriod.id} (${modalPeriod.name})`,
      );
      await downloadDepartmentReport(
        selectedDepartment.id,
        selectedDepartment.name,
        modalPeriod.id,
        modalPeriod.name,
      );
      console.log('Export completed successfully');
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Error al exportar el reporte. Por favor, intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
    setDepartmentStats(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Área de Reportes por Departamentos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reportes por Departamentos</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">Selecciona un departamento para ver detalles y reportes</p>
            <select
              value={selectedReportPeriod?.id || ''}
              onChange={(e) => {
                const period = periods.find((p: Period) => p.id === parseInt(e.target.value));
                if (period) handleReportPeriodChange(period);
              }}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all mb-4"
            >
              <option value="">📊 Todos los períodos</option>
              {periods.map((period: Period) => (
                <option key={period.id} value={period.id}>
                  📅 {period.name}
                </option>
              ))}
            </select>
            <div className="max-h-[500px] overflow-y-auto rounded-lg pr-2 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((department) => (
                  <DepartmentCard
                    key={department.id}
                    department={department}
                    onClick={() => openDepartmentModal(department)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Área de Gráfico de Comparación */}
        <div className="lg:col-span-1">
          <DepartmentComparisonChart
            data={departmentPerformance}
            selectedPeriod={chartPeriod}
            onPeriodChange={handleChartPeriodChange}
            periods={periods}
          />
        </div>
      </div>

      <VerReporteDepartamentoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        department={selectedDepartment}
        periods={periods}
        selectedPeriod={modalPeriod}
        onPeriodChange={handleModalPeriodChange}
        stats={departmentStats}
        loading={modalLoading}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
};

export default DashboardPage;