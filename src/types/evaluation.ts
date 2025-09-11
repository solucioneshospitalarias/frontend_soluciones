// src/types/evaluation.ts
// Tipos corregidos para coincidir exactamente con el backend

export interface Criteria {
  id: number;
  name: string;
  description: string;
  weight: number; // En escala 0.1 a 100, según el backend
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
  is_active: boolean; // Para soft delete
}

export interface Period {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  due_date: string;
  is_active: boolean; // Para soft delete
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  position?: string;
  is_active: boolean; // Para soft delete
  criteria: TemplateCriteria[];
  created_at: string;
  updated_at: string;
}

export interface TemplateCriteria {
  id: number;
  criteria_id: number;
  weight: number; // En escala 0.1 a 100
  criteria: Criteria;
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
    weight: number; // En escala 0.1 a 100
    score?: number;
  }[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  is_active?: boolean;
}

// DTOs para crear elementos
export interface CreateCriteriaDTO {
  name: string;
  description: string;
  weight: number; // En escala 0.1 a 100
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

// DTOs para soft delete (deshabilitar)
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
  weight?: number; // En escala 0.1 a 100
  category?: 'productividad' | 'conducta_laboral' | 'habilidades';
  is_active?: boolean;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  criteria?: {
    criteria_id: number;
    weight: number; // En escala 0.1 a 100
  }[];
}

// Respuestas del backend
export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}