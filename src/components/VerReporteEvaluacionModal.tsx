import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
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
                  <div key={scoreItem.id} className="border-b border-gray-200 pb-4">
                    <p className="font-medium text-gray-900">{scoreItem.criteria.name}</p>
                    <p className="text-sm text-gray-600">{scoreItem.criteria.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Puntuación:</strong> {scoreItem.score} / 5</p>
                      <p><strong>Peso:</strong> {scoreItem.weight}%</p>
                      <p><strong>Puntuación Ponderada:</strong> {scoreItem.weighted_score}</p>
                      {scoreItem.comments && <p><strong>Comentarios:</strong> {scoreItem.comments}</p>}
                      {scoreItem.evidence && <p><strong>Evidencia:</strong> {scoreItem.evidence}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumen</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Puntaje Total:</strong> {evaluation.total_score}</p>
                <p><strong>Puntaje Ponderado:</strong> {evaluation.weighted_score}</p>
                {evaluation.general_comments && (
                  <p><strong>Comentarios Generales:</strong> {evaluation.general_comments}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerReporteEvaluacionModal;