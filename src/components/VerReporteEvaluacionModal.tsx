import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Download } from 'lucide-react';
import { evaluationService, ErrorEvaluacion } from '../services/evaluationService';
import { 
  formatNumber, 
  getPerformanceLevel
} from '../utils/numberFormatting';
import type { ResumenEvaluacionDTO } from '../types/evaluation';

// Extend ResumenEvaluacionDTO with minimal optional fields
interface ExtendedEvaluacionDTO extends ResumenEvaluacionDTO {
  weighted_score?: number;
  performance_percentage?: number;
  performance_level?: string;
  general_comments?: string;
  completed_at?: string;
}

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
  const [evaluation, setEvaluation] = useState<ExtendedEvaluacionDTO | null>(null);

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
      // Fetch completed evaluations
      const evaluations = await evaluationService.getEvaluations('completed');
      const targetEval = evaluations.find(e => e.id === evaluationId);
      
      if (!targetEval) {
        throw new ErrorEvaluacion('Evaluación no encontrada');
      }
      
      setEvaluation(targetEval as ExtendedEvaluacionDTO);
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

  // Calculate performance percentage
  const calculatePerformancePercentage = (evalData: ExtendedEvaluacionDTO): number => {
    return evalData.performance_percentage ?? evalData.weighted_score ?? 0;
  };

  const performancePercentage = evaluation ? calculatePerformancePercentage(evaluation) : 0;
  const performanceStyle = getPerformanceLevel(performancePercentage);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {evaluation ? evaluation.employee_name : 'Reporte de Evaluación'}
              </h2>
              {evaluation && (
                <div className="flex justify-center items-center gap-4 text-sm opacity-90">
                  <span>N/A</span>
                  <span>•</span>
                  <span>{evaluation.period_name}</span>
                  <span>•</span>
                  <span>Evaluador: {evaluation.evaluator_name}</span>
                  <span>•</span>
                  <span>{evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleDateString('es-ES') : 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                disabled // Placeholder: export functionality not implemented
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed flex items-center gap-2"
                title="Exportación no disponible"
              >
                <Download className="w-4 h-4" />
                Exportar
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

          {evaluation && (
            <div className="grid grid-cols-4 gap-6">
              
              {/* Score Principal */}
              <div className="col-span-1">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-slate-700 mb-2">
                    {formatNumber(performancePercentage, 1)}%
                  </div>
                  <div className="text-sm text-slate-500 mb-3">Puntaje Final</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${performanceStyle.bgColorClass} ${performanceStyle.textColorClass}`}>
                    {evaluation.performance_level ?? performanceStyle.text}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-lg font-semibold text-slate-600">
                      {formatNumber(evaluation.weighted_score ?? 0, 1)}
                    </div>
                    <div className="text-xs text-slate-500">Promedio (1-5)</div>
                  </div>
                </div>
              </div>

              {/* Criterios agrupados por categoría */}
              <div className="col-span-3">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Desglose por Criterios</h3>
                <div className="text-gray-500 text-center py-4">
                  No hay datos de criterios disponibles
                </div>
              </div>

              {/* Solo Comentarios Generales */}
              {evaluation?.general_comments && (
                <div className="col-span-4 mt-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 mb-2 text-sm">Comentarios Generales</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {evaluation.general_comments}
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