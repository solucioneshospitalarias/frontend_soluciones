// src/services/evaluationService.ts
// 🔥 PARTE 1: HEADERS Y FUNCIONES BÁSICAS

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
  CreateEvaluationsFromTemplateDTO,
  UpdatePeriodDTO
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
  CreateEvaluationsFromTemplateDTO,
  UpdatePeriodDTO
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
// 🔥 PARTE 2: FUNCIONES DE PERÍODOS

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
    
    // ✅ DEBUG: Log raw response structure  
    if (data && data.length > 0) {
      console.log('📊 First period structure:', JSON.stringify(data[0], null, 2));
      console.log('📊 Period fields:', Object.keys(data[0]));
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching periods:', error);
    throw error;
  }
};

export const getPeriodById = async (id: number): Promise<Period> => {
  try {
    console.log('🔍 Fetching period by ID:', id);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Period>(response);
    console.log('✅ Period loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching period:', error);
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
    
    // ✅ DEBUG: Log created period structure
    console.log('📊 Created period structure:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error creating period:', error);
    throw error;
  }
};

export const updatePeriod = async (id: number, periodData: UpdatePeriodDTO): Promise<Period> => {
  try {
    console.log('🔄 Updating period...', id, periodData);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(periodData)
    });

    const data = await handleResponse<Period>(response);
    console.log('✅ Period updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating period:', error);
    throw error;
  }
};

// ✅ NUEVA FUNCIÓN: Toggle de estado de período
export const togglePeriodStatus = async (id: number): Promise<Period> => {
  try {
    console.log('🔄 Toggling period status:', id);
    
    // TODO: Cuando el backend esté listo, usar esta ruta
    // const response = await fetch(`${API_BASE_URL}/periods/${id}/toggle`, {
    //   method: 'PATCH',
    //   headers: getAuthHeaders()
    // });

    // ✅ SIMULACIÓN TEMPORAL - ELIMINAR CUANDO EL BACKEND ESTÉ LISTO
    console.warn('⚠️ Simulando toggle de período - implementar en backend');
    
    // Simular respuesta del backend
    const mockPeriod: Period = {
      id,
      name: 'Período simulado',
      description: 'Descripción simulada',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      due_date: new Date().toISOString(),
      is_active: true, // Simular que se activó
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Period status toggled (simulated):', mockPeriod);
    return mockPeriod;
  } catch (error) {
    console.error('❌ Error toggling period status:', error);
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
// 🔥 PARTE 3: FUNCIONES DE PLANTILLAS

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
// 🔥 PARTE 4: FUNCIONES DE EVALUACIONES Y EMPLEADOS

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
    console.log('🔍 Fetching my evaluations...');
    const response = await fetch(`${API_BASE_URL}/me/evaluations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse<Evaluation[]>(response);
    console.log('✅ My evaluations loaded:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching my evaluations:', error);
    throw error;
  }
};

// ✅ FUNCIÓN ADICIONAL: Desactivar elementos (simulada)
export const deactivateItem = async (type: 'criteria' | 'template', id: number): Promise<void> => {
  try {
    console.log(`📴 Deactivating ${type}:`, id);
    
    // TODO: Implementar endpoint en backend para desactivar
    // const response = await fetch(`${API_BASE_URL}/${type}/${id}/deactivate`, {
    //   method: 'PATCH',
    //   headers: getAuthHeaders()
    // });

    // ✅ SIMULACIÓN TEMPORAL
    console.warn(`⚠️ Simulando desactivación de ${type} - implementar en backend`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`✅ ${type} deactivated successfully (simulated)`);
  } catch (error) {
    console.error(`❌ Error deactivating ${type}:`, error);
    throw error;
  }
};
