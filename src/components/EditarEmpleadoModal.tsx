import React, { useState, useEffect } from 'react';
import { getUserById, updateUser } from '../services/userService';
import { referenceService, type ReferenceData } from '../services/referenceService';
import type { User, UserUpdateDTO } from '../types/user';
import { Building, Briefcase, UserCheck, X, Loader2, Shield, Calendar, Mail, Hash, Save, AlertCircle } from 'lucide-react';

interface EditarEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  userId: number | null;
}

const EditarEmpleadoModal: React.FC<EditarEmpleadoModalProps> = ({ 
  show, 
  onClose, 
  onUpdated, 
  userId 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserUpdateDTO>({});
  const [references, setReferences] = useState<ReferenceData>({});
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (show && userId) {
      loadUserData();
      loadReferences();
    }
  }, [show, userId]);

  // Actualizar department_id cuando cambie la posición
  useEffect(() => {
    if (form.position_id && references.positions) {
      const selectedPosition = references.positions.find(pos => pos.id === form.position_id);
      if (selectedPosition) {
        setForm(prev => ({ ...prev, department_id: selectedPosition.department_id }));
      }
    }
  }, [form.position_id, references.positions]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoadingUser(true);
    setError(null);
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      
      // Inicializar el formulario con los datos del usuario
      setForm({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        document: userData.document,
        is_active: userData.is_active,
        role_id: userData.role_id,
        position_id: userData.position_id,
        department_id: userData.department_id,
        hire_date: userData.hire_date ? userData.hire_date.split('T')[0] : '',
      });
    } catch (err) {
      console.error('Error cargando usuario:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoadingUser(false);
    }
  };

  const loadReferences = async () => {
    setLoadingReferences(true);
    try {
      const data = await referenceService.getFormReferences();
      setReferences(data);
    } catch (err) {
      console.error('Error cargando referencias:', err);
      setError('Error al cargar las opciones del formulario');
    } finally {
      setLoadingReferences(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean = value;

    if (name === 'role_id' || name === 'position_id' || name === 'department_id') {
      parsedValue = parseInt(value) || 0;
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setForm(prev => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.first_name?.trim()) {
      errors.first_name = 'El nombre es obligatorio.';
    }
    if (!form.last_name?.trim()) {
      errors.last_name = 'El apellido es obligatorio.';
    }
    if (!form.email?.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Formato de correo electrónico inválido.';
    }
    if (!form.document?.trim()) {
      errors.document = 'El documento es obligatorio.';
    }
    if (form.role_id === 0) {
      errors.role_id = 'Debes seleccionar un rol.';
    }
    if (form.position_id === 0) {
      errors.position_id = 'Debes seleccionar un cargo.';
    }
    if (form.hire_date && new Date(form.hire_date) > new Date()) {
      errors.hire_date = 'La fecha de contratación no puede ser futura.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: UserUpdateDTO = {
        ...form,
        hire_date: form.hire_date ? `${form.hire_date}T00:00:00Z` : undefined,
      };

      await updateUser(userId, payload);
      alert('✅ Empleado actualizado exitosamente');
      await onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.details || err.message || 'Error al actualizar empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUser(null);
    setForm({});
    setError(null);
    setFieldErrors({});
    onClose();
  };

  // Obtener el departamento de la posición seleccionada
  const getSelectedPositionDepartment = () => {
    if (form.position_id && references.positions) {
      const selectedPosition = references.positions.find(pos => pos.id === form.position_id);
      return selectedPosition?.department_name || '';
    }
    return '';
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-500" />
            Editar Empleado
            {user && <span className="text-lg text-gray-500">#{user.id}</span>}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {(loadingUser || loadingReferences) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error general */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Información Personal */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre(s) *
                    </label>
                    <input
                      name="first_name"
                      value={form.first_name || ''}
                      onChange={handleChange}
                      type="text"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.first_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nombre(s)"
                    />
                    {fieldErrors.first_name && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      name="last_name"
                      value={form.last_name || ''}
                      onChange={handleChange}
                      type="text"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.last_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Apellidos"
                    />
                    {fieldErrors.last_name && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.last_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email *
                    </label>
                    <input
                      name="email"
                      value={form.email || ''}
                      onChange={handleChange}
                      type="email"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="correo@empresa.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Documento *
                    </label>
                    <input
                      name="document"
                      value={form.document || ''}
                      onChange={handleChange}
                      type="text"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.document ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Número de documento"
                    />
                    {fieldErrors.document && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.document}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Información Laboral
                </h4>
                <div className="space-y-4">
                  {/* Fecha de contratación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Fecha de Contratación
                    </label>
                    <input
                      name="hire_date"
                      value={form.hire_date || ''}
                      onChange={handleChange}
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.hire_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.hire_date && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.hire_date}</p>
                    )}
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="inline w-4 h-4 mr-1" />
                      Rol del Sistema *
                    </label>
                    <select
                      name="role_id"
                      value={form.role_id || 0}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.role_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value={0}>Seleccionar rol</option>
                      {references.roles?.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.role_id && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.role_id}</p>
                    )}
                  </div>

                  {/* Posición/Cargo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="inline w-4 h-4 mr-1" />
                      Cargo *
                    </label>
                    <select
                      name="position_id"
                      value={form.position_id || 0}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.position_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value={0}>Seleccionar cargo</option>
                      {references.positions?.map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name} - {position.department_name}
                          {position.description && ` (${position.description})`}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.position_id && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.position_id}</p>
                    )}
                    {form.position_id && form.position_id > 0 && getSelectedPositionDepartment() && (
                      <p className="text-sm text-blue-600 mt-1">
                        📍 Departamento: {getSelectedPositionDepartment()}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del empleado
                    </label>
                    <div className="flex gap-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="is_active_radio"
                          checked={form.is_active === true}
                          onChange={() => setForm(prev => ({ ...prev, is_active: true }))}
                          className="text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-gray-700">Activo</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="is_active_radio"
                          checked={form.is_active === false}
                          onChange={() => setForm(prev => ({ ...prev, is_active: false }))}
                          className="text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-gray-700">Inactivo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingUser || loadingReferences}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Actualizar Empleado
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditarEmpleadoModal;