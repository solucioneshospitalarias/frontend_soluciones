import React, { useState, useEffect } from 'react';
import {
  Play,
  X,
  AlertCircle,
  Loader2,
  Target,
  CheckCircle,
  User,
  Calendar,
  Award,
} from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import { roundTo, formatPercentage } from '../utils/numberFormatting'; 
import type { EvaluacionParaCalificarDTO } from '../types/evaluation';

interface RealizarEvaluacionModalProps {
  show: boolean;
  evaluationId: number | null;
  onClose: () => void;
  onComplete: () => void;
}

const RealizarEvaluacionModal: React.FC<RealizarEvaluacionModalProps> = ({
  show,
  evaluationId,
  onClose,
  onComplete,
}) => {
  const [evaluation, setEvaluation] = useState<EvaluacionParaCalificarDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

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
      setEvaluation(data);
      
      const initialScores: Record<number, number> = {};
      data.scores.forEach((scoreItem) => {
        initialScores[scoreItem.id] = scoreItem.score || 0;
      });
      setScores(initialScores);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (assignedCriteriaId: number, score: number): void => {
    setScores((prev) => ({ ...prev, [assignedCriteriaId]: score }));
  };

  const handleCommentChange = (assignedCriteriaId: number, comment: string): void => {
    setComments((prev) => ({ ...prev, [assignedCriteriaId]: comment }));
  };

  const isComplete = (): boolean => {
    if (!evaluation) return false;
    return evaluation.scores.every((scoreItem) => scores[scoreItem.id] > 0);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!evaluation || !isComplete()) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const scoresPayload = evaluation.scores.map((scoreItem) => ({
        assigned_criteria_id: scoreItem.id,
        score: scores[scoreItem.id],
      }));

      await servicioEvaluaciones.enviarPuntuaciones(evaluation.id, scoresPayload);
      onComplete();
      handleClose();
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error desconocido';
      setError(mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setEvaluation(null);
    setScores({});
    setComments({});
    setError(null);
    onClose();
  };

  const getCategoryColor = (category: string | undefined): string => {
    if (!category) return 'bg-gray-100 text-gray-700 border-gray-300';
    switch (category) {
      case 'productividad':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'conducta_laboral':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'habilidades':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getScoreLabel = (score: number) => {
    const labels = {
      1: 'Necesita Mejora',
      2: 'Por Debajo',
      3: 'Promedio',
      4: 'Bueno',
      5: 'Excelente',
    };
    return labels[score as keyof typeof labels] || '';
  };

  const getScoreColor = (score: number, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50';
    
    const colors = {
      1: 'border-red-500 bg-red-50',
      2: 'border-orange-500 bg-orange-50',
      3: 'border-yellow-500 bg-yellow-50',
      4: 'border-blue-500 bg-blue-50',
      5: 'border-green-500 bg-green-50',
    };
    return colors[score as keyof typeof colors] || '';
  };

  if (!show) return null;

  const completedScores = evaluation ? evaluation.scores.filter((item) => scores[item.id] > 0).length : 0;
  const progressPercentage = evaluation ? roundTo((completedScores / evaluation.scores.length) * 100, 2) : 0;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-slate-700 text-white p-6 border-b border-slate-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Realizar Evaluación</h2>
                {evaluation && (
                  <div className="flex items-center gap-4 mt-1 text-slate-200 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{evaluation.employee.first_name} {evaluation.employee.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{evaluation.period.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-200 text-sm">Progreso</span>
              <span className="text-white font-medium text-sm">{completedScores} / {evaluation?.scores.length || 0}</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-600" />
                <p className="text-gray-600">Cargando evaluación...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error al cargar la evaluación</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {evaluation && !loading && (
            <div className="space-y-6">
              {evaluation.scores.map((scoreItem, index) => (
                <div key={scoreItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  
                  {/* Criterio Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-6 h-6 bg-slate-100 rounded text-slate-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{scoreItem.criteria.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(scoreItem.criteria.category)}`}>
                            {scoreItem.criteria.category === 'productividad' ? 'Productividad' :
                             scoreItem.criteria.category === 'conducta_laboral' ? 'Conducta Laboral' :
                             scoreItem.criteria.category === 'habilidades' ? 'Habilidades' :
                             'Sin Categoría'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-2">{scoreItem.criteria.description}</p>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-600" />
                          {/* ✅ CAMBIO PRINCIPAL: Formatear el peso con 1 decimal */}
                          <span className="text-sm text-slate-600">
                            Peso: {formatPercentage(scoreItem.weight, true, 1)}
                          </span>
                        </div>
                      </div>
                      {scores[scoreItem.id] > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-700">{scores[scoreItem.id]}/5</div>
                          <div className="text-xs text-slate-500">{getScoreLabel(scores[scoreItem.id])}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="p-5">
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-900 mb-3 block">Calificación</span>
                      <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleScoreChange(scoreItem.id, rating)}
                            className={`p-3 border rounded-lg transition-all duration-200 ${getScoreColor(rating, scores[scoreItem.id] === rating)}`}
                          >
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800 mb-1">{rating}</div>
                              <div className="text-xs text-gray-600">{getScoreLabel(rating)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Comentarios (Opcional)
                      </label>
                      <textarea
                        value={comments[scoreItem.id] || ''}
                        onChange={(e) => handleCommentChange(scoreItem.id, e.target.value)}
                        placeholder="Observaciones específicas..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {evaluation && !loading && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isComplete() ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Evaluación completa</span>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <span>Faltan {evaluation.scores.length - completedScores} criterios</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete() || submitting}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Completar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealizarEvaluacionModal;