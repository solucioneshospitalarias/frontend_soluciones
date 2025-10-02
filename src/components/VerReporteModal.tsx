import React, { useState, useEffect } from 'react';
import { Eye, X, AlertCircle, Loader } from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import type { EvaluacionParaCalificarDTO } from '../types/evaluation';

interface VerReporteModalProps {
  show: boolean;
  evaluationId: number | null;
  onClose: () => void;
}

const VerReporteModal: React.FC<VerReporteModalProps> = ({ show, evaluationId, onClose }) => {
  const [evaluation, setEvaluation] = useState<EvaluacionParaCalificarDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && evaluationId) {
      loadReportData();
    }
  }, [show, evaluationId]);

  const loadReportData = async (): Promise<void> => {
    if (!evaluationId) return;

    setLoading(true);
    setError(null);

    try {
      // Assume a service method to fetch the completed evaluation report
      const data = await servicioEvaluaciones.obtenerEvaluacionParaCalificar(evaluationId); // Reuse or create new service method
      setEvaluation(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setEvaluation(null);
    setError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Reporte de Evaluación</h2>
                {evaluation && (
                  <p className="text-green-100 text-sm">
                    {evaluation.employee.first_name} {evaluation.employee.last_name} • {evaluation.period.name}
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white p-2" title="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Cargando reporte...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {evaluation && !loading && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Resumen del Reporte</h3>
                <p className="text-gray-600">Puntuación total: {evaluation.weighted_score}</p>
                {/* Add more report details here, e.g., charts, scores per criterion */}
                <p className="text-gray-500 mt-4">Este es un placeholder para el reporte completo. Agrega lógica para mostrar puntuaciones, comentarios, etc.</p>
              </div>
              {/* Example section for scores */}
              {evaluation.scores.map((scoreItem) => (
                <div key={scoreItem.id} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <h4 className="font-medium text-gray-900">{scoreItem.criteria.name}</h4>
                  <p className="text-gray-600">Puntuación: {scoreItem.score}/5</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              title="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerReporteModal;