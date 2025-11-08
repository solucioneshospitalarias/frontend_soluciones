export interface Criteria {
  id: number;
  name: string;
  description: string;
  category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
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

export interface TemplateCriteriaByCategory {
  productivity: BackendTemplateCriteria[];
  work_conduct: BackendTemplateCriteria[];
  skills: BackendTemplateCriteria[];
  seguridad_trabajo: BackendTemplateCriteria[];
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  position?: string;
  is_active: boolean;
  criteria?: TemplateCriteria[] | TemplateCriteriaByCategory;
  summary?: {
    total_criteria: number;
    categories_used: number;
    weights_summary: {
      productivity: number;
      work_conduct: number;
      skills: number;
      seguridad_trabajo: number;
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
  department_id?: number;
}

export interface PuntuacionCriterioDTO {
  assigned_criteria_id: number;
  score: number; // 1-100
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
  category?: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
}

export interface RespuestaPuntuacionDTO {
  id: number;
  criteria_id: number;
  score?: number;
  weight: number;
  weighted_score?: number;
  score_percentage?: number;
  contribution_points?: number;
  max_possible_points?: number;
  is_passing?: boolean;
  comments?: string;
  evidence?: string;
  criteria: CriterioEvaluacionDTO;
}

export interface EvaluacionParaCalificarDTO {
  id: number;
  status: string;
  total_score: number;
  weighted_score: number;
  performance_percentage?: number;
  performance_level?: string;
  max_possible_score?: number;
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
  employee_position?: string;    // ✅ NUEVO
  employee_department?: string;  // ✅ NUEVO  
  evaluator_name: string;
  period_name: string;
  status: string;
  total_score?: number;          // ✅ NUEVO
  weighted_score?: number;       // ✅ NUEVO
  completed_at?: string;
  due_date: string;
  employee_id: number;
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

// New interface for evaluations by period
export interface EvaluationListByPeriodResponseDTO {
  id: number;
  employee_name: string;
  evaluator_name: string;
  status: string;
  weighted_score: number;
  completed_at?: string;
  due_date: string;
}

// New interface for average scores by department
export interface AverageByDepartmentResponseDTO {
  department_name: string;
  average_score: number;
  evaluation_count: number;
}

// New interface for employee performance
export interface EmployeePerformanceResponseDTO {
  period_name: string;
  weighted_score: number;
  status: string;
  completed_at?: string;
}

// New interface for pending evaluations by department
export interface PendingByDepartmentResponseDTO {
  department_name: string;
  pending_evaluations: number;
}

export interface AverageScoreByDepartment {
  department_name: string;
  average_score: number;
  evaluation_count: number;
}

export type EstadoEvaluacion = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type CategoríaCriterio = 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
export type ModoEvaluacion = 'evaluador' | 'empleado';

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
  category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
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
    seguridad_trabajo: { criteria_id: number; weight: number }[];
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
}

export interface UpdateCriteriaDTO {
  name?: string;
  description?: string;
  weight?: number;
  category?: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  criteria?: {
    productivity: { criteria_id: number; weight: number }[];
    work_conduct: { criteria_id: number; weight: number }[];
    skills: { criteria_id: number; weight: number }[];
    seguridad_trabajo: { criteria_id: number; weight: number }[];
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
    category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
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

export function flattenTemplateCriteria(criteria: TemplateCriteria[] | TemplateCriteriaByCategory | undefined): TemplateCriteria[] {
  if (!criteria) return [];
  
  if (Array.isArray(criteria)) return criteria;
  
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
  
  if ('seguridad_trabajo' in criteria) {
    criteria.seguridad_trabajo.forEach(tc => {
      flattened.push({
        id: tc.id,
        criteria_id: tc.criteria.id,
        weight: tc.weight,
        category: 'seguridad_trabajo'
      });
    });
  }
  
  return flattened;
}