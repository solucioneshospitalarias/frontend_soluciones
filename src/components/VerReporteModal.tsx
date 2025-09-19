import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import { 
  formatNumber, 
  formatPercentage, 
  getPerformanceLevel, 
  getProgressBarColor,
  generateRecommendation
} from '../utils/numberFormatting';
import type { EvaluacionParaCalificarDTO } from '../types/evaluation';

interface VerReporteEvaluacionModalProps {
  show: boolean;
  evaluationId: number | null;
  onClose: () => void;
}

const VerReporteEvaluacionModal: React.FC<VerReporteEvaluacionModalProps> = ({
  show,
  evaluationId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluacionParaCalificarDTO | null>(null);

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
      console.log('📋 Evaluation report data:', JSON.stringify(data, null, 2));
      setEvaluation(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al cargar el reporte de evaluación';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEvaluation(null);
    setError(null);
    onClose();
  };

  if (!show) return null;

  // Calcular áreas débiles para recomendaciones
  const weakAreas = evaluation?.scores
    ?.filter(score => ((score.score ?? 0) / 5) * 100 < 60)
    ?.map(score => score.criteria.name) ?? [];

  const performancePercentage = evaluation?.performance_percentage ?? evaluation?.weighted_score ?? 0;
  const performanceStyle = getPerformanceLevel(performancePercentage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reporte de Evaluación</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

          {evaluation && (
            <div className="space-y-6">
              {/* Información del empleado */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Empleado</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Nombre:</span> {evaluation.employee.first_name} {evaluation.employee.last_name}</p>
                      <p><span className="font-medium">Cargo:</span> {evaluation.employee.position}</p>
                      <p><span className="font-medium">Email:</span> {evaluation.employee.email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Evaluación</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Evaluador:</span> {evaluation.evaluator.first_name} {evaluation.evaluator.last_name}</p>
                      <p><span className="font-medium">Período:</span> {evaluation.period.name}</p>
                      <p><span className="font-medium">Completada:</span> {evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Puntuación Mejorado */}
              <div className={`rounded-xl p-6 border ${performanceStyle.bgColorClass} ${performanceStyle.borderColorClass}`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Resumen de Evaluación</h3>
                
                {/* Score Principal */}
                <div className={`bg-gradient-to-r ${performanceStyle.gradient} rounded-lg p-6 text-white mb-6`}>
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">
                        {formatNumber(performancePercentage, 1)}%
                      </div>
                      <div className="text-lg opacity-90">Puntaje Final</div>
                      <div className="text-sm opacity-75">
                        {formatNumber(performancePercentage, 1)}/100 puntos
                      </div>
                    </div>
                    
                    <div className="h-16 w-px bg-white opacity-30"></div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {formatNumber(
                          evaluation.scores ? 
                          evaluation.scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / evaluation.scores.length : 
                          0, 
                          1
                        )}
                      </div>
                      <div className="text-lg opacity-90">Promedio</div>
                      <div className="text-sm opacity-75">Escala 1-5</div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <div className="inline-block bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                      <span className="text-lg font-semibold">
                        {evaluation.performance_level ?? performanceStyle.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Desglose por Criterios */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Desglose por Criterios</h4>
                  {evaluation.scores?.map((scoreItem) => {
                    const scorePercentage = scoreItem.score_percentage ?? ((scoreItem.score ?? 0) / 5) * 100;
                    const contributionPoints = scoreItem.contribution_points ?? scoreItem.weighted_score ?? 0;
                    const maxPoints = scoreItem.max_possible_points ?? scoreItem.weight;
                    
                    return (
                      <div key={scoreItem.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{scoreItem.criteria.name}</h5>
                            <p className="text-sm text-gray-500 mt-1">
                              Peso: {formatPercentage(scoreItem.weight, true, 1)} del total
                            </p>
                          </div>
                          
                          <div className="text-right min-w-32">
                            {/* Estrellas */}
                            <div className="flex justify-end gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= (scoreItem.score ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            
                            {/* Porcentaje del criterio */}
                            <div className="text-lg font-bold text-gray-700 mb-1">
                              {formatNumber(scorePercentage, 0)}%
                            </div>
                            
                            {/* Contribución al total */}
                            <div className="text-sm text-gray-500">
                              {formatNumber(contributionPoints, 1)}/{formatNumber(maxPoints, 0)} pts
                            </div>
                          </div>
                        </div>
                        
                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full ${getProgressBarColor(scorePercentage)}`}
                            style={{ width: `${Math.min(scorePercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        {/* Comentarios y evidencia */}
                        {(scoreItem.comments || scoreItem.evidence) && (
                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            {scoreItem.comments && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Comentarios:</span> {scoreItem.comments}
                              </p>
                            )}
                            {scoreItem.evidence && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Evidencia:</span> {scoreItem.evidence}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Comentarios Generales */}
                {evaluation.general_comments && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Comentarios Generales</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {evaluation.general_comments}
                    </p>
                  </div>
                )}
                
                {/* Recomendaciones */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Recomendaciones</h4>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-blue-700">
                      {generateRecommendation(performancePercentage, weakAreas)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerReporteEvaluacionModal;