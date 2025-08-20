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

class ReferenceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
        headers: this.getAuthHeaders()
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Referencias cargadas:', data);
      return data;

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
    const response = await fetch(`${API_BASE_URL}/references/evaluations`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener referencias de evaluaciones');
    }

    return response.json();
  }

  // Obtener todas las referencias (admin)
  async getAllReferences(): Promise<ReferenceData> {
    const response = await fetch(`${API_BASE_URL}/references/all`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener todas las referencias');
    }

    return response.json();
  }

  // Obtener usuarios por rol
  async getUsersByRole(role: string): Promise<UserReference[]> {
    const response = await fetch(`${API_BASE_URL}/references/users/${role}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error al obtener usuarios con rol ${role}`);
    }

    return response.json();
  }

  // Filtrar posiciones por departamento
  filterPositionsByDepartment(positions: PositionReference[], departmentId: number): PositionReference[] {
    return positions.filter(position => position.department_id === departmentId);
  }
}

export const referenceService = new ReferenceService();

// Exportar también getReferenceData para compatibilidad
export const getReferenceData = () => referenceService.getFormReferences();