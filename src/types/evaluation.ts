// src/types/evaluation.ts
// Tipos corregidos para coincidir exactamente con el backend

export interface Criteria {
  id: number; // ✅ Cambiado de string a number
  name: string;
  description: string;
  weight: number;
  category: string;
  is_active: boolean;
}

export interface Period {
  id: number; // ✅ Cambiado de string a number
  name: string;
  description: string;
  start_date: string; // ✅ ISO date string del backend
  end_date: string;   // ✅ ISO date string del backend
  due_date: string;   // ✅ ISO date string del backend
  is_active: boolean; // ✅ snake_case como el backend
  created_at: string; // ✅ Agregado
  updated_at: string; // ✅ Agregado
}

export interface Template {
  id: number; // ✅ Cambiado de string a number
  name: string;
  description?: string;
  position?: string;
  is_active: boolean; // ✅ Cambiado de isActive
  criteria: TemplateCriteria[]; // ✅ Directo, no structure.criteria
  created_at: string; // ✅ snake_case
  updated_at: string; // ✅ snake_case
}

export interface TemplateCriteria {
  id: number;
  criteria_id: number; // ✅ snake_case
  weight: number;
  criteria: Criteria; // ✅ Información completa del criterio
}

export interface Evaluation {
  id: number; // ✅ Cambiado de string a number
  employee_name: string; // ✅ snake_case
  evaluator_name: string; // ✅ snake_case
  period_name: string;   // ✅ snake_case
  status: 'pending' | 'completed' | 'overdue'; // ✅ Estados correctos
  completed_at?: string; // ✅ snake_case
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number; // ✅ Cambiado de string a number
  first_name: string; // ✅ snake_case
  last_name: string;  // ✅ snake_case
  email: string;
  position: string;
}

// DTOs para crear elementos
export interface CreateCriteriaDTO {
  name: string;
  description: string;
  weight: number;
  category: string;
}

export interface CreatePeriodDTO {
  name: string;
  description: string;
  start_date: string; // ✅ Formato YYYY-MM-DD para enviar al backend
  end_date: string;
  due_date: string;
  is_active: boolean;
}

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  position?: string;
  criteria: {
    criteria_id: number; // ✅ snake_case
    weight: number;
  }[];
}

export interface CreateEvaluationsFromTemplateDTO {
  template_id: number;
  period_id: number;
  evaluator_id: number;
  employee_ids: number[]; // ✅ Pero el backend espera user_ids
}

// Respuestas del backend
export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}