import { API_BASE_URL } from '../constants/api';

export interface RoleReference {
  id: number;
  name: string;
  description: string;
}

export interface DepartmentReference {
  id: number;
  name: string;
  description?: string;
}

export interface PositionReference {
  id: number;
  name: string;
  description?: string;
  department_id: number;
  department_name: string;
}

export interface CriteriaReference {
  id: number;
  name: string;
  description?: string;
  category: string;
}

export interface PeriodReference {
  id: number;
  name: string;
  is_active: boolean;
}

export interface UserReference {
  id: number;
  name: string;
  email: string;
  role_name: string;
  position_name: string;
  department_name: string;
  is_active: boolean;
}

export interface ReferenceData {
  roles?: RoleReference[];
  departments?: DepartmentReference[];
  positions?: PositionReference[];
  criteria?: CriteriaReference[];
  periods?: PeriodReference[];
}

// Interfaz para la respuesta cruda del backend
interface RawPosition {
  id: number;
  name: string;
  description?: string;
  department?: string; // Para model.PositionReferenceDTO
  department_id?: number; // Para DTO.PositionReferenceDTO
  department_name?: string; // Para DTO.PositionReferenceDTO
}

class ReferenceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`,
    };
  }

  // Obtener referencias para formularios de usuario
  async getFormReferences(): Promise<ReferenceData> {
  console.log('🔍 Cargando referencias de formularios...');
  try {
    const url = `${API_BASE_URL}/references/forms`;
    console.log('📡 URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('✅ Referencias cargadas:', responseData);

    // Extraer el objeto 'data' de la respuesta
    const data = responseData.data || {};

    // Normalizar las posiciones
    const normalizedPositions: PositionReference[] = (data.positions || []).map((pos: RawPosition) => ({
      id: pos.id,
      name: pos.name,
      description: pos.description || undefined,
      department_id: pos.department_id || 0,
      department_name: pos.department_name || pos.department || 'Sin departamento',
    }));

    return {
      roles: data.roles || [],
      departments: data.departments || [],
      positions: normalizedPositions,
      criteria: data.criteria || [],
      periods: data.periods || [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error en getFormReferences:', message);
    throw new Error(`Error al obtener referencias de formularios: ${message}`);
  }
}

  // Alias para compatibilidad con código existente
  async getReferenceData(): Promise<ReferenceData> {
    return this.getFormReferences();
  }

  // Obtener referencias para evaluaciones
  async getEvaluationReferences(): Promise<ReferenceData> {
    try {
      const response = await fetch(`${API_BASE_URL}/references/evaluations`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Referencias de evaluaciones cargadas:', data);

      // Normalizar las posiciones para soportar ambas estructuras del backend
      const normalizedPositions: PositionReference[] = (data.positions || []).map((pos: RawPosition) => ({
        id: pos.id,
        name: pos.name,
        description: pos.description || undefined,
        department_id: pos.department_id || 0,
        department_name: pos.department_name || pos.department || 'Sin departamento',
      }));

      return {
        roles: data.roles || [],
        departments: data.departments || [],
        positions: normalizedPositions,
        criteria: data.criteria || [],
        periods: data.periods || [],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error en getEvaluationReferences:', message);
      throw new Error(`Error al obtener referencias de evaluaciones: ${message}`);
    }
  }

  // Obtener todas las referencias (admin)
  async getAllReferences(): Promise<ReferenceData> {
    try {
      const response = await fetch(`${API_BASE_URL}/references/all`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Todas las referencias cargadas:', data);

      // Normalizar las posiciones para soportar ambas estructuras del backend
      const normalizedPositions: PositionReference[] = (data.positions || []).map((pos: RawPosition) => ({
        id: pos.id,
        name: pos.name,
        description: pos.description || undefined,
        department_id: pos.department_id || 0,
        department_name: pos.department_name || pos.department || 'Sin departamento',
      }));

      return {
        roles: data.roles || [],
        departments: data.departments || [],
        positions: normalizedPositions,
        criteria: data.criteria || [],
        periods: data.periods || [],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error en getAllReferences:', message);
      throw new Error(`Error al obtener todas las referencias: ${message}`);
    }
  }

  // Obtener usuarios por rol
  async getUsersByRole(role: string): Promise<UserReference[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/references/users/${role}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: Error al obtener usuarios con rol ${role}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Usuarios por rol cargados:', data);
      return data || [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error en getUsersByRole:', message);
      throw new Error(`Error al obtener usuarios con rol ${role}: ${message}`);
    }
  }

  // Filtrar posiciones por departamento
  filterPositionsByDepartment(positions: PositionReference[], departmentId: number): PositionReference[] {
    return positions.filter(position => position.department_id === departmentId);
  }
}

export const referenceService = new ReferenceService();

// Exportar también getReferenceData para compatibilidad
export const getReferenceData = () => referenceService.getFormReferences();