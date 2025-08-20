// src/services/evaluationService.ts
// Servicio corregido con manejo de respuestas y tipos correctos

import { API_BASE_URL } from '../constants/api';

// Re-exportar tipos para compatibilidad
export type {
  Criteria,
  Period,
  Template,
  Evaluation,
  Employee,
  CreateCriteriaDTO,
  CreatePeriodDTO,
  CreateTemplateDTO,
  CreateEvaluationsFromTemplateDTO
} from '../types/evaluation';

import type {
  Criteria,
  Period,
  Template,
  Evaluation,
  Employee,
  CreateCriteriaDTO,
  CreatePeriodDTO,
  CreateTemplateDTO,
  CreateEvaluationsFromTemplateDTO
} from '../types/evaluation';

// Headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ✅ Helper para manejar respuestas del backend
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  // El backend puede devolver { success: boolean, data: T } o directamente T
  if (result.success === false) {
    throw new Error(result.message || 'Error en la operación');
  }
  
  return result.data || result;
};

// ==================== CRITERIA ====================
export const getCriteria = async (): Promise<Criteria[]> => {
  try {
    console.log('🔍 Fetching criteria...');
    const response = await fetch(`${API_BASE_URL}/criteria`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Criteria[]>(response);
    console.log('✅ Criteria loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching criteria:', error);
    throw error;
  }
};

export const createCriteria = async (criteriaData: CreateCriteriaDTO): Promise<Criteria> => {
  try {
    console.log('🔄 Creating criteria...', criteriaData);
    const response = await fetch(`${API_BASE_URL}/criteria`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(criteriaData)
    });

    const data = await handleResponse<Criteria>(response);
    console.log('✅ Criteria created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating criteria:', error);
    throw error;
  }
};

export const deleteCriteria = async (id: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting criteria:', id);
    const response = await fetch(`${API_BASE_URL}/criteria/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    await handleResponse<void>(response);
    console.log('✅ Criteria deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting criteria:', error);
    throw error;
  }
};

// ==================== PERIODS ====================
export const getPeriods = async (): Promise<Period[]> => {
  try {
    console.log('🔍 Fetching periods...');
    const response = await fetch(`${API_BASE_URL}/periods`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Period[]>(response);
    console.log('✅ Periods loaded:', data);
    
    // ✅ Debug: Ver estructura de fechas
    if (Array.isArray(data) && data.length > 0) {
      console.log('📅 Sample period dates:', {
        start_date: data[0].start_date,
        end_date: data[0].end_date,
        due_date: data[0].due_date,
        typeof_start: typeof data[0].start_date
      });
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching periods:', error);
    throw error;
  }
};

export const createPeriod = async (periodData: CreatePeriodDTO): Promise<Period> => {
  try {
    console.log('🔄 Creating period...', periodData);
    const response = await fetch(`${API_BASE_URL}/periods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(periodData)
    });

    const data = await handleResponse<Period>(response);
    console.log('✅ Period created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating period:', error);
    throw error;
  }
};

export const deletePeriod = async (id: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting period:', id);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    await handleResponse<void>(response);
    console.log('✅ Period deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting period:', error);
    throw error;
  }
};

// ==================== TEMPLATES ====================
export const getTemplates = async (): Promise<Template[]> => {
  try {
    console.log('🔍 Fetching templates...');
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Template[]>(response);
    console.log('✅ Templates loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    throw error;
  }
};

export const createTemplate = async (templateData: CreateTemplateDTO): Promise<Template> => {
  try {
    console.log('🔄 Creating template...', templateData);
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });

    const data = await handleResponse<Template>(response);
    console.log('✅ Template created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting template:', id);
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    await handleResponse<void>(response);
    console.log('✅ Template deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    throw error;
  }
};

export const cloneTemplate = async (id: number, newName?: string): Promise<Template> => {
  try {
    console.log('📋 Cloning template:', id, newName);
    const body = newName ? JSON.stringify({ name: newName }) : undefined;
    
    const response = await fetch(`${API_BASE_URL}/templates/${id}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body
    });

    const data = await handleResponse<Template>(response);
    console.log('✅ Template cloned:', data);
    return data;
  } catch (error) {
    console.error('❌ Error cloning template:', error);
    throw error;
  }
};

// ==================== EVALUATIONS ====================
export const getEvaluations = async (): Promise<Evaluation[]> => {
  try {
    console.log('🔍 Fetching evaluations...');
    const response = await fetch(`${API_BASE_URL}/evaluations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Evaluation[]>(response);
    console.log('✅ Evaluations loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching evaluations:', error);
    throw error;
  }
};

export const createEvaluationsFromTemplate = async (
  evaluationsData: CreateEvaluationsFromTemplateDTO
): Promise<{ evaluatedEmployeeIds: number[]; count: number }> => {
  try {
    console.log('🔄 Creating evaluations from template...', evaluationsData);
    
    // ⚠️ IMPORTANTE: El backend espera 'user_ids', no 'employee_ids'
    const backendPayload = {
      template_id: evaluationsData.template_id,
      user_ids: evaluationsData.employee_ids // ✅ Mapear employee_ids -> user_ids
    };
    
    const response = await fetch(`${API_BASE_URL}/evaluations/from-template`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload)
    });

    const data = await handleResponse<{ evaluatedEmployeeIds: number[]; count: number }>(response);
    console.log('✅ Evaluations created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating evaluations:', error);
    throw error;
  }
};

export const deleteEvaluation = async (id: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting evaluation:', id);
    const response = await fetch(`${API_BASE_URL}/evaluations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    await handleResponse<void>(response);
    console.log('✅ Evaluation deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting evaluation:', error);
    throw error;
  }
};

// ==================== EMPLOYEES ====================
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('🔍 Fetching employees...');
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Employee[]>(response);
    console.log('✅ Employees loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    throw error;
  }
};

export const getMyEvaluations = async (): Promise<Evaluation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/me/evaluations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Evaluation[]>(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching my evaluations:', error);
    throw error;
  }
};