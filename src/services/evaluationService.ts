import { API_BASE_URL } from "../constants/api";

export type { Criteria, Period, Template, Evaluation, Employee, CreateCriteriaDTO, CreatePeriodDTO, CreateTemplateDTO, UpdateTemplateDTO, CreateEvaluationsFromTemplateDTO, UpdatePeriodDTO, EvaluacionParaCalificarDTO, ResumenEvaluacionDTO, MisEvaluacionesRespuestaDTO, PuntuacionCriterioDTO, FiltrosEvaluacionParams, EvaluationListByPeriodResponseDTO, AverageByDepartmentResponseDTO, EmployeePerformanceResponseDTO, PendingByDepartmentResponseDTO, AverageScoreByDepartment, } from "../types/evaluation";

import type { Criteria, Period, Template, Evaluation, Employee, CreateCriteriaDTO, UpdateCriteriaDTO, CreatePeriodDTO, CreateTemplateDTO, UpdateTemplateDTO, CreateEvaluationsFromTemplateDTO, UpdatePeriodDTO, EvaluacionParaCalificarDTO, ResumenEvaluacionDTO, MisEvaluacionesRespuestaDTO, PuntuacionCriterioDTO, FiltrosEvaluacionParams, EvaluationListByPeriodResponseDTO, AverageByDepartmentResponseDTO, EmployeePerformanceResponseDTO, PendingByDepartmentResponseDTO, } from "../types/evaluation";

const MIN_SCORE = 1;
const MAX_SCORE = 100;

// Interface for single evaluation creation
export interface CreateSingleEvaluationDTO {
  template_id: number;
  period_id: number;
  evaluator_id: number;
  employee_id: number;
}

export interface CreateSingleEvaluationResponse {
  evaluation_id: number;
}

// Interface for manual evaluations creation
export interface CreateManualEvaluationsDTO {
  period_id: number;
  evaluator_id: number;
  employee_ids: number[];
  criteria: {
    productivity: Array<{ criteria_id: number; weight: number }>;
    work_conduct: Array<{ criteria_id: number; weight: number }>;
    skills: Array<{ criteria_id: number; weight: number }>;
    seguridad_trabajo: Array<{ criteria_id: number; weight: number }>;
  };
}

// Headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token de autenticación no encontrado");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper para manejar respuestas del backend
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  if (result.success === false) {
    throw new Error(result.message || "Error en la operación");
  }

  return result.data || result;
};

// ==================== CRITERIA ====================
export const getCriteria = async (): Promise<Criteria[]> => {
  try {
    console.log("🔍 Fetching criteria...");
    const response = await fetch(`${API_BASE_URL}/criteria`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Criteria[]>(response);
    console.log("✅ Criteria loaded:", data);
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching criteria:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener criterios";
    throw new Error(errorMessage);
  }
};

export const createCriteria = async (
  criteriaData: CreateCriteriaDTO
): Promise<Criteria> => {
  try {
    console.log("🔄 Creating criteria...", criteriaData);
    const response = await fetch(`${API_BASE_URL}/criteria`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(criteriaData),
    });

    const data = await handleResponse<Criteria>(response);
    console.log("✅ Criteria created:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error creating criteria:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear criterios";
    throw new Error(errorMessage);
  }
};

export const updateCriteria = async (
  id: number,
  criteriaData: UpdateCriteriaDTO
): Promise<Criteria> => {
  try {
    console.log("🔄 Updating criteria...", id, criteriaData);
    const response = await fetch(`${API_BASE_URL}/criteria/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(criteriaData),
    });

    const data = await handleResponse<Criteria>(response);
    console.log("✅ Criteria updated:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error updating criteria:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar criterios";
    throw new Error(errorMessage);
  }
};

export const deleteCriteria = async (id: number): Promise<void> => {
  try {
    console.log("🗑️ Deleting criteria:", id);
    const response = await fetch(`${API_BASE_URL}/criteria/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleResponse<void>(response);
    console.log("✅ Criteria deleted successfully");
  } catch (error: unknown) {
    console.error("❌ Error deleting criteria:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar criterios";
    throw new Error(errorMessage);
  }
};

// ==================== PERIODS ====================
export const getPeriodById = async (id: number): Promise<Period> => {
  try {
    console.log("🔍 Fetching period by ID:", id);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Period>(response);
    console.log("✅ Period loaded:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error fetching period:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener período";
    throw new Error(errorMessage);
  }
};

export const createPeriod = async (
  periodData: CreatePeriodDTO
): Promise<Period> => {
  try {
    console.log("🔄 Creating period...", periodData);
    const response = await fetch(`${API_BASE_URL}/periods`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(periodData),
    });

    const data = await handleResponse<Period>(response);
    console.log("✅ Period created:", data);
    console.log("📊 Created period structure:", JSON.stringify(data, null, 2));
    return data;
  } catch (error: unknown) {
    console.error("❌ Error creating period:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear período";
    throw new Error(errorMessage);
  }
};

export const updatePeriod = async (
  id: number,
  periodData: UpdatePeriodDTO
): Promise<Period> => {
  try {
    console.log("🔄 Updating period...", id, periodData);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(periodData),
    });

    const data = await handleResponse<Period>(response);
    console.log("✅ Period updated:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error updating period:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar período";
    throw new Error(errorMessage);
  }
};

export const togglePeriodStatus = async (id: number): Promise<Period> => {
  try {
    console.log("🔄 Toggling period status:", id);
    console.warn("⚠️ Simulando toggle de período - implementar en backend");

    const mockPeriod: Period = {
      id,
      name: "Período simulado",
      description: "Descripción simulada",
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      due_date: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("✅ Period status toggled (simulated):", mockPeriod);
    return mockPeriod;
  } catch (error: unknown) {
    console.error("❌ Error toggling period status:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al cambiar estado del período";
    throw new Error(errorMessage);
  }
};

export const deletePeriod = async (id: number): Promise<void> => {
  try {
    console.log("🗑️ Deleting period:", id);
    const response = await fetch(`${API_BASE_URL}/periods/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleResponse<void>(response);
    console.log("✅ Period deleted successfully");
  } catch (error: unknown) {
    console.error("❌ Error deleting period:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar período";
    throw new Error(errorMessage);
  }
};

export const getPeriods = async (): Promise<Period[]> => {
  try {
    console.log("🔍 Fetching periods...");
    const response = await fetch(`${API_BASE_URL}/periods`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Period[]>(response);
    console.log("✅ Periods loaded:", data);

    if (data && data.length > 0) {
      console.log("📊 First period structure:", JSON.stringify(data[0], null, 2));
      console.log("📊 Period fields:", Object.keys(data[0]));
    }

    // Filtrar períodos para mostrar solo los no vencidos
    const now = new Date();
    const filteredPeriods = data.filter((period: Period) => {
      const dueDate = new Date(period.due_date);
      return dueDate >= now;
    });

    console.log("✅ Filtered periods:", filteredPeriods);
    return Array.isArray(filteredPeriods) ? filteredPeriods : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching periods:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener períodos";
    throw new Error(errorMessage);
  }
};

// ==================== TEMPLATES ====================
export const getTemplates = async (): Promise<Template[]> => {
  try {
    console.log("🔍 Fetching templates...");
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Template[]>(response);
    console.log("✅ Templates loaded:", data);
    data.forEach((template, index) => {
      console.log(`📋 Template ${index + 1} criteria:`, template.criteria);
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching templates:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener plantillas";
    throw new Error(errorMessage);
  }
};

export const getTemplateById = async (id: number): Promise<Template> => {
  try {
    console.log("🔍 Fetching template by ID:", id);
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Template>(response);
    console.log("✅ Template loaded:", data);
    console.log("📋 Template criteria:", data.criteria);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error fetching template:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener plantilla";
    throw new Error(errorMessage);
  }
};

export const createTemplate = async (
  templateData: CreateTemplateDTO
): Promise<Template> => {
  try {
    console.log("🔄 Creating template...", templateData);
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });

    const data = await handleResponse<Template>(response);
    console.log("✅ Template created:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error creating template:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear plantilla";
    throw new Error(errorMessage);
  }
};

export const updateTemplate = async (
  id: number,
  templateData: UpdateTemplateDTO
): Promise<Template> => {
  try {
    console.log("🔄 Updating template:", id, templateData);
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });

    const data = await handleResponse<Template>(response);
    console.log("✅ Template updated:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error updating template:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar plantilla";
    throw new Error(errorMessage);
  }
};

export const deleteTemplate = async (id: number): Promise<void> => {
  try {
    console.log("🗑️ Deleting template:", id);
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleResponse<void>(response);
    console.log("✅ Template deleted successfully");
  } catch (error: unknown) {
    console.error("❌ Error deleting template:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar plantilla";
    throw new Error(errorMessage);
  }
};

export const cloneTemplate = async (
  id: number,
  newName?: string
): Promise<Template> => {
  try {
    console.log("📋 Cloning template:", id, newName);
    const body = newName ? JSON.stringify({ name: newName }) : undefined;

    const response = await fetch(`${API_BASE_URL}/templates/${id}/clone`, {
      method: "POST",
      headers: getAuthHeaders(),
      body,
    });

    const data = await handleResponse<Template>(response);
    console.log("✅ Template cloned:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error cloning template:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al clonar plantilla";
    throw new Error(errorMessage);
  }
};

// ==================== EVALUATIONS ====================
export const getEvaluations = async (): Promise<Evaluation[]> => {
  try {
    console.log("🔍 Fetching evaluations...");
    const response = await fetch(`${API_BASE_URL}/evaluations`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Evaluation[]>(response);
    console.log("✅ Evaluations loaded:", data);
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching evaluations:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener evaluaciones";
    throw new Error(errorMessage);
  }
};

export const createEvaluationsFromTemplate = async (
  evaluationsData: CreateEvaluationsFromTemplateDTO
): Promise<{ evaluatedEmployeeIds: number[]; count: number }> => {
  try {
    console.log("🔄 Creating evaluations from template...", evaluationsData);

    const backendPayload = {
      template_id: evaluationsData.template_id,
      period_id: evaluationsData.period_id,
      evaluator_id: evaluationsData.evaluator_id,
      employee_ids: evaluationsData.employee_ids,
    };

    console.log("📤 Backend payload:", backendPayload);

    const response = await fetch(`${API_BASE_URL}/evaluations/from-template`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload),
    });

    const data = await handleResponse<{
      evaluatedEmployeeIds: number[];
      count: number;
    }>(response);
    console.log("✅ Evaluations created:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error creating evaluations:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear evaluaciones desde plantilla";
    throw new Error(errorMessage);
  }
};

export const createSingleEvaluation = async (
  evaluationData: CreateSingleEvaluationDTO
): Promise<CreateSingleEvaluationResponse> => {
  try {
    console.log("🔄 Creating single evaluation...", evaluationData);
    const backendPayload = {
      template_id: evaluationData.template_id,
      period_id: evaluationData.period_id,
      evaluator_id: evaluationData.evaluator_id,
      employee_id: evaluationData.employee_id,
    };
    console.log("📤 Backend payload:", backendPayload);
    const response = await fetch(`${API_BASE_URL}/evaluations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload),
    });
    const data = await handleResponse<CreateSingleEvaluationResponse>(response);
    console.log("✅ Evaluation created:", data);
    return data;
  } catch (error: unknown) {
    console.error("❌ Error creating evaluation:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear evaluación";
    throw new Error(errorMessage);
  }
};

export const deleteEvaluation = async (id: number): Promise<void> => {
  try {
    console.log("🗑️ Deleting evaluation:", id);
    const response = await fetch(`${API_BASE_URL}/evaluations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleResponse<void>(response);
    console.log("✅ Evaluation deleted successfully");
  } catch (error: unknown) {
    console.error("❌ Error deleting evaluation:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar evaluación";
    throw new Error(errorMessage);
  }
};

// ==================== CREAR EVALUACIONES MANUALES ====================
export const createManualEvaluations = async (
  evaluationsData: CreateManualEvaluationsDTO
): Promise<{ evaluatedEmployeeIds: number[]; count: number }> => {
  try {
    console.log("🔄 Creating manual evaluations...", evaluationsData);

    const response = await fetch(`${API_BASE_URL}/evaluations/manual`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(evaluationsData),
    });

    const data = await handleResponse<{
      created_count: number;
      evaluated_employees: Array<{ employee_id: number; employee_name: string }>;
      timestamp: string;
    }>(response);

    console.log("✅ Manual evaluations created:", data);

    // Adaptar respuesta del backend al formato esperado por el frontend
    return {
      evaluatedEmployeeIds: data.evaluated_employees.map(e => e.employee_id),
      count: data.created_count,
    };
  } catch (error: unknown) {
    console.error("❌ Error creating manual evaluations:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear evaluaciones manuales";
    throw new Error(errorMessage);
  }
};

// ==================== EMPLOYEES ====================
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    console.log("🔍 Fetching employees...");
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Employee[]>(response);
    console.log("✅ Employees loaded:", data);
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching employees:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener empleados";
    throw new Error(errorMessage);
  }
};

export const getMyEvaluations = async (): Promise<Evaluation[]> => {
  try {
    console.log("🔍 Fetching my evaluations...");
    const response = await fetch(`${API_BASE_URL}/evaluations/me/evaluations`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<Evaluation[]>(response);
    console.log("✅ My evaluations loaded:", data);
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    console.error("❌ Error fetching my evaluations:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener mis evaluaciones";
    throw new Error(errorMessage);
  }
};

export const deactivateItem = async (
  type: "criteria" | "template",
  id: number
): Promise<void> => {
  try {
    console.log(`📴 Deactivating ${type}:`, id);
    console.warn(`⚠️ Simulando desactivación de ${type} - implementar en backend`);

    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`✅ ${type} deactivated successfully (simulated)`);
  } catch (error: unknown) {
    console.error(`❌ Error deactivating ${type}:`, error);
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al desactivar ${type}`;
    throw new Error(errorMessage);
  }
};

// ==================== SERVICIOS PARA CALIFICACIÓN ====================
export class ErrorEvaluacion extends Error {
  public readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
    this.name = "ErrorEvaluacion";
  }
}

class ServicioEvaluaciones {
  private readonly baseUrl: string = API_BASE_URL;

  private obtenerHeadersAuth(): HeadersInit {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new ErrorEvaluacion("Token de autenticación no encontrado", 401);
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async manejarRespuesta<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let mensajeError = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        mensajeError = errorData.message || errorData.error || mensajeError;
      } catch {
        // Usar mensaje por defecto
      }

      throw new ErrorEvaluacion(mensajeError, response.status);
    }

    const data = await response.json();
    console.log("📡 Respuesta del backend:", data);

    if (data.success === false) {
      throw new ErrorEvaluacion(data.message || "Error en la operación", 400);
    }

    return data.data || (data as T);
  }

  public getDefaultEvaluationsStructure(): MisEvaluacionesRespuestaDTO {
    return {
      as_employee: {
        evaluations: [],
        summary: { total: 0, completed: 0, pending: 0 },
      },
      as_evaluator: {
        evaluations: [],
        summary: { total: 0, completed: 0, pending_to_evaluate: 0 },
      },
    };
  }

  async getPeriods(): Promise<Period[]> {
    try {
      console.log("🔍 Fetching periods...");
      const response = await fetch(`${this.baseUrl}/periods`, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<Period[]>(response);
      console.log("✅ Periods loaded:", data);

      if (data && data.length > 0) {
        console.log("📊 First period structure:", JSON.stringify(data[0], null, 2));
        console.log("📊 Period fields:", Object.keys(data[0]));
      }

      // Filtrar períodos para mostrar solo los no vencidos
      const now = new Date();
      const filteredPeriods = data.filter((period: Period) => {
        const dueDate = new Date(period.due_date);
        return dueDate >= now;
      });

      console.log("✅ Filtered periods:", filteredPeriods);
      return Array.isArray(filteredPeriods) ? filteredPeriods : [];
    } catch (error: unknown) {
      console.error("❌ Error fetching periods:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener períodos";
      throw new Error(errorMessage);
    }
  }

  async obtenerMisEvaluaciones(filtros?: FiltrosEvaluacionParams): Promise<MisEvaluacionesRespuestaDTO> {
  try {
    console.log("🔍 Obteniendo mis evaluaciones...", filtros);

    const queryParams = new URLSearchParams();
    if (filtros?.period_id) queryParams.append("period_id", filtros.period_id.toString());
    if (filtros?.status) queryParams.append("status", filtros.status);

    const url = `${this.baseUrl}/me/evaluations${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.obtenerHeadersAuth(),
    });

    if (!response.ok) {
      console.warn("⚠️ Response not OK, returning default structure");
      return this.getDefaultEvaluationsStructure();
    }

    const result = await response.json();
    console.log("📡 Respuesta raw del backend:", result);

    // ✅ El backend devuelve la estructura completa
    const data = result.data;

    // Validar que data existe y tiene la estructura correcta
    if (!data) {
      console.warn("⚠️ data es null o undefined");
      return this.getDefaultEvaluationsStructure();
    }

    // Asegurar que siempre haya arrays válidos
    const estructuraCompleta: MisEvaluacionesRespuestaDTO = {
      as_employee: {
        evaluations: Array.isArray(data.as_employee?.evaluations) ? data.as_employee.evaluations : [],
        summary: data.as_employee?.summary || { total: 0, completed: 0, pending: 0 },
      },
      as_evaluator: {
        evaluations: Array.isArray(data.as_evaluator?.evaluations) ? data.as_evaluator.evaluations : [],
        summary: data.as_evaluator?.summary || { total: 0, completed: 0, pending_to_evaluate: 0 },
      },
    };

    console.log("✅ Estructura procesada:", estructuraCompleta);
    console.log("📊 Como empleado:", estructuraCompleta.as_employee.evaluations.length);
    console.log("📊 Como evaluador:", estructuraCompleta.as_evaluator.evaluations.length);

    return estructuraCompleta;
  } catch (error: unknown) {
    console.error("❌ Error obteniendo mis evaluaciones:", error);
    return this.getDefaultEvaluationsStructure();
  }
}

  async obtenerEvaluacionParaCalificar(evaluacionId: number): Promise<EvaluacionParaCalificarDTO> {
    try {
      console.log("🔍 Obteniendo evaluación para calificar:", evaluacionId);

      const response = await fetch(`${this.baseUrl}/evaluations/${evaluacionId}/for-scoring`, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<EvaluacionParaCalificarDTO>(response);
      console.log("✅ Evaluación para calificar obtenida:", data);
      return data;
    } catch (error: unknown) {
      console.error("❌ Error obteniendo evaluación para calificar:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener evaluación para calificar";
      throw new Error(errorMessage);
    }
  }

  async enviarPuntuaciones(evaluacionId: number, puntuaciones: PuntuacionCriterioDTO[]): Promise<void> {
    try {
      console.log("📤 Enviando puntuaciones para evaluación:", evaluacionId, puntuaciones);

      for (const puntuacion of puntuaciones) {
        if (puntuacion.score < MIN_SCORE || puntuacion.score > MAX_SCORE) {
          throw new ErrorEvaluacion(`Puntuación fuera del rango (1-100): ${puntuacion.score}`, 400);
        }
      }

      const response = await fetch(`${this.baseUrl}/evaluations/${evaluacionId}/score`, {
        method: "PUT",
        headers: this.obtenerHeadersAuth(),
        body: JSON.stringify(puntuaciones),
      });

      await this.manejarRespuesta<void>(response);
      console.log("✅ Puntuaciones enviadas correctamente");
    } catch (error: unknown) {
      console.error("❌ Error enviando puntuaciones:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al enviar puntuaciones";
      throw new Error(errorMessage);
    }
  }

  async listarTodasLasEvaluaciones(filtros?: FiltrosEvaluacionParams): Promise<ResumenEvaluacionDTO[]> {
    try {
      console.log("🔍 Listando todas las evaluaciones...", filtros);

      const queryParams = new URLSearchParams();
      if (filtros?.evaluator_id) queryParams.append("evaluator_id", filtros.evaluator_id.toString());
      if (filtros?.employee_id) queryParams.append("employee_id", filtros.employee_id.toString());
      if (filtros?.period_id) queryParams.append("period_id", filtros.period_id.toString());
      if (filtros?.status) queryParams.append("status", filtros.status);

      const url = `${this.baseUrl}/evaluations${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<ResumenEvaluacionDTO[]>(response);
      console.log("✅ Todas las evaluaciones obtenidas:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("❌ Error listando todas las evaluaciones:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al listar evaluaciones";
      throw new Error(errorMessage);
    }
  }

  async getEvaluationsByPeriod(periodId: number): Promise<EvaluationListByPeriodResponseDTO[]> {
    try {
      console.log("🔍 Fetching evaluations for period:", periodId);
      const response = await fetch(`${this.baseUrl}/evaluations/period/${periodId}`, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<EvaluationListByPeriodResponseDTO[]>(response);
      console.log("✅ Evaluations by period loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("❌ Error fetching evaluations by period:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener evaluaciones por período";
      throw new Error(errorMessage);
    }
  }

  async getAverageScoresByDepartment(periodId?: number): Promise<AverageByDepartmentResponseDTO[]> {
    try {
      console.log("🔍 Fetching average scores by department...", { periodId });
      const queryParams = new URLSearchParams();
      if (periodId) queryParams.append("period_id", periodId.toString());

      const url = `${this.baseUrl}/evaluations/average-by-department${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<AverageByDepartmentResponseDTO[]>(response);
      console.log("✅ Average scores by department loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("❌ Error fetching average scores by department:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener promedios por departamento";
      throw new Error(errorMessage);
    }
  }

  async getEmployeePerformance(employeeId: number): Promise<EmployeePerformanceResponseDTO[]> {
    try {
      console.log("🔍 Fetching performance for employee:", employeeId);
      const response = await fetch(`${this.baseUrl}/evaluations/employee/${employeeId}`, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<EmployeePerformanceResponseDTO[]>(response);
      console.log("✅ Employee performance loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("❌ Error fetching employee performance:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener rendimiento del empleado";
      throw new Error(errorMessage);
    }
  }

  async getPendingEvaluationsByDepartment(): Promise<PendingByDepartmentResponseDTO[]> {
    try {
      console.log("🔍 Fetching pending evaluations by department...");
      const response = await fetch(`${this.baseUrl}/evaluations/pending-by-department`, {
        method: "GET",
        headers: this.obtenerHeadersAuth(),
      });

      const data = await this.manejarRespuesta<PendingByDepartmentResponseDTO[]>(response);
      console.log("✅ Pending evaluations by department loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      console.error("❌ Error fetching pending evaluations by department:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener evaluaciones pendientes por departamento";
      throw new Error(errorMessage);
    }
  }

  obtenerTextoEstado(status: string): string {
    const mapaEstados: Record<string, string> = {
      pending: "Pendiente",
      completed: "Completada",
      overdue: "Vencida",
      in_progress: "En Progreso",
      pendiente: "Pendiente",
      realizada: "Completada",
      atrasada: "Vencida",
    };
    return mapaEstados[status.toLowerCase()] || "Desconocido";
  }

  obtenerColorEstado(status: string): string {
    const mapaColores: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
      completed: "text-green-600 bg-green-50 border-green-200",
      overdue: "text-red-600 bg-red-50 border-red-200",
      in_progress: "text-blue-600 bg-blue-50 border-blue-200",
      pendiente: "text-yellow-600 bg-yellow-50 border-yellow-200",
      realizada: "text-green-600 bg-green-50 border-green-200",
      atrasada: "text-red-600 bg-red-50 border-red-200",
    };
    return mapaColores[status.toLowerCase()] || "text-gray-600 bg-gray-50 border-gray-200";
  }

  obtenerInfoPeso(peso: number) {
    if (peso >= 30) {
      return {
        nivel: "alto" as const,
        color: "bg-red-500",
        texto: "Peso alto en la evaluación",
      };
    }
    if (peso >= 20) {
      return {
        nivel: "medio" as const,
        color: "bg-yellow-500",
        texto: "Peso medio en la evaluación",
      };
    }
    return {
      nivel: "bajo" as const,
      color: "bg-green-500",
      texto: "Peso bajo en la evaluación",
    };
  }

  obtenerColorCategoria(categoria: string): string {
    const mapaColores: Record<string, string> = {
      productividad: "bg-blue-100 text-blue-800",
      conducta_laboral: "bg-green-100 text-green-800",
      habilidades: "bg-purple-100 text-purple-800",
      seguridad_trabajo: "bg-red-100 text-red-800",
    };
    return mapaColores[categoria] || "bg-gray-100 text-gray-800";
  }

  validarPuntuaciones(puntuaciones: Record<number, number>, criteriosRequeridos: number[]): boolean {
    return criteriosRequeridos.every(
      (criterioId) => puntuaciones[criterioId] !== undefined && puntuaciones[criterioId] >= MIN_SCORE && puntuaciones[criterioId] <= MAX_SCORE
    );
  }

  formatearPuntuacionesParaEnvio(puntuaciones: Record<number, number>, mapaAsignacion: Record<number, number>): PuntuacionCriterioDTO[] {
    return Object.entries(puntuaciones).map(([criterioId, puntuacion]) => ({
      assigned_criteria_id: mapaAsignacion[parseInt(criterioId)],
      score: puntuacion,
    }));
  }
}

// ==================== EXPORTACIÓN ====================
const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const exportarReporteEvaluacion = async (
  evaluationId: number,
  employeeName?: string,
  periodName?: string
): Promise<void> => {
  try {
    console.log("🔄 Exportando reporte individual:", evaluationId, { employeeName, periodName });
    const response = await fetch(`${API_BASE_URL}/export/evaluations/${evaluationId}/report`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    const date = new Date().toISOString().split('T')[0];
    const employeeNameSafe = employeeName ? employeeName.replace(/\s+/g, '_') : `evaluacion_${evaluationId}`;
    const periodSuffix = periodName ? `_${periodName.replace(/\s+/g, '_')}` : '';
    const filename = `reporte_${employeeNameSafe}${periodSuffix}_${date}.xlsx`;

    downloadFile(blob, filename);
    console.log(`✅ Reporte exportado exitosamente: ${filename}`);
  } catch (error: unknown) {
    console.error("❌ Error exportando reporte:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al exportar reporte";
    throw new Error(errorMessage);
  }
};

export const exportarEvaluacionesPeriodo = async (periodId: number): Promise<void> => {
  try {
    console.log("🔄 Exportando evaluaciones del período:", periodId);
    const response = await fetch(`${API_BASE_URL}/export/evaluations/export/period/${periodId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentDisposition = response.headers.get("content-disposition");
    let filename = `evaluaciones_periodo_${periodId}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    downloadFile(blob, filename);
    console.log("✅ Evaluaciones del período exportadas exitosamente");
  } catch (error: unknown) {
    console.error("❌ Error exportando evaluaciones del período:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al exportar evaluaciones del período";
    throw new Error(errorMessage);
  }
};

export const servicioEvaluaciones = new ServicioEvaluaciones();
export default servicioEvaluaciones;