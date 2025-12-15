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
    const validScore = Math.min(Math.max(Math.round(score), 0), 100);
    setScores((prev) => ({ ...prev, [assignedCriteriaId]: validScore }));
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
      case 'seguridad_trabajo':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getScoreLabel = (score: number): string => {
    if (score < 60) return 'Deficiente';
    if (score < 80) return 'Necesita Mejora';
    if (score < 95) return 'Buen Desempeño';
    return 'Excelente';
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
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-1 text-slate-200 text-sm">
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

                  {/* Encabezado + Bloque de Rangos */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

                      {/* Encabezado limitado */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-6 h-6 bg-slate-100 rounded text-slate-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {scoreItem.criteria.name}
                          </h3>

                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(
                              scoreItem.criteria.category
                            )}`}
                          >
                            {scoreItem.criteria.category === "productividad"
                              ? "Productividad"
                              : scoreItem.criteria.category === "conducta_laboral"
                              ? "Conducta Laboral"
                              : scoreItem.criteria.category === "habilidades"
                              ? "Habilidades"
                              : scoreItem.criteria.category === "seguridad_trabajo"
                              ? "Seguridad y Salud en el Trabajo"
                              : "Sin Categoría"}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">
                          {scoreItem.criteria.description}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Award className="w-4 h-4 text-slate-600" />
                          <span className="text-sm text-slate-600">
                            Peso: {formatPercentage(scoreItem.weight, true, 0)}
                          </span>

                          {scores[scoreItem.id] > 0 && (
                            <div className="ml-auto flex items-center gap-2">
                              <span className="text-lg font-bold text-slate-700">
                                {scores[scoreItem.id]}/100
                              </span>
                              <span className="text-xs text-slate-500">
                                {getScoreLabel(scores[scoreItem.id])}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bloque de Rangos */}
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                        <p className="font-semibold text-slate-800 mb-2">Rangos de evaluación</p>

                        <ul className="space-y-1">
                          <li className="flex justify-between">
                            <span>1 – 60</span>
                            <span className="text-red-600 font-medium">Deficiente</span>
                          </li>
                          <li className="flex justify-between">
                            <span>61 – 80</span>
                            <span className="text-orange-600 font-medium">Necesita Mejora</span>
                          </li>
                          <li className="flex justify-between">
                            <span>81 - 95</span>
                            <span className="text-yellow-600 font-medium">Buen Desempeño</span>
                          </li>
                          <li className="flex justify-between">
                            <span>96 – 100</span>
                            <span className="text-green-600 font-medium">Excelente</span>
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>

                  {/* Slider + Inputs + Comentarios */}
                  <div className="p-5">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">Calificación</span>

                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={scores[scoreItem.id] || ""}
                          onChange={(e) => {
                            const value =
                              e.target.value === "" ? 0 : parseInt(e.target.value);
                            handleScoreChange(scoreItem.id, value);
                          }}
                          placeholder="0"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold text-gray-800 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={scores[scoreItem.id] || 0}
                          onChange={(e) =>
                            handleScoreChange(scoreItem.id, parseInt(e.target.value))
                          }
                          className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-custom"
                          style={{
                            background: `
                              linear-gradient(to right,
                                ${
                                  scores[scoreItem.id] <= 60
                                    ? "#dc2626"
                                    : scores[scoreItem.id] <= 80
                                    ? "#f59e0b"
                                    : scores[scoreItem.id] <= 95
                                    ? "#fde047"
                                    : "#22c55e"
                                } 0%,
                                ${
                                  scores[scoreItem.id] <= 60
                                    ? "#dc2626"
                                    : scores[scoreItem.id] <= 80
                                    ? "#f59e0b"
                                    : scores[scoreItem.id] <= 95
                                    ? "#fde047"
                                    : "#22c55e"
                                } ${scores[scoreItem.id]}%,
                                #e5e7eb ${scores[scoreItem.id]}%,
                                #e5e7eb 100%
                              )
                            `,
                          }}
                        />

                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span>0</span>
                          <span>25</span>
                          <span>50</span>
                          <span>75</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Comentarios (Opcional)
                      </label>
                      <textarea
                        value={comments[scoreItem.id] || ""}
                        onChange={(e) =>
                          handleCommentChange(scoreItem.id, e.target.value)
                        }
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Estado de la evaluación */}
              <div className="flex items-center gap-2 text-center sm:text-left justify-center sm:justify-start">
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

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete() || submitting}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
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