// src/types/evaluation.ts

export interface Criteria {
  id: number;
  name: string;
  description: string;
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
  weight: number;
  is_active: boolean;
  can_modify: boolean;
  can_delete: boolean;
  in_use: boolean;
  created_at: string;
  updated_at: string;
}

export interface Period {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  due_date: string;
  is_active: boolean;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  is_expired?: boolean;
  can_modify?: boolean;
  can_delete?: boolean;
  created_at: string;
  updated_at: string;
}

// Template criteria individual con estructura del backend
export interface BackendTemplateCriteria {
  id: number;
  weight: number;
  category: string;
  criteria: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
}

// Estructura del backend para los criterios organizados por categoría
export interface TemplateCriteriaByCategory {
  productivity: BackendTemplateCriteria[];
  work_conduct: BackendTemplateCriteria[];
  skills: BackendTemplateCriteria[];
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  position?: string;
  is_active: boolean;
  // Puede venir como array o como objeto organizado por categorías
  criteria?: TemplateCriteria[] | TemplateCriteriaByCategory;
  summary?: {
    total_criteria: number;
    categories_used: number;
    weights_summary: {
      productivity: number;
      work_conduct: number;
      skills: number;
    };
    is_valid_weights: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem extends Omit<Template, 'criteria' | 'summary'> {
  criteria_count: number;
  categories_used: number;
}
// Para mantener compatibilidad con el código existente
export interface TemplateCriteria {
  id?: number;
  criteria_id: number;
  weight: number;
  criteria?: Criteria;
  category?: string;
}

// Para mantener compatibilidad con el código existente
export interface TemplateCriteria {
  id?: number;
  criteria_id: number;
  weight: number;
  criteria?: Criteria;
  category?: string;
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

export interface PuntuacionCriterioDTO {
  assigned_criteria_id: number;
  score: number; // 1-5
}

export interface InfoBasicaUsuarioDTO {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
}

export interface PeriodoEvaluacionDTO {
  id: number;
  name: string;
  description: string;
  start_date: string;
  due_date: string;
  is_active: boolean;
}

export interface PlantillaEvaluacionDTO {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface CriterioEvaluacionDTO {
  id: number;
  name: string;
  description: string;
  weight: number;
  is_active: boolean;
  category?: 'productividad' | 'conducta_laboral' | 'habilidades';
}

export interface RespuestaPuntuacionDTO {
  id: number; // assigned_criteria_id
  criteria_id: number;
  score?: number;
  weight: number;
  weighted_score?: number;
  criteria: CriterioEvaluacionDTO;
}

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

export interface ResumenEvaluacionDTO {
  id: number;
  employee_name: string;
  evaluator_name: string;
  period_name: string;
  status: string;
  completed_at?: string;
}

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

export interface FiltrosEvaluacionParams {
  evaluator_id?: number;
  employee_id?: number;
  period_id?: number;
  status?: string;
}

export type EstadoEvaluacion = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type CategoríaCriterio = 'productividad' | 'conducta_laboral' | 'habilidades';
export type ModoEvaluacion = 'evaluador' | 'evaluado';

export interface InfoPeso {
  nivel: 'alto' | 'medio' | 'bajo';
  color: string;
  texto: string;
}

export interface OpcionPuntuacion {
  valor: number;
  etiqueta: string;
  descripcion?: string;
}

export interface CreateCriteriaDTO {
  name: string;
  description: string;
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
  // is_active se calcula automáticamente según las fechas, no se envía
}

export interface UpdateCriteriaDTO {
  name?: string;
  description?: string;
  weight?: number;
  category?: 'productividad' | 'conducta_laboral' | 'habilidades';
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  criteria?: {
    productivity: { criteria_id: number; weight: number }[];
    work_conduct: { criteria_id: number; weight: number }[];
    skills: { criteria_id: number; weight: number }[];
  };
}

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

export interface RespuestaAPI<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Helper function para convertir criterios del backend al formato frontend
export function flattenTemplateCriteria(criteria: TemplateCriteria[] | TemplateCriteriaByCategory | undefined): TemplateCriteria[] {
  if (!criteria) return [];
  
  // Si ya es un array, devolverlo tal cual
  if (Array.isArray(criteria)) return criteria;
  
  // Si es un objeto con categorías, aplanarlo
  const flattened: TemplateCriteria[] = [];
  
  if ('productivity' in criteria) {
    criteria.productivity.forEach(tc => {
      flattened.push({
        id: tc.id,
        criteria_id: tc.criteria.id,
        weight: tc.weight,
        category: 'productividad'
      });
    });
  }
  
  if ('work_conduct' in criteria) {
    criteria.work_conduct.forEach(tc => {
      flattened.push({
        id: tc.id,
        criteria_id: tc.criteria.id,
        weight: tc.weight,
        category: 'conducta_laboral'
      });
    });
  }
  
  if ('skills' in criteria) {
    criteria.skills.forEach(tc => {
      flattened.push({
        id: tc.id,
        criteria_id: tc.criteria.id,
        weight: tc.weight,
        category: 'habilidades'
      });
    });
  }
  
  return flattened;
}