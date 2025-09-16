export interface Criteria {
  id: number;
  name: string;
  description: string;
  weight: number; 
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
  is_active: boolean;
}

export interface Period {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  due_date: string;
  is_active: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  position?: string;
  is_active: boolean;
  criteria: TemplateCriteria[];
  created_at: string;
  updated_at: string;
}

export interface TemplateCriteria {
  id: number;
  criteria_id: number;
  weight: number;
  criteria: Criteria;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  is_active?: boolean;
}

// ==================== NUEVOS TIPOS PARA CALIFICACIÓN ====================

// DTO para enviar puntuaciones al backend
export interface PuntuacionCriterioDTO {
  assigned_criteria_id: number;
  score: number; // 1-5
}

// Información básica de usuario (viene del backend)
export interface InfoBasicaUsuarioDTO {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
}

// Período simplificado (viene del backend)
export interface PeriodoEvaluacionDTO {
  id: number;
  name: string;
  description: string;
  start_date: string;
  due_date: string;
  is_active: boolean;
}

// Plantilla simplificada (viene del backend)  
export interface PlantillaEvaluacionDTO {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

// Criterio con detalles (viene del backend)
export interface CriterioEvaluacionDTO {
  id: number;
  name: string;
  description: string;
  weight: number;
  is_active: boolean;
  category?: 'productividad' | 'conducta_laboral' | 'habilidades';
}

// Puntuación individual de un criterio (viene del backend)
export interface RespuestaPuntuacionDTO {
  id: number; // assigned_criteria_id
  criteria_id: number;
  score?: number;
  weight: number;
  weighted_score?: number;
  criteria: CriterioEvaluacionDTO;
}

// Evaluación completa para calificar (viene del backend)
export interface EvaluacionParaCalificarDTO {
  id: number;
  status: string;
  total_score: number;
  weighted_score: number;
  general_comments?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  employee: InfoBasicaUsuarioDTO;
  evaluator: InfoBasicaUsuarioDTO;
  period: PeriodoEvaluacionDTO;
  template?: PlantillaEvaluacionDTO;
  scores: RespuestaPuntuacionDTO[];
}

// ==================== LISTAS Y RESÚMENES ====================

// Resumen de evaluación para listas (viene del backend)
export interface ResumenEvaluacionDTO {
  id: number;
  employee_name: string;
  evaluator_name: string;
  period_name: string;
  status: string;
  completed_at?: string;
}

// Mis evaluaciones organizadas (viene del backend)
export interface MisEvaluacionesRespuestaDTO {
  as_employee: {
    evaluations: ResumenEvaluacionDTO[];
    summary: {
      total: number;
      completed: number;
      pending: number;
    };
  };
  as_evaluator: {
    evaluations: ResumenEvaluacionDTO[];
    summary: {
      total: number;
      completed: number;
      pending_to_evaluate: number;
    };
  };
}

// ==================== FILTROS Y PARÁMETROS ====================

export interface FiltrosEvaluacionParams {
  evaluator_id?: number;
  employee_id?: number;
  period_id?: number;
  status?: string;
}

// ==================== TIPOS PARA LA UI ====================

// Estados posibles de una evaluación
export type EstadoEvaluacion = 'pending' | 'in_progress' | 'completed' | 'overdue';

// Categorías de criterios
export type CategoríaCriterio = 'productividad' | 'conducta_laboral' | 'habilidades';

// Modo de vista de evaluaciones
export type ModoEvaluacion = 'evaluador' | 'evaluado';

// Información sobre el peso de un criterio (para tooltips)
export interface InfoPeso {
  nivel: 'alto' | 'medio' | 'bajo';
  color: string;
  texto: string;
}

// Opción de puntuación
export interface OpcionPuntuacion {
  valor: number;
  etiqueta: string;
  descripcion?: string;
}

// ==================== DTOs EXISTENTES (MANTENER) ====================

export interface CreateCriteriaDTO {
  name: string;
  description: string;
  weight: number;
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
}

export interface CreatePeriodDTO {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  due_date: string;
  is_active: boolean;
}

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  position?: string;
  criteria: {
    productivity: { criteria_id: number; weight: number }[];
    work_conduct: { criteria_id: number; weight: number }[];
    skills: { criteria_id: number; weight: number }[];
  };
}

export interface CreateEvaluationsFromTemplateDTO {
  template_id: number;
  period_id: number;
  evaluator_id: number;
  employee_ids: number[];
}

export interface SoftDeleteDTO {
  is_active: boolean;
}

export interface UpdatePeriodDTO {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  is_active?: boolean;
}

export interface UpdateCriteriaDTO {
  name?: string;
  description?: string;
  weight?: number;
  category?: 'productividad' | 'conducta_laboral' | 'habilidades';
  is_active?: boolean;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  criteria?: {
    criteria_id: number;
    weight: number;
  }[];
}

// Interfaz para evaluaciones básica (mantener compatibilidad)
export interface Evaluation {
  id: number;
  employee_id: number;
  employee_name: string;
  evaluator_id: number;
  evaluator_name: string;
  period_id: number;
  period_name: string;
  template_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  criteria: {
    criteriaId: number;
    description: string;
    category: 'productividad' | 'conducta_laboral' | 'habilidades';
    weight: number;
    score?: number;
  }[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Respuesta genérica de la API
export interface RespuestaAPI<T> {
  success: boolean;
  message?: string;
  data: T;
}