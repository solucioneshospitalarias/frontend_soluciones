import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { API_BASE_URL } from '../constants/api';

// ==================== TIPOS ====================
interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Position {
  id: number;
  name: string;
  description: string;
  department_id: number;
  department: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

interface PositionFormData {
  name: string;
  description: string;
  department_id: number;
}

// ==================== SERVICIOS API ====================
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
};

const departmentService = {
  async getAll(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.data || [];
  },

  async create(data: DepartmentFormData): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear departamento');
    return result.data;
  },

  async update(id: number, data: Partial<DepartmentFormData>): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar departamento');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) throw new Error('HAS_ASSOCIATIONS');
      throw new Error(result.error || 'Error al eliminar departamento');
    }
  },
};

const positionService = {
  async getAll(): Promise<Position[]> {
    const response = await fetch(`${API_BASE_URL}/positions`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.data || [];
  },

  async create(data: PositionFormData): Promise<Position> {
    const response = await fetch(`${API_BASE_URL}/positions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear posición');
    return result.data;
  },

  async update(id: number, data: Partial<PositionFormData>): Promise<Position> {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar posición');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) throw new Error('HAS_ASSOCIATIONS');
      throw new Error(result.error || 'Error al eliminar posición');
    }
  },
};

// ... resto del componente igual

// ==================== COMPONENTE PRINCIPAL ====================
const OrganizationalConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'positions'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAssociationWarning, setShowAssociationWarning] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | Position | null>(null);
  const [deletingItem, setDeletingItem] = useState<Department | Position | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Estados de formulario
  const [formData, setFormData] = useState<DepartmentFormData | PositionFormData>({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, pos] = await Promise.all([
        departmentService.getAll(),
        positionService.getAll()
      ]);
      setDepartments(depts);
      setPositions(pos);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos';
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', ...(activeTab === 'positions' ? { department_id: 0 } : {}) });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleEdit = (item: Department | Position) => {
    setEditingItem(item);
    setFormData(item);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleDelete = (item: Department | Position) => {
    setDeletingItem(item);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    
    setDeleteLoading(true);
    try {
      if (activeTab === 'departments') {
        await departmentService.delete(deletingItem.id);
      } else {
        await positionService.delete(deletingItem.id);
      }
      await loadData();
      setShowConfirmModal(false);
      setDeletingItem(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar';
      if (errorMessage === 'HAS_ASSOCIATIONS') {
        setShowConfirmModal(false);
        setShowAssociationWarning(true);
      } else {
        console.error('Error deleting:', error);
        setFormError(errorMessage);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (activeTab === 'departments') {
        const departmentData: DepartmentFormData = {
          name: formData.name,
          description: formData.description,
        };
        if (editingItem) {
          await departmentService.update(editingItem.id, departmentData);
        } else {
          await departmentService.create(departmentData);
        }
      } else {
        const positionData: PositionFormData = {
          name: formData.name,
          description: formData.description,
          department_id: (formData as PositionFormData).department_id,
        };
        if (editingItem) {
          await positionService.update(editingItem.id, positionData);
        } else {
          await positionService.create(positionData);
        }
      }
      await loadData();
      setShowFormModal(false);
      setFormData({ name: '', description: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la solicitud';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPositions = positions.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg">
            <Settings className="w-4 h-4 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración Organizacional</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona los departamentos y posiciones de la empresa</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2 flex flex-col min-[450px]:flex-row gap-2">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'departments'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-xl'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 border border-transparent hover:border-green-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Departamentos
          </button>

          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'positions'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-xl'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 border border-transparent hover:border-green-300'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Posiciones
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mx-auto mb-6 bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'departments' ? 'departamentos' : 'posiciones'}...`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Crear {activeTab === 'departments' ? 'Departamento' : 'Posición'}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 mx-auto">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 text-sm font-medium">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto">
          {activeTab === 'departments' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dept.description || 'Sin descripción'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Posición</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPositions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pos.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {pos.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 line-clamp-2">{pos.description || 'Sin descripción'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(pos)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(pos)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Formulario */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Editar' : 'Crear'} {activeTab === 'departments' ? 'Departamento' : 'Posición'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                disabled={formLoading}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg transition"
                  />
                </div>

                {activeTab === 'positions' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={(formData as PositionFormData).department_id || ''}
                      onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg transition"
                    >
                      <option value="">Selecciona un departamento</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={formLoading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitForm}
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Confirmar Eliminación</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={deleteLoading}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">
                ¿Estás seguro de eliminar "<strong>{deletingItem?.name}</strong>"? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={deleteLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertencia de Asociaciones */}
      {showAssociationWarning && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No se puede eliminar</h3>
              </div>
              <button
                onClick={() => setShowAssociationWarning(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 font-medium mb-2">
                  Este {activeTab === 'departments' ? 'departamento' : 'posición'} tiene entidades asociadas
                </p>
                <p className="text-orange-700 text-sm">
                  <strong className="font-semibold">"{deletingItem?.name}"</strong> no puede ser eliminado 
                  porque tiene {activeTab === 'departments' ? 'posiciones o usuarios' : 'usuarios'} asignados.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium mb-2">
                  ¿Qué puedes hacer?
                </p>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  <li>Editar el nombre o descripción</li>
                  <li>Reasignar {activeTab === 'departments' ? 'las posiciones y usuarios' : 'los usuarios'} a otro {activeTab === 'departments' ? 'departamento' : 'posición'}</li>
                  <li>Luego podrás eliminarlo si ya no tiene datos asociados</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowAssociationWarning(false)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalConfigPage;