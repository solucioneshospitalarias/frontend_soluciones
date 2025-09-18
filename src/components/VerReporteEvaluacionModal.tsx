import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import { formatNumber, formatPercentage } from '../utils/numberFormatting';
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
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (!show || !evaluationId) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reporte de Evaluación</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {evaluation && !loading && !error && (
          <div className="space-y-6">
            {/* Detalles de la Evaluación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detalles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Empleado:</strong> {evaluation.employee.first_name} {evaluation.employee.last_name}</p>
                  <p><strong>Email:</strong> {evaluation.employee.email}</p>
                  <p><strong>Cargo:</strong> {evaluation.employee.position || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Período:</strong> {evaluation.period.name}</p>
                  <p><strong>Estado:</strong> {evaluation.status}</p>
                  <p><strong>Completada:</strong> {evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Puntajes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Puntajes</h3>
              <div className="space-y-4">
                {evaluation.scores.map((scoreItem) => (
                  <div key={scoreItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{scoreItem.criteria.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{scoreItem.criteria.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Peso:</span>
                          <span className="font-semibold text-gray-700">
                            {formatPercentage(scoreItem.weight, true, 2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Puntuación</p>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${star <= (scoreItem.score ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 font-bold text-gray-700">{scoreItem.score ?? 0}/5</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Puntaje Ponderado</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatNumber(scoreItem.weighted_score ?? 0, 2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPercentage(scoreItem.weight, true, 2)} del total
                        </p>
                      </div>
                    </div>

                    {scoreItem.comments && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Comentarios:</span> {scoreItem.comments}
                        </p>
                      </div>
                    )}
                    
                    {scoreItem.evidence && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Evidencia:</span> {scoreItem.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Puntuación</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Puntaje Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatNumber(evaluation.weighted_score || 0, 2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Promedio</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(
                      evaluation.scores ? 
                      evaluation.scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / evaluation.scores.length : 
                      0, 
                      2
                    )}
                  </p>
                </div>
              </div>
              {evaluation.general_comments && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Comentarios Generales:</span> {evaluation.general_comments}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerReporteEvaluacionModal;