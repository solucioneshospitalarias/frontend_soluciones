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
  TrendingUp,
} from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
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
    if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (category) {
      case 'productividad':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'conducta_laboral':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'habilidades':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreLabel = (score: number) => {
    const labels = {
      1: 'Necesita Mejora',
      2: 'Por Debajo del Promedio',
      3: 'Promedio',
      4: 'Bueno',
      5: 'Excelente',
    };
    return labels[score as keyof typeof labels] || '';
  };

  const getScoreColor = (score: number, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-300 bg-white hover:border-gray-400';
    
    const colors = {
      1: 'border-red-400 bg-red-50 shadow-red-100',
      2: 'border-orange-400 bg-orange-50 shadow-orange-100',
      3: 'border-yellow-400 bg-yellow-50 shadow-yellow-100',
      4: 'border-blue-400 bg-blue-50 shadow-blue-100',
      5: 'border-green-400 bg-green-50 shadow-green-100',
    };
    return colors[score as keyof typeof colors] || '';
  };

  if (!show) return null;

  const completedScores = evaluation ? evaluation.scores.filter((item) => scores[item.id] > 0).length : 0;
  const progressPercentage = evaluation ? (completedScores / evaluation.scores.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Realizar Evaluación</h2>
                {evaluation && (
                  <div className="flex items-center gap-4 mt-2 text-white/90">
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
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/90 font-medium">Progreso de Evaluación</span>
              <span className="text-white font-semibold">{completedScores} / {evaluation?.scores.length || 0}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
                <p className="text-gray-600 text-lg">Cargando evaluación...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6 flex items-center gap-4 mb-8">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-semibold">Error al cargar la evaluación</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {evaluation && !loading && (
            <div className="space-y-8">
              {evaluation.scores.map((scoreItem, index) => (
                <div key={scoreItem.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Criterio Header */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-sm">{index + 1}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{scoreItem.criteria.name}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(scoreItem.criteria.category)}`}>
                            {scoreItem.criteria.category === 'productividad' ? 'Productividad' :
                             scoreItem.criteria.category === 'conducta_laboral' ? 'Conducta Laboral' :
                             scoreItem.criteria.category === 'habilidades' ? 'Habilidades' :
                             'Sin Categoría'}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-3">{scoreItem.criteria.description}</p>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-indigo-600">Peso: {scoreItem.weight}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">Calificación</span>
                        {scores[scoreItem.id] > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            <span className="text-indigo-600 font-bold">{scores[scoreItem.id]}/5</span>
                            <span className="text-indigo-600 text-sm">- {getScoreLabel(scores[scoreItem.id])}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleScoreChange(scoreItem.id, rating)}
                            className={`relative group p-4 border-2 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${getScoreColor(rating, scores[scoreItem.id] === rating)}`}
                          >
                            <div className="text-center">
                              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${scores[scoreItem.id] === rating ? 'bg-white shadow-md text-gray-800' : 'bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-md'}`}>
                                {rating}
                              </div>
                              <div className={`text-xs font-medium transition-colors ${scores[scoreItem.id] === rating ? 'text-gray-800' : 'text-gray-500'}`}>
                                {getScoreLabel(rating)}
                              </div>
                            </div>
                            {scores[scoreItem.id] === rating && (
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Comentarios y Observaciones (Opcional)
                      </label>
                      <textarea
                        value={comments[scoreItem.id] || ''}
                        onChange={(e) => handleCommentChange(scoreItem.id, e.target.value)}
                        placeholder={`Escribe observaciones específicas sobre ${scoreItem.criteria.name.toLowerCase()}...`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                        rows={3}
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
          <div className="border-t border-gray-200 p-8 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isComplete() ? (
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Evaluación completa y lista para enviar</span>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <span className="font-medium">Faltan {evaluation.scores.length - completedScores} criterios por calificar</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete() || submitting}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando Evaluación...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Completar Evaluación
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