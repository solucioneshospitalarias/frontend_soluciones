import axios from 'axios';
import type { Evaluation } from '../types/evaluation';

export const getEvaluations = async (): Promise<Evaluation[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const response = await axios.get('http://localhost:8080/api/v1/evaluations', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const evaluations = response.data;

  // ✅ Validación para evitar errores si evaluations es null o no es un array
  if (!Array.isArray(evaluations)) {
    console.warn('Evaluations no es un array:', evaluations);
    return [];
  }

  return evaluations;
};

export const getEvaluationStats = async () => {
  const evaluations = await getEvaluations();

  return {
    completedEvaluations: evaluations.filter(e => e.status === 'completed').length,
    pendingEvaluations: evaluations.filter(e => e.status === 'pending').length,
    overdueEvaluations: evaluations.filter(e => e.status === 'overdue').length,
  };
};
