import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Calendar, FileCheck, TrendingUp, CheckCircle, Clock, Download, Award } from 'lucide-react';
import servicioEvaluaciones, { exportarReporteEvaluacion, ErrorEvaluacion } from '../services/evaluationService';
import { formatPercentage, formatNumber, getPerformanceLevel } from '../utils/numberFormatting';
import type { EvaluacionParaCalificarDTO, RespuestaPuntuacionDTO } from '../types/evaluation';

interface VerEvaluacionModalProps {
  show: boolean;
  onClose: () => void;
  evaluationId: number | null;
}

const VerEvaluacionModal: React.FC<VerEvaluacionModalProps> = ({
  show,
  onClose,
  evaluationId,
}) => {
  const [evaluation, setEvaluation] = useState<EvaluacionParaCalificarDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingReport, setExportingReport] = useState(false);

  useEffect(() => {
    if (show && evaluationId) {
      loadEvaluation();
    }
  }, [show, evaluationId]);

  const loadEvaluation = async () => {
    if (!evaluationId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await servicioEvaluaciones.obtenerEvaluacionParaCalificar(evaluationId);
      setEvaluation(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar la evaluación';
      
      if (message.includes('No autorizado') || message.includes('403')) {
        setError('Esta evaluación no está disponible. Puede estar vencida o no tienes permisos para verla.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!evaluationId || !evaluation) return;
    
    setExportingReport(true);
    setError(null);
    
    try {
      const employeeName = `${evaluation.employee.first_name} ${evaluation.employee.last_name}`;
      const periodName = evaluation.period.name;
      await exportarReporteEvaluacion(evaluationId, employeeName, periodName);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al exportar el reporte de evaluación';
      setError(mensaje);
    } finally {
      setExportingReport(false);
    }
  };

  const handleClose = () => {
    setEvaluation(null);
    setError(null);
    onClose();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      productividad: 'bg-blue-50 text-blue-700 border-blue-200',
      conducta_laboral: 'bg-green-50 text-green-700 border-green-200',
      habilidades: 'bg-purple-50 text-purple-700 border-purple-200',
      seguridad_trabajo: 'bg-red-50 text-red-700 border-red-200',
    };
    return category ? (colors[category] || 'bg-gray-50 text-gray-700 border-gray-200') : 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getCategoryLabel = (category?: string): string => {
    const labels: Record<string, string> = {
      productividad: 'Productividad',
      conducta_laboral: 'Conducta Laboral',
      habilidades: 'Habilidades',
      seguridad_trabajo: 'Seguridad y salud en el Trabajo',
    };
    return category ? (labels[category] || category) : 'Sin categoría';
  };

  const groupCriteriaByCategory = () => {
    if (!evaluation || !evaluation.scores) return {};

    const grouped: Record<string, RespuestaPuntuacionDTO[]> = {};

    evaluation.scores.forEach((score) => {
      const category = score.criteria.category || 'otros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(score);
    });

    return grouped;
  };

  // Calcular puntaje final (solo si está completada)
  const calculatePerformanceScore = (): number => {
    if (!evaluation || !evaluation.scores) return 0;

    // Si el backend ya lo calculó, usarlo
    if (evaluation.performance_percentage !== undefined && evaluation.performance_percentage !== null) {
      const val = evaluation.performance_percentage;
      // Si viene en 0–1 o 0–5, ajustamos
      return val <= 1 ? val * 100 : val <= 5 ? (val / 5) * 100 : val;
    }

    // Calcular manualmente
    const totalWeight = evaluation.scores.reduce((sum, s) => sum + s.weight, 0);
    
    if (totalWeight > 100) {
      // Normalizar pesos si suman más de 100
      return evaluation.scores.reduce((sum, score) => {
        const normalizedWeight = (score.weight / totalWeight) * 100;
        return sum + (score.score ?? 0) * (normalizedWeight / 100);
      }, 0);
    } else {
      return evaluation.scores.reduce((sum, score) => {
        return sum + (score.score ?? 0) * (score.weight / 100);
      }, 0);
    }
  };

  const isCompleted = evaluation?.status === 'completed' || evaluation?.status === 'realizada';
  const isOverdue = evaluation?.status === 'overdue' || evaluation?.status === 'atrasada';
  const performanceScore = isCompleted ? calculatePerformanceScore() : 0;
  const performanceStyle = getPerformanceLevel(performanceScore);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalles de Evaluación</h2>
              <p className="text-sm text-gray-500">Vista completa de la evaluación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón Exportar (solo si está completada) */}
            {isCompleted && (
              <button
                onClick={handleExportReport}
                disabled={exportingReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {exportingReport ? (
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
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Cargando evaluación...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-3">Evaluación No Disponible</h3>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium text-base leading-relaxed">
                    {error}
                  </p>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Posibles razones:</p>
                  <ul className="list-disc list-inside text-left space-y-1">
                    <li>La evaluación ya venció su plazo</li>
                    <li>No tienes permisos para acceder a ella</li>
                    <li>El período de evaluación ha finalizado</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : evaluation ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">Evaluación Completada</span>
                    </>
                  ) : isOverdue ? (
                    <>
                      <Clock className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">Evaluación Vencida - No se puede calificar</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-600 font-medium">Pendiente de Calificar</span>
                    </>
                  )}
                </div>
              </div>

              {/* Puntaje Final (solo si está completada) */}
              {isCompleted && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Puntaje Final</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-gray-900">
                            {formatNumber(performanceScore, 1)}%
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${performanceStyle.bgColorClass} ${performanceStyle.textColorClass}`}>
                            {performanceStyle.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-16 w-px bg-gray-300"></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          evaluation.scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / evaluation.scores.length,
                          1
                        )}<span className="text-lg text-gray-500">/100</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Employee Card */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900 text-sm">Empleado Evaluado</h3>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {evaluation.employee.first_name} {evaluation.employee.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{evaluation.employee.position}</p>
                  <p className="text-xs text-gray-500">{evaluation.employee.email}</p>
                </div>

                {/* Evaluator Card */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900 text-sm">Evaluador</h3>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {evaluation.evaluator.first_name} {evaluation.evaluator.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Responsable de evaluación</p>
                </div>

                {/* Period Card */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900 text-sm">Período</h3>
                  </div>
                  <p className="font-semibold text-gray-900">{evaluation.period.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Inicia: {formatDate(evaluation.period.start_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Vence: {formatDate(evaluation.period.due_date)}
                  </p>
                </div>
              </div>

              {/* Criteria by Category */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Criterios de Evaluación</h3>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupCriteriaByCategory()).map(([category, scores]) => {
                    if (scores.length === 0) return null;

                    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className={`px-4 py-3 ${getCategoryColor(category)} border-b`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{getCategoryLabel(category)}</h4>
                            <span className="text-xs font-medium">
                              {scores.length} criterio{scores.length !== 1 ? 's' : ''} • {formatPercentage(totalWeight, false, 1)}%
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                          {scores.map((scoreItem) => (
                            <div key={scoreItem.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 text-sm mb-1">
                                    {scoreItem.criteria.name}
                                  </h5>
                                  <p className="text-xs text-gray-600">
                                    {scoreItem.criteria.description}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 ml-4">
                                  <span className="px-2 py-1 bg-gray-200 rounded text-xs font-medium whitespace-nowrap">
                                    {formatPercentage(scoreItem.weight, true, 1)}
                                  </span>
                                  {scoreItem.score !== undefined && scoreItem.score !== null && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                      {scoreItem.score}/100
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Criterios</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {evaluation.scores.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Categorías</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Object.values(groupCriteriaByCategory()).filter(scores => scores.length > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Estado</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {isCompleted ? 'Completada' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerEvaluacionModal;