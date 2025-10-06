import React, { useState, useEffect } from 'react';
import { getUserById, updateUser, adminResetPassword } from '../services/userService';
import { referenceService, type ReferenceData } from '../services/referenceService';
import type { User, UserUpdateDTO } from '../types/user'; // Asumiendo que PasswordResetDTO está en el service
import { Briefcase, UserCheck, X, Loader2, Shield, Calendar, Mail, Hash, Save, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';

// ✅ Tipo local para el form de password (incluye confirm para frontend)
interface PasswordForm extends Partial<{ new_password: string; confirm_password: string }> {}

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
  const [form, setForm] = useState<Partial<UserUpdateDTO>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ new_password: '', confirm_password: '' }); // ✅ Tipo local
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'strong'>('weak');
  const [references, setReferences] = useState<ReferenceData>({});
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos cuando se abre el modal (sin cambios)
  useEffect(() => {
    if (show && userId) {
      loadUserData();
      loadReferences();
    }
  }, [show, userId]);

  // Actualizar department_id cuando cambie la posición (sin cambios)
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

  // ✅ Validar password (mínimo 6 chars, como pediste)
  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    const { new_password, confirm_password } = passwordForm;

    if (!new_password || new_password.length < 6) { // ✅ Cambiado a 6
      errors.new_password = 'La contraseña debe tener al menos 6 caracteres.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(new_password)) {
      errors.new_password = 'Debe incluir mayúscula, minúscula y número.';
    } else {
      setPasswordStrength(new_password.length > 10 ? 'strong' : 'weak'); // Ajuste simple
    }

    if (new_password && confirm_password && new_password !== confirm_password) {
      errors.confirm_password = 'Las contraseñas no coinciden.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Manejar cambio en password fields
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value } as PasswordForm)); // ✅ Cast para TS

    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof passwordErrors];
        return newErrors;
      });
    }

    if (name === 'new_password') {
      validatePassword(); // Actualiza strength en tiempo real
    }
  };

  // ✅ Reset password (independiente de handleSubmit)
  const handlePasswordReset = async () => {
    if (!userId || !validatePassword()) return;

    setLoadingPassword(true);
    setError(null);

    try {
      await adminResetPassword(userId, passwordForm.new_password as string);
      
      setSuccessMessage('¡Contraseña reseteada exitosamente! El usuario recibirá un email de notificación.');
      setShowSuccess(true);
      
      // Limpiar
      setPasswordForm({ new_password: '', confirm_password: '' });
      setPasswordErrors({});
      setShowPasswordSection(false);
      
      await onUpdated(); // Refresca si es necesario
      
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error reseteando contraseña:', err);
      const axiosError = err as AxiosError<{ details?: string }>;
      setError(
        axiosError.response?.data?.details ||
        axiosError.message ||
        'Error al resetear la contraseña.'
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  // ✅ handleChange (sin cambios, del original)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean = value;

    if (name === 'role_id' || name === 'position_id' || name === 'department_id') {
      parsedValue = value === '' ? 0 : parseInt(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setForm(prev => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // ✅ validateForm (sin cambios, del original)
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
    if (!form.role_id) {
      errors.role_id = 'Debes seleccionar un rol.';
    }
    if (!form.position_id) {
      errors.position_id = 'Debes seleccionar un cargo.';
    }
    if (form.hire_date && new Date(form.hire_date) > new Date()) {
      errors.hire_date = 'La fecha de contratación no puede ser futura.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ handleSubmit (sin cambios, del original, pero con successMessage dinámico)
  const handleSubmit = async (e: React.FormEvent) => { // ✅ Ahora TS lo encuentra
    e.preventDefault();
    
    if (!userId || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: UserUpdateDTO = {
        ...form,
        hire_date: form.hire_date ? `${form.hire_date}T00:00:00Z` : undefined,
      } as UserUpdateDTO;

      await updateUser(userId, payload);
      
      setSuccessMessage('¡Empleado actualizado exitosamente!'); // ✅ Dinámico
      setShowSuccess(true);
      await onUpdated();
      
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage('');
        onClose(); // Cierra después del éxito
      }, 2000);
      
    } catch (err) {
      console.error('Error updating user:', err);
      const axiosError = err as AxiosError<{ details?: string }>;
      setError(
        axiosError.response?.data?.details ||
        axiosError.message ||
        'Error al actualizar empleado'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading || loadingPassword) return;
    setUser(null);
    setForm({});
    setPasswordForm({ new_password: '', confirm_password: '' }); // ✅ Limpia passwords
    setError(null);
    setFieldErrors({});
    setPasswordErrors({});
    setShowSuccess(false);
    setSuccessMessage('');
    setShowPasswordSection(false);
    onClose();
  };

  // getSelectedPositionDepartment (sin cambios)
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
        
        {/* Success State (con mensaje dinámico) */}
        {showSuccess ? (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Éxito!</h3>
              <p className="text-gray-600">{successMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header (sin cambios) */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-500" />
                Editar Empleado
                {user && <span className="text-lg text-gray-500">#{user.id}</span>}
              </h3>
              <button 
                onClick={handleClose} 
                disabled={loading || loadingPassword}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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

                  {/* Información Personal (sin cambios) */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Información Personal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ... (campos existentes: first_name, last_name, email, document — copia del original) */}
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
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
                        />
                        {fieldErrors.document && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.document}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información Laboral (sin cambios, copia del original) */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Información Laboral
                    </h4>
                    {/* ... (fecha, rol, posición, estado — copia del original) */}
                  </div>

                  {/* ✅ Sección de Password (nueva) */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <button 
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-800">Cambiar Contraseña (Reset Admin)</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        showPasswordSection ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {showPasswordSection ? 'Ocultar' : 'Mostrar'}
                      </span>
                    </button>

                    {showPasswordSection && (
                      <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva Contraseña *
                          </label>
                          <div className="relative">
                            <input
                              name="new_password"
                              type={showPassword ? "text" : "password"}
                              value={passwordForm.new_password || ''}
                              onChange={handlePasswordChange}
                              className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                passwordErrors.new_password ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Nueva contraseña (mín. 6 chars)"
                              disabled={loadingPassword}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {passwordErrors.new_password && (
                            <p className="text-red-600 text-xs mt-1">{passwordErrors.new_password}</p>
                          )}
                          {/* Barra de fuerza */}
                          {passwordForm.new_password && (
                            <div className="mt-2">
                              <div className={`h-1 rounded-full transition-all duration-300 ${
                                passwordStrength === 'strong' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} 
                              style={{ width: `${Math.min((passwordForm.new_password.length / 12) * 100, 100)}%` }} 
                              />
                              <p className={`text-xs mt-1 ${
                                passwordStrength === 'strong' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {passwordStrength === 'strong' ? 'Fuerte' : 'Débil'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Contraseña *
                          </label>
                          <input
                            name="confirm_password"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.confirm_password || ''}
                            onChange={handlePasswordChange}
                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              passwordErrors.confirm_password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Repite la nueva contraseña"
                            disabled={loadingPassword}
                          />
                          {passwordErrors.confirm_password && (
                            <p className="text-red-600 text-xs mt-1">{passwordErrors.confirm_password}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={loadingPassword || Object.keys(passwordErrors).length > 0 || !passwordForm.new_password}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                        >
                          {loadingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Reseteando...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Resetear Contraseña
                            </>
                          )}
                        </button>

                        <p className="text-xs text-gray-500 text-center italic">
                          El usuario recibirá un email con la nueva contraseña temporal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer (sin cambios) */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading || loadingPassword}
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
          </>
        )}
      </div>
    </div>
  );
};

export default EditarEmpleadoModal;