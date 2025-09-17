import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, AlertCircle, User, Calendar, Award } from 'lucide-react';

// Tipos basados en los DTOs del backend
interface EvaluationCriteriaDTO {
  id: number;
  name: string;
  description: string;
  weight: number;
  is_active: boolean;
}

interface EvaluationScoreResponseDTO {
  id: number;
  criteria_id: number;
  score?: number;
  weight: number;
  weighted_score?: number;
  comments?: string;
  evidence?: string;
  criteria: EvaluationCriteriaDTO;
}

interface UserBasicInfoDTO {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
}

interface EvaluationPeriodDTO {
  id: number;
  name: string;
  description: string;
  start_date: string;
  due_date: string;
  is_active: boolean;
}

interface EvaluationResponseDTO {
  id: number;
  status: string;
  total_score: number;
  weighted_score: number;
  general_comments: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  employee: UserBasicInfoDTO;
  evaluator: UserBasicInfoDTO;
  period: EvaluationPeriodDTO;
  scores: EvaluationScoreResponseDTO[];
}

interface AssignedCriteriaScoreDTO {
  assigned_criteria_id: number;
  score: number;
  comments?: string;
  evidence?: string;
}

interface RealizarEvaluacionModalProps {
  evaluationId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RealizarEvaluacionModal: React.FC<RealizarEvaluacionModalProps> = ({
  evaluationId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [evaluation, setEvaluation] = useState<EvaluationResponseDTO | null>(null);
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [evidence, setEvidence] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la evaluación
  useEffect(() => {
    if (isOpen && evaluationId) {
      fetchEvaluationData();
    }
  }, [isOpen, evaluationId]);

  const fetchEvaluationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log(`🚀 Fetching evaluation ${evaluationId} from: /api/v1/evaluations/${evaluationId}/for-scoring`);
      
      const response = await fetch(`/api/v1/evaluations/${evaluationId}/for-scoring`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Response is not JSON:', responseText.substring(0, 500));
        throw new Error('El servidor no devolvió JSON válido');
      }

      const result = await response.json();
      console.log('✅ Evaluation data received:', result);
      
      if (!result.data) {
        throw new Error('No se recibieron datos de la evaluación');
      }

      setEvaluation(result.data);

      // Inicializar scores si ya existen
      const initialScores: { [key: number]: number } = {};
      const initialComments: { [key: number]: string } = {};
      const initialEvidence: { [key: number]: string } = {};

      if (result.data.scores && Array.isArray(result.data.scores)) {
        result.data.scores.forEach((score: EvaluationScoreResponseDTO) => {
          if (score.score) {
            initialScores[score.id] = score.score;
          }
          if (score.comments) {
            initialComments[score.id] = score.comments;
          }
          if (score.evidence) {
            initialEvidence[score.id] = score.evidence;
          }
        });
      }

      setScores(initialScores);
      setComments(initialComments);
      setEvidence(initialEvidence);

    } catch (err) {
      console.error('❌ Error fetching evaluation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (assignedCriteriaId: number, score: number) => {
    setScores(prev => ({
      ...prev,
      [assignedCriteriaId]: score
    }));
  };

  const handleCommentChange = (assignedCriteriaId: number, comment: string) => {
    setComments(prev => ({
      ...prev,
      [assignedCriteriaId]: comment
    }));
  };

  const handleEvidenceChange = (assignedCriteriaId: number, evidenceText: string) => {
    setEvidence(prev => ({
      ...prev,
      [assignedCriteriaId]: evidenceText
    }));
  };

  const isComplete = () => {
    if (!evaluation) return false;
    return evaluation.scores.every(score => scores[score.id] !== undefined);
  };

  const calculatePreviewScore = () => {
    if (!evaluation) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    evaluation.scores.forEach(score => {
      const userScore = scores[score.id];
      if (userScore !== undefined) {
        const weightedScore = (userScore / 5.0) * score.weight;
        totalWeightedScore += weightedScore;
        totalWeight += score.weight;
      }
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
  };

  const getScoreLabel = (score: number) => {
    const labels = {
      1: 'Muy Bajo',
      2: 'Bajo', 
      3: 'Aceptable',
      4: 'Bueno',
      5: 'Excelente'
    };
    return labels[score as keyof typeof labels] || '';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSubmit = async () => {
    if (!evaluation || !isComplete()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: AssignedCriteriaScoreDTO[] = evaluation.scores.map(score => ({
        assigned_criteria_id: score.id,
        score: scores[score.id],
        comments: comments[score.id] || '',
        evidence: evidence[score.id] || '',
      }));

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/evaluations/${evaluationId}/score`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la evaluación');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Realizar Evaluación</h2>
                <p className="text-blue-100">Califica cada criterio de 1 a 5</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando evaluación...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          ) : evaluation ? (
            <div className="p-6 space-y-6">
              {/* Información de la evaluación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Empleado</p>
                      <p className="font-medium">{evaluation.employee.first_name} {evaluation.employee.last_name}</p>
                      <p className="text-sm text-gray-500">{evaluation.employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Período</p>
                      <p className="font-medium">{evaluation.period.name}</p>
                      <p className="text-sm text-gray-500">{evaluation.period.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Progreso</p>
                      <p className="font-medium">
                        {Object.keys(scores).length} / {evaluation.scores.length} completados
                      </p>
                      {isComplete() && (
                        <p className="text-sm text-green-600 font-medium">
                          Score estimado: {calculatePreviewScore().toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Criterios para calificar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Criterios de Evaluación</h3>
                
                {evaluation.scores.map((scoreItem, _index) => (
                  <div key={scoreItem.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{scoreItem.criteria.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{scoreItem.criteria.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Peso: {scoreItem.weight}%</p>
                        </div>
                        {scores[scoreItem.id] && (
                          <div className="text-right">
                            <p className={`text-sm font-medium ${getScoreColor(scores[scoreItem.id])}`}>
                              {getScoreLabel(scores[scoreItem.id])}
                            </p>
                            <p className="text-xs text-gray-500">
                              {scores[scoreItem.id]}/5
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Escala de calificación */}
                      <div className="flex items-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleScoreChange(scoreItem.id, rating)}
                            className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                              scores[scoreItem.id] === rating
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400 text-gray-600'
                            }`}
                          >
                            <Star 
                              className={`w-5 h-5 ${
                                scores[scoreItem.id] === rating
                                  ? 'fill-current'
                                  : ''
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Comentarios opcionales */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comentarios (opcional)
                          </label>
                          <textarea
                            value={comments[scoreItem.id] || ''}
                            onChange={(e) => handleCommentChange(scoreItem.id, e.target.value)}
                            placeholder="Escribe observaciones o comentarios sobre este criterio..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Evidencia (opcional)
                          </label>
                          <textarea
                            value={evidence[scoreItem.id] || ''}
                            onChange={(e) => handleEvidenceChange(scoreItem.id, e.target.value)}
                            placeholder="Describe ejemplos específicos o evidencia que sustente esta calificación..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {evaluation && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {isComplete() ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Evaluación completa - Lista para enviar
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Faltan {evaluation.scores.length - Object.keys(scores).length} criterios por calificar
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete() || submitting}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isComplete() && !submitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Completar Evaluación
                    </div>
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