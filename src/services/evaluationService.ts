// src/services/evaluationService.ts

import { API_BASE_URL } from "../constants/api";
import type {
  Criteria,
  Period,
  Template,
  Evaluation,
  Employee,
  CreateCriteriaDTO,
  CreatePeriodDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  CreateEvaluationsFromTemplateDTO,
  UpdatePeriodDTO,
  UpdateCriteriaDTO,
  EvaluacionParaCalificarDTO,
  ResumenEvaluacionDTO,
  MisEvaluacionesRespuestaDTO,
  PuntuacionCriterioDTO,
  FiltrosEvaluacionParams,
  InfoPeso,
  HRDashboardDTO,
  AverageByDepartmentResponseDTO,
  EmployeePerformanceResponseDTO,
  PendingByDepartmentResponseDTO,
  EvaluationReportDTO,
  SubmitEvaluationDTO,
} from "../types/evaluation";

export class ErrorEvaluacion extends Error {
  public readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
    this.name = "ErrorEvaluacion";
  }
}

export class EvaluationService {
  private readonly baseUrl: string = API_BASE_URL;

  // ========== MÉTODOS HELPER ==========

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new ErrorEvaluacion("Token de autenticación no encontrado", 401);
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const status = response.status;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use default error message
      }

      throw new ErrorEvaluacion(errorMessage, status);
    }

    const data = await response.json();
    if (data.success === false) {
      throw new ErrorEvaluacion(data.message || "Error en la operación", 400);
    }

    if (data.data === null || data.data === undefined) {
      console.log("⚠️ Backend retornó data: null, usando estructura por defecto");
      return this.getDefaultStructure() as T;
    }

    return data.data || data;
  }

  private getDefaultStructure(): MisEvaluacionesRespuestaDTO {
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

  // ==================== CRITERIA ====================

  async getCriteria(): Promise<Criteria[]> {
    try {
      console.log("🔍 Fetching criteria...");
      const response = await fetch(`${this.baseUrl}/criteria`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Criteria[]>(response);
      console.log("✅ Criteria loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching criteria:", error);
      throw error;
    }
  }

  async createCriteria(criteriaData: CreateCriteriaDTO): Promise<Criteria> {
    try {
      console.log("🔄 Creating criteria...", criteriaData);
      const response = await fetch(`${this.baseUrl}/criteria`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(criteriaData),
      });

      const data = await this.handleResponse<Criteria>(response);
      console.log("✅ Criteria created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating criteria:", error);
      throw error;
    }
  }

  async updateCriteria(id: number, criteriaData: UpdateCriteriaDTO): Promise<Criteria> {
    try {
      console.log("🔄 Updating criteria...", id, criteriaData);
      const response = await fetch(`${this.baseUrl}/criteria/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(criteriaData),
      });

      const data = await this.handleResponse<Criteria>(response);
      console.log("✅ Criteria updated:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating criteria:", error);
      throw error;
    }
  }

  async deleteCriteria(id: number): Promise<void> {
    try {
      console.log("🗑️ Deleting criteria:", id);
      const response = await fetch(`${this.baseUrl}/criteria/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse<void>(response);
      console.log("✅ Criteria deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting criteria:", error);
      throw error;
    }
  }

  // ==================== PERIODS ====================

  async getPeriods(): Promise<Period[]> {
    try {
      console.log("🔍 Fetching periods...");
      const response = await fetch(`${this.baseUrl}/periods`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Period[]>(response);
      console.log("✅ Periods loaded:", data);

      if (data && data.length > 0) {
        console.log("📊 First period structure:", JSON.stringify(data[0], null, 2));
        console.log("📊 Period fields:", Object.keys(data[0]));
      }

      const now = new Date();
      const filteredPeriods = data.filter((period) => {
        const dueDate = new Date(period.due_date);
        return dueDate >= now;
      });

      console.log("✅ Filtered periods:", filteredPeriods);
      return Array.isArray(filteredPeriods) ? filteredPeriods : [];
    } catch (error) {
      console.error("❌ Error fetching periods:", error);
      throw error;
    }
  }

  async getPeriodById(id: number): Promise<Period> {
    try {
      console.log("🔍 Fetching period by ID:", id);
      const response = await fetch(`${this.baseUrl}/periods/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Period>(response);
      console.log("✅ Period loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching period:", error);
      throw error;
    }
  }

  async createPeriod(periodData: CreatePeriodDTO): Promise<Period> {
    try {
      console.log("🔄 Creating period...", periodData);
      const response = await fetch(`${this.baseUrl}/periods`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(periodData),
      });

      const data = await this.handleResponse<Period>(response);
      console.log("✅ Period created:", data);
      console.log("📊 Created period structure:", JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error("❌ Error creating period:", error);
      throw error;
    }
  }

  async updatePeriod(id: number, periodData: UpdatePeriodDTO): Promise<Period> {
    try {
      console.log("🔄 Updating period...", id, periodData);
      const response = await fetch(`${this.baseUrl}/periods/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(periodData),
      });

      const data = await this.handleResponse<Period>(response);
      console.log("✅ Period updated:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating period:", error);
      throw error;
    }
  }

  async togglePeriodStatus(id: number): Promise<Period> {
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
    } catch (error) {
      console.error("❌ Error toggling period status:", error);
      throw error;
    }
  }

  async deletePeriod(id: number): Promise<void> {
    try {
      console.log("🗑️ Deleting period:", id);
      const response = await fetch(`${this.baseUrl}/periods/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse<void>(response);
      console.log("✅ Period deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting period:", error);
      throw error;
    }
  }

  // ==================== TEMPLATES ====================

  async getTemplates(): Promise<Template[]> {
    try {
      console.log("🔍 Fetching templates...");
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Template[]>(response);
      console.log("✅ Templates loaded:", data);
      data.forEach((template, index) => {
        console.log(`📋 Template ${index + 1} criteria:`, template.criteria);
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching templates:", error);
      throw error;
    }
  }

  async getTemplateById(id: number): Promise<Template> {
    try {
      console.log("🔍 Fetching template by ID:", id);
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Template>(response);
      console.log("✅ Template loaded:", data);
      console.log("📋 Template criteria:", data.criteria);
      return data;
    } catch (error) {
      console.error("❌ Error fetching template:", error);
      throw error;
    }
  }

  async createTemplate(templateData: CreateTemplateDTO): Promise<Template> {
    try {
      console.log("🔄 Creating template...", templateData);
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      const data = await this.handleResponse<Template>(response);
      console.log("✅ Template created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating template:", error);
      throw error;
    }
  }

  async updateTemplate(id: number, templateData: UpdateTemplateDTO): Promise<Template> {
    try {
      console.log("🔄 Updating template:", id, templateData);
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      const data = await this.handleResponse<Template>(response);
      console.log("✅ Template updated:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating template:", error);
      throw error;
    }
  }

  async deleteTemplate(id: number): Promise<void> {
    try {
      console.log("🗑️ Deleting template:", id);
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse<void>(response);
      console.log("✅ Template deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting template:", error);
      throw error;
    }
  }

  async cloneTemplate(id: number, newName?: string): Promise<Template> {
    try {
      console.log("📋 Cloning template:", id, newName);
      const body = newName ? JSON.stringify({ name: newName }) : undefined;

      const response = await fetch(`${this.baseUrl}/templates/${id}/clone`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body,
      });

      const data = await this.handleResponse<Template>(response);
      console.log("✅ Template cloned:", data);
      return data;
    } catch (error) {
      console.error("❌ Error cloning template:", error);
      throw error;
    }
  }

  // ==================== EVALUATIONS ====================

  async getEvaluations(): Promise<Evaluation[]> {
    try {
      console.log("🔍 Fetching evaluations...");
      const response = await fetch(`${this.baseUrl}/evaluations`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Evaluation[]>(response);
      console.log("✅ Evaluations loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching evaluations:", error);
      throw error;
    }
  }

  async createEvaluationsFromTemplate(
    evaluationsData: CreateEvaluationsFromTemplateDTO
  ): Promise<{ evaluatedEmployeeIds: number[]; count: number }> {
    try {
      console.log("🔄 Creating evaluations from template...", evaluationsData);

      const backendPayload = {
        template_id: evaluationsData.template_id,
        period_id: evaluationsData.period_id,
        evaluator_id: evaluationsData.evaluator_id,
        employee_ids: evaluationsData.employee_ids,
      };

      console.log("📤 Backend payload:", backendPayload);

      const response = await fetch(`${this.baseUrl}/evaluations/from-template`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(backendPayload),
      });

      const data = await this.handleResponse<{
        evaluatedEmployeeIds: number[];
        count: number;
      }>(response);
      console.log("✅ Evaluations created:", data);
      return data;
    } catch (error) {
      console.error("❌ Error creating evaluations:", error);
      throw error;
    }
  }

  async deleteEvaluation(id: number): Promise<void> {
    try {
      console.log("🗑️ Deleting evaluation:", id);
      const response = await fetch(`${this.baseUrl}/evaluations/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse<void>(response);
      console.log("✅ Evaluation deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting evaluation:", error);
      throw error;
    }
  }

  // ==================== EMPLOYEES ====================

  async getEmployees(): Promise<Employee[]> {
    try {
      console.log("🔍 Fetching employees...");
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<Employee[]>(response);
      console.log("✅ Employees loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      throw error;
    }
  }

  async getMyEvaluations(filters?: FiltrosEvaluacionParams): Promise<MisEvaluacionesRespuestaDTO> {
    try {
      console.log("🔍 Fetching my evaluations...", filters);

      // Validate status if provided
      if (filters?.status && !['pending', 'completed', 'overdue'].includes(filters.status)) {
        throw new ErrorEvaluacion(`Estado inválido: ${filters.status}. Debe ser 'pending', 'completed' o 'overdue'.`, 400);
      }

      const queryParams = new URLSearchParams();
      if (filters?.period_id) queryParams.append("period_id", filters.period_id.toString());
      if (filters?.status) queryParams.append("status", filters.status);

      const url = `${this.baseUrl}/me/evaluations${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<MisEvaluacionesRespuestaDTO>(response);
      console.log("✅ My evaluations processed:", data);

      const estructuraCompleta: MisEvaluacionesRespuestaDTO = {
        as_employee: {
          evaluations: data.as_employee?.evaluations || [],
          summary: {
            total: data.as_employee?.summary?.total || 0,
            completed: data.as_employee?.summary?.completed || 0,
            pending: data.as_employee?.summary?.pending || 0,
          },
        },
        as_evaluator: {
          evaluations: data.as_evaluator?.evaluations || [],
          summary: {
            total: data.as_evaluator?.summary?.total || 0,
            completed: data.as_evaluator?.summary?.completed || 0,
            pending_to_evaluate: data.as_evaluator?.summary?.pending_to_evaluate || 0,
          },
        },
      };

      return estructuraCompleta;
    } catch (error) {
      console.error("❌ Error fetching my evaluations:", error);
      if (error instanceof ErrorEvaluacion && error.status >= 500) {
        console.log("⚠️ Server error, returning empty structure");
        return this.getDefaultStructure();
      }
      throw error;
    }
  }

  // ==================== NEW METHODS FROM SUGGESTED SERVICE ====================

  async getHRDashboard(): Promise<HRDashboardDTO> {
    try {
      console.log("🔍 Fetching HR dashboard...");
      const response = await fetch(`${this.baseUrl}/evaluations/dashboard`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<HRDashboardDTO>(response);
      console.log("✅ HR dashboard loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching HR dashboard:", error);
      throw error;
    }
  }

  async listEvaluations(filters?: FiltrosEvaluacionParams): Promise<ResumenEvaluacionDTO[]> {
    try {
      console.log("🔍 Listing all evaluations...", filters);

      const queryParams = new URLSearchParams();
      if (filters?.evaluator_id) queryParams.append("evaluator_id", filters.evaluator_id.toString());
      if (filters?.employee_id) queryParams.append("employee_id", filters.employee_id.toString());
      if (filters?.period_id) queryParams.append("period_id", filters.period_id.toString());
      if (filters?.status) queryParams.append("status", filters.status);

      const url = `${this.baseUrl}/evaluations${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<ResumenEvaluacionDTO[]>(response);
      console.log("✅ All evaluations loaded:", data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error listing all evaluations:", error);
      throw error;
    }
  }

  async getEvaluationsByPeriod(periodId: number): Promise<ResumenEvaluacionDTO[]> {
    try {
      console.log("🔍 Fetching evaluations by period:", periodId);
      const response = await fetch(`${this.baseUrl}/evaluations/period/${periodId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<ResumenEvaluacionDTO[]>(response);
      console.log("✅ Evaluations by period loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching evaluations by period:", error);
      throw error;
    }
  }

  async getAverageScoresByDepartment(periodId?: number): Promise<AverageByDepartmentResponseDTO[]> {
    try {
      console.log("🔍 Fetching average scores by department...", { periodId });
      const url = periodId
        ? `${this.baseUrl}/evaluations/average-by-department?period_id=${periodId}`
        : `${this.baseUrl}/evaluations/average-by-department`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<AverageByDepartmentResponseDTO[]>(response);
      console.log("✅ Average scores by department loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching average scores by department:", error);
      throw error;
    }
  }

  async getEmployeePerformance(employeeId: number): Promise<EmployeePerformanceResponseDTO[]> {
    try {
      console.log("🔍 Fetching employee performance:", employeeId);
      const response = await fetch(`${this.baseUrl}/evaluations/employee/${employeeId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<EmployeePerformanceResponseDTO[]>(response);
      console.log("✅ Employee performance loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching employee performance:", error);
      throw error;
    }
  }

  async getPendingEvaluationsByDepartment(): Promise<PendingByDepartmentResponseDTO[]> {
    try {
      console.log("🔍 Fetching pending evaluations by department...");
      const response = await fetch(`${this.baseUrl}/evaluations/pending-by-department`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<PendingByDepartmentResponseDTO[]>(response);
      console.log("✅ Pending evaluations by department loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching pending evaluations by department:", error);
      throw error;
    }
  }

  async getEvaluationForScoring(evaluationId: number): Promise<EvaluacionParaCalificarDTO> {
    try {
      console.log("🔍 Fetching evaluation for scoring:", evaluationId);
      const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/for-scoring`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<EvaluacionParaCalificarDTO>(response);
      console.log("✅ Evaluation for scoring obtained:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching evaluation for scoring:", error);
      throw error;
    }
  }

  async submitScores(evaluationId: number, scores: PuntuacionCriterioDTO[]): Promise<void> {
    try {
      console.log("📤 Submitting scores for evaluation:", evaluationId, scores);

      for (const score of scores) {
        if (score.score < 1 || score.score > 5) {
          throw new ErrorEvaluacion(`Score out of range (1-5): ${score.score}`, 400);
        }
      }

      const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/score`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(scores),
      });

      await this.handleResponse<void>(response);
      console.log("✅ Scores submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting scores:", error);
      throw error;
    }
  }

  async submitCompleteEvaluation(evaluationId: number, data: SubmitEvaluationDTO): Promise<void> {
    try {
      console.log("📤 Submitting complete evaluation:", evaluationId, data);
      const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/submit`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      await this.handleResponse<void>(response);
      console.log("✅ Complete evaluation submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting complete evaluation:", error);
      throw error;
    }
  }

  async getEvaluationReport(evaluationId: number): Promise<EvaluationReportDTO> {
    try {
      console.log("🔍 Fetching evaluation report:", evaluationId);
      const response = await fetch(`${this.baseUrl}/evaluations/${evaluationId}/report`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const data = await this.handleResponse<EvaluationReportDTO>(response);
      console.log("✅ Evaluation report loaded:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching evaluation report:", error);
      throw error;
    }
  }

  // ==================== LEGACY METHODS ====================

  async obtenerMisEvaluaciones(
    filtros?: FiltrosEvaluacionParams
  ): Promise<MisEvaluacionesRespuestaDTO> {
    return this.getMyEvaluations(filtros);
  }

  async listarTodasLasEvaluaciones(
    filtros?: FiltrosEvaluacionParams
  ): Promise<ResumenEvaluacionDTO[]> {
    return this.listEvaluations(filtros);
  }

  async obtenerEvaluacionParaCalificar(
    evaluacionId: number
  ): Promise<EvaluacionParaCalificarDTO> {
    return this.getEvaluationForScoring(evaluacionId);
  }

  async obtenerReporteEvaluacion(evaluationId: number): Promise<EvaluationReportDTO> {
    return this.getEvaluationReport(evaluationId);
  }

  async crearEvaluacionesDesdePlantilla(
    data: CreateEvaluationsFromTemplateDTO
  ): Promise<{ evaluatedEmployeeIds: number[]; count: number }> {
    return this.createEvaluationsFromTemplate(data);
  }

  // ==================== UTILITY METHODS ====================

  async deactivateItem(type: "criteria" | "template", id: number): Promise<void> {
    try {
      console.log(`📴 Deactivating ${type}:`, id);
      console.warn(`⚠️ Simulating deactivation of ${type} - implement in backend`);

      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`✅ ${type} deactivated successfully (simulated)`);
    } catch (error) {
      console.error(`❌ Error deactivating ${type}:`, error);
      throw error;
    }
  }

  obtenerTextoEstado(status: string): string {
    const mapaEstados: Record<string, string> = {
      pending: 'Pendiente',
      completed: 'Completada',
      overdue: 'Vencida',
      in_progress: 'En Progreso',
      pendiente: 'Pendiente',
      realizada: 'Completada',
      atrasada: 'Vencida',
    };
    return mapaEstados[status.toLowerCase()] || 'Desconocido';
  }

  obtenerColorEstado(status: string): string {
    const mapaColores: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      completed: 'text-green-600 bg-green-50 border-green-200',
      overdue: 'text-red-600 bg-red-50 border-red-200',
      in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
      pendiente: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      realizada: 'text-green-600 bg-green-50 border-green-200',
      atrasada: 'text-red-600 bg-yellow-50 border-red-200',
    };
    return mapaColores[status.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  obtenerInfoPeso(peso: number): InfoPeso {
    if (peso >= 30) {
      return {
        nivel: "alto",
        color: "bg-red-500",
        texto: "Peso alto en la evaluación",
      };
    }
    if (peso >= 20) {
      return {
        nivel: "medio",
        color: "bg-yellow-500",
        texto: "Peso medio en la evaluación",
      };
    }
    return {
      nivel: "bajo",
      color: "bg-green-500",
      texto: "Peso bajo en la evaluación",
    };
  }

  obtenerColorCategoria(categoria: string): string {
    const mapaColores: Record<string, string> = {
      productividad: "bg-blue-100 text-blue-800",
      conducta_laboral: "bg-green-100 text-green-800",
      habilidades: "bg-purple-100 text-purple-800",
    };
    return mapaColores[categoria] || "bg-gray-100 text-gray-800";
  }

  validarPuntuaciones(
    puntuaciones: Record<number, number>,
    criteriosRequeridos: number[]
  ): boolean {
    return criteriosRequeridos.every(
      (criterioId) =>
        puntuaciones[criterioId] !== undefined &&
        puntuaciones[criterioId] >= 1 &&
        puntuaciones[criterioId] <= 5
    );
  }

  formatearPuntuacionesParaEnvio(
    puntuaciones: Record<number, number>,
    mapaAsignacion: Record<number, number>
  ): PuntuacionCriterioDTO[] {
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

export async function exportarReporteEvaluacion(evaluationId: number): Promise<void> {
  try {
    console.log("🔄 Exporting individual report:", evaluationId);
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

    const contentDisposition = response.headers.get("content-disposition");
    let filename = `evaluacion_${evaluationId}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    downloadFile(blob, filename);
    console.log("✅ Report exported successfully");
  } catch (error) {
    console.error("❌ Error exporting report:", error);
    throw error;
  }
}

export async function exportarEvaluacionesPeriodo(periodId: number): Promise<void> {
  try {
    console.log("🔄 Exporting period evaluations:", periodId);
    const response = await fetch(
      `${API_BASE_URL}/export/evaluations/export/period/${periodId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

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
    console.log("✅ Period evaluations exported successfully");
  } catch (error) {
    console.error("❌ Error exporting period evaluations:", error);
    throw error;
  }
}

// Export singleton instance
export const evaluationService = new EvaluationService();
export const servicioEvaluaciones = evaluationService; // Maintain legacy alias
export default evaluationService;