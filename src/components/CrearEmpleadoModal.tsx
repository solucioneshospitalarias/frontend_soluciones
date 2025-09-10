import React, { useState, useEffect } from 'react';
import { createUser } from '../services/userService';
import { referenceService, type ReferenceData } from '../services/referenceService';
import type { UserCreateDTO } from '../types/user';
import { Briefcase, UserCheck, X, Loader2, Shield, Calendar } from 'lucide-react';

interface CrearEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const CrearEmpleadoModal: React.FC<CrearEmpleadoModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<UserCreateDTO>({
    first_name: '',
    last_name: '',
    email: '',
    document: '',
    password: '',
    role_id: 0,
    position_id: 0,
    department_id: 0,
    hire_date: '',
  });

  const [references, setReferences] = useState<ReferenceData>({ roles: [], positions: [] });
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar referencias al abrir el modal
  useEffect(() => {
    if (show) {
      loadReferences();
    }
  }, [show]);

  // Actualizar department_id cuando cambie la posición
  useEffect(() => {
    if (form.position_id && references.positions && references.positions.length > 0) {
      const selectedPosition = references.positions.find(pos => pos.id === form.position_id);
      if (selectedPosition) {
        setForm(prev => ({ ...prev, department_id: selectedPosition.department_id }));
      }
    } else {
      setForm(prev => ({ ...prev, department_id: 0 }));
    }
  }, [form.position_id, references.positions]);

  const loadReferences = async () => {
    setLoadingReferences(true);
    setError(null);
    try {
      const data = await referenceService.getFormReferences();
      console.log('📚 Referencias cargadas:', data);
      setReferences(data);
    } catch (err) {
      console.error('❌ Error cargando referencias:', err);
      setError('Error al cargar las opciones del formulario. Por favor, intenta de nuevo.');
    } finally {
      setLoadingReferences(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    if (name === 'role_id' || name === 'position_id' || name === 'department_id') {
      parsedValue = parseInt(value) || 0;
    }

    setForm(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const validateForm = (): string | null => {
    if (!form.first_name.trim()) return 'El nombre es obligatorio.';
    if (!form.last_name.trim()) return 'El apellido es obligatorio.';
    if (!form.email.trim()) return 'El correo electrónico es obligatorio.';
    if (!form.document.trim()) return 'El documento es obligatorio.';
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.role_id === 0) return 'Debes seleccionar un rol.';
    if (form.position_id === 0) return 'Debes seleccionar un cargo.';
    if (!form.hire_date.trim()) return 'La fecha de contratación es obligatoria.';
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const payload: UserCreateDTO = {
        ...form,
        hire_date: `${form.hire_date}T00:00:00Z`,
      };

      console.log('🚀 Enviando payload:', payload);
      await createUser(payload);
      alert('✅ Empleado creado exitosamente');
      await onCreated();
      
      // Reset form
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        document: '',
        password: '',
        role_id: 0,
        position_id: 0,
        department_id: 0,
        hire_date: '',
      });
      onClose();
    } catch (err: unknown) {
      console.error('❌ Error creating user:', err);
      let errorMessage = 'Error al crear empleado';
      if (err instanceof Error) {
        errorMessage = err.message;
        if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
          const responseData = err.response as { data?: { details?: string } };
          errorMessage = responseData.data?.details || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      document: '',
      password: '',
      role_id: 0,
      position_id: 0,
      department_id: 0,
      hire_date: '',
    });
    setError(null);
    onClose();
  };

  // Obtener el departamento de la posición seleccionada
  const getSelectedPositionDepartment = () => {
    if (form.position_id && references.positions && references.positions.length > 0) {
      const selectedPosition = references.positions.find(pos => pos.id === form.position_id);
      return selectedPosition?.department_name || '';
    }
    return '';
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-green-500" />
            Crear Nuevo Empleado
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingReferences ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Cargando opciones...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre(s)</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Nombre(s)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Apellidos"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Documento de Identidad</label>
                  <input
                    name="document"
                    value={form.document}
                    onChange={handleChange}
                    type="text"
                    placeholder="Documento de identidad"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Credenciales */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Credenciales de Acceso</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Fecha de Contratación
                  </label>
                  <input
                    name="hire_date"
                    value={form.hire_date}
                    onChange={handleChange}
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Asignación Organizacional */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Asignación Organizacional</h4>
              <div className="space-y-4">
                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="inline w-4 h-4 mr-1" />
                    Rol del Sistema
                  </label>
                  <select
                    name="role_id"
                    value={form.role_id}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value={0}>Seleccionar rol</option>
                    {references.roles && references.roles.length > 0 ? (
                      references.roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}{role.description ? ` - ${role.description}` : ''}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay roles disponibles</option>
                    )}
                  </select>
                </div>

                {/* Posición/Cargo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Cargo
                  </label>
                  <select
                    name="position_id"
                    value={form.position_id}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value={0}>Seleccionar cargo</option>
                    {references.positions && references.positions.length > 0 ? (
                      references.positions.map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name} - {position.department_name}
                          {position.description ? ` (${position.description})` : ''}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay cargos disponibles</option>
                    )}
                  </select>
                  {form.position_id > 0 && getSelectedPositionDepartment() && (
                    <p className="text-sm text-blue-600 mt-1">
                      📍 Departamento: {getSelectedPositionDepartment()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading || loadingReferences}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Empleado'
                )}
              </button>
              <button 
                onClick={handleClose} 
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearEmpleadoModal;