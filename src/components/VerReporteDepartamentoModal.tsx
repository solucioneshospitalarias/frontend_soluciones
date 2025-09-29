import React from 'react';
import {
  Users, CheckCircle, Clock, Award, X, Download, Loader2, AlertCircle,
} from 'lucide-react';
import { type Department, type DepartmentPeriodStats } from '../services/departmentService';
import { type Period } from '../services/evaluationService';

interface DepartmentWithStats extends Department {
  evaluation_stats?: {
    total: number;
    completed: number;
    pending: number;
  };
  employee_count?: number;
}

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentWithStats | null;
  periods: Period[];
  selectedPeriod: Period | null;
  onPeriodChange: (period: Period) => void;
  stats: DepartmentPeriodStats | null;
  loading: boolean;
  onExport: () => void;
  exporting: boolean;
}

const VerReporteDepartamentoModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  periods,
  selectedPeriod,
  onPeriodChange,
  stats,
  loading,
  onExport,
  exporting,
}) => {
  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-slate-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold text-slate-50 mb-1">{department.name}</h2>
              <p className="text-xs text-slate-300">Reporte de evaluaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('Export button clicked for department:', department.name);
                  onExport();
                }}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-slate-300 hover:bg-slate-600/20 p-1.5 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Período de Evaluación
          </label>
          <select
            value={selectedPeriod?.id || ''}
            onChange={(e) => {
              const period = periods.find(p => p.id === parseInt(e.target.value));
              if (period) onPeriodChange(period);
            }}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {period.name} ({new Date(period.start_date).toLocaleDateString('es-ES')} - {new Date(period.end_date).toLocaleDateString('es-ES')})
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600">Cargando datos...</p>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Empleados</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{stats.unique_employees}</p>
                  <p className="text-xs text-slate-500 mt-1">En este período</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">Completadas</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{stats.completed_evaluations}</p>
                  <p className="text-xs text-slate-500 mt-1">{stats.completion_rate.toFixed(1)}% completado</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-slate-700">Pendientes</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{stats.pending_evaluations}</p>
                  <p className="text-xs text-slate-500 mt-1">Por completar</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Promedio</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{stats.average_score.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 mt-1">Puntuación promedio</p>
                </div>
              </div>

              {/* Información Detallada */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-300 bg-white -mx-4 px-4 -mt-4 pt-3 rounded-t-lg">
                  Detalles del Período
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Período:</span>
                    <span className="font-medium text-slate-900">{stats.period_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Evaluaciones:</span>
                    <span className="font-medium text-slate-900">{stats.total_evaluations}</span>
                  </div>
                  {stats.overdue_evaluations > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Evaluaciones Atrasadas:</span>
                      <span className="font-medium text-red-600">{stats.overdue_evaluations}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                No hay evaluaciones en este período
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                El departamento <span className="font-medium">{department.name}</span> no tiene evaluaciones 
                registradas en el período <span className="font-medium">{selectedPeriod?.name || 'seleccionado'}</span>.
              </p>
              {periods.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left max-w-md mx-auto">
                  <p className="text-xs text-blue-800">
                    💡 <span className="font-semibold">Sugerencia:</span> Prueba seleccionando otro período arriba 
                    o verifica si las evaluaciones han sido creadas para este departamento.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerReporteDepartamentoModal;