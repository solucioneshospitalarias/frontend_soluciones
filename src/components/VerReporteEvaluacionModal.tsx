import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Download } from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion, exportarReporteEvaluacion } from '../services/evaluationService';
import { 
  formatNumber, 
  formatPercentage, 
  getPerformanceLevel, 
  getProgressBarColor
} from '../utils/numberFormatting';
import type { EvaluacionParaCalificarDTO, ResumenEvaluacionDTO } from '../types/evaluation';

interface VerReporteEvaluacionModalProps {
  show: boolean;
  evaluationId: number | null;
  onClose: () => void;
  evaluation?: ResumenEvaluacionDTO | null; 
}

const VerReporteEvaluacionModal: React.FC<VerReporteEvaluacionModalProps> = ({
  show,
  evaluationId,
  onClose,
  evaluation,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedEvaluation, setDetailedEvaluation] = useState<EvaluacionParaCalificarDTO | null>(null);
  const [exportingReport, setExportingReport] = useState(false);

  useEffect(() => {
    if (show && evaluationId) {
      loadEvaluationData();
    }
  }, [show, evaluationId]);

  const loadEvaluationData = async (): Promise<void> => {
    if (!evaluationId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await servicioEvaluaciones.obtenerEvaluacionParaCalificar(evaluationId);
      
      if (data.scores) {
        const totalWeight = data.scores.reduce((sum, s) => sum + s.weight, 0);
        console.log('🔍 Suma total de pesos:', totalWeight);
      }
      
      setDetailedEvaluation(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al cargar el reporte de evaluación';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!evaluationId) {
      setError('No se proporcionó un ID de evaluación');
      return;
    }
    
    setExportingReport(true);
    setError(null);
    try {
      console.log('🔄 Exportando reporte de evaluación ID:', evaluationId);
      const employeeName = evaluation 
        ? evaluation.employee_name 
        : detailedEvaluation 
          ? `${detailedEvaluation.employee.first_name} ${detailedEvaluation.employee.last_name}` 
          : `evaluacion_${evaluationId}`;
      const periodName = evaluation 
        ? evaluation.period_name 
        : detailedEvaluation 
          ? detailedEvaluation.period.name 
          : '';
      await exportarReporteEvaluacion(evaluationId, employeeName, periodName);
      console.log('✅ Reporte exportado correctamente');
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al exportar el reporte de evaluación';
      setError(mensaje);
      console.error('❌ Error exportando reporte:', err);
    } finally {
      setExportingReport(false);
    }
  };

  const handleClose = () => {
    setDetailedEvaluation(null);
    setError(null);
    onClose();
  };

  if (!show) return null;

  const performancePercentage =
    detailedEvaluation?.performance_percentage ??
    detailedEvaluation?.weighted_score ??
    0
  ;

  const performanceStyle = getPerformanceLevel(performancePercentage);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {detailedEvaluation ? `${detailedEvaluation.employee.first_name} ${detailedEvaluation.employee.last_name}` : 'Reporte de Evaluación'}
              </h2>
              {detailedEvaluation && (
                <div className="flex justify-center items-center gap-4 text-sm opacity-90">
                  <span>{detailedEvaluation.employee.position}</span>
                  <span>•</span>
                  <span>{detailedEvaluation.period.name}</span>
                  <span>•</span>
                  <span>Evaluador: {detailedEvaluation.evaluator.first_name} {detailedEvaluation.evaluator.last_name}</span>
                  <span>•</span>
                  <span>{detailedEvaluation.completed_at ? new Date(detailedEvaluation.completed_at).toLocaleDateString('es-ES') : 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleExportReport}
                disabled={exportingReport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
              <span className="ml-3 text-gray-600">Cargando reporte...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {detailedEvaluation && (
            <div className="grid grid-cols-4 gap-6">
              
              {/* Score Principal */}
              <div className="col-span-1">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-slate-700 mb-2">
                    {formatNumber(performancePercentage, 1)}%
                  </div>
                  <div className="text-sm text-slate-500 mb-3">Puntaje Final</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${performanceStyle.bgColorClass} ${performanceStyle.textColorClass}`}>
                    {detailedEvaluation.performance_level ?? performanceStyle.text}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-lg font-semibold text-slate-600">
                      {formatNumber(
                        detailedEvaluation.scores ? 
                        detailedEvaluation.scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / detailedEvaluation.scores.length : 
                        0, 
                        1
                      )}
                    </div>
                    <div className="text-xs text-slate-500">Promedio (1-100)</div>
                  </div>
                </div>
              </div>

              {/* Criterios agrupados por categoría */}
              <div className="col-span-3">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Desglose por Criterios</h3>
                
                {/* Agrupar criterios por categoría */}
                {(() => {
                  const groupedCriteria = detailedEvaluation.scores?.reduce((groups, scoreItem) => {
                    const category = scoreItem.criteria.category || 'otros';
                    if (!groups[category]) groups[category] = [];
                    groups[category].push(scoreItem);
                    return groups;
                  }, {} as Record<string, typeof detailedEvaluation.scores>);

                  const categoryNames = {
                    'productividad': 'Productividad',
                    'conducta_laboral': 'Conducta Laboral', 
                    'habilidades': 'Habilidades',
                    'seguridad_trabajo': 'Seguridad y salud en el Trabajo',
                    'otros': 'Otros'
                  };

                  return Object.entries(groupedCriteria || {}).map(([category, scores]) => (
                    <div key={category} className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-300 bg-white -mx-4 px-4 -mt-4 pt-3 rounded-t-lg">
                        {categoryNames[category as keyof typeof categoryNames] || category}
                        <span className="ml-2 text-xs text-slate-400 font-normal">
                          ({scores?.length} criterio{(scores?.length || 0) !== 1 ? 's' : ''})
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {scores?.map((scoreItem) => {
                          const individualScorePercentage = (scoreItem.score ?? 0);
                          const totalWeight = detailedEvaluation.scores?.reduce((sum, s) => sum + s.weight, 0) ?? 100;
                          const normalizedWeight = totalWeight > 100 ? (scoreItem.weight / totalWeight) * 100 : scoreItem.weight;
                          const normalizedContribution = totalWeight > 100 ? 
                            ((scoreItem.score ?? 0) / 100) * normalizedWeight : (scoreItem.contribution_points ?? scoreItem.weighted_score ?? 0);
                          
                          return (
                            <div key={scoreItem.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                              {/* Header del criterio */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-slate-700 text-sm leading-tight">{scoreItem.criteria.name}</h5>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Peso: {formatPercentage(normalizedWeight, true, 1)}
                                  </div>
                                </div>
                                <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded ml-2">
                                  {formatNumber(individualScorePercentage, 0)}%
                                </div>
                              </div>
                              
                              {/* Estrellas */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-1">
                                  {[20, 40, 60, 80, 100].map((threshold) => (
                                    <span
                                      key={threshold}
                                      className={`text-sm ${(scoreItem.score ?? 0) >= threshold ? 'text-yellow-500' : 'text-slate-300'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {formatNumber(normalizedContribution, 1)}/{formatNumber(normalizedWeight, 0)} pts
                                </div>
                              </div>
                              
                              {/* Barra de progreso */}
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(individualScorePercentage)}`}
                                  style={{ width: `${Math.min(individualScorePercentage, 100)}%` }}
                                ></div>
                              </div>
                              
                              {/* Comentarios (si existen) */}
                              {scoreItem.comments && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <p className="text-xs text-slate-600 italic">"{scoreItem.comments}"</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Solo Comentarios Generales */}
              {detailedEvaluation.general_comments && (
                <div className="col-span-4 mt-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 mb-2 text-sm">Comentarios Generales</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {detailedEvaluation.general_comments}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerReporteEvaluacionModal;