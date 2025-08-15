import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Save,
  AlertCircle,
} from 'lucide-react';
import { getUserById, updateUser } from '../services/userService';
import { getReferenceData } from '../services/referenceService';
import type { User as UserType, UserUpdateDTO } from '../types/user';

interface EditarEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated: () => void;
  userId: number | null;
}

interface References {
  positions: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  roles: { id: number; name: string }[];
}

interface FormData {
  name: string;
  email: string;
  roleID: number | '';
  positionID: number | '';
  departmentID: number | '';
  is_active: boolean;
  document: string;
  hire_date: string; // YYYY-MM-DD
}

const EditarEmpleadoModal: React.FC<EditarEmpleadoModalProps> = ({
  show,
  onClose,
  onUpdated,
  userId,
}) => {
  // state para referencias
  const [references, setReferences] = useState<References>({
    positions: [],
    departments: [],
    roles: [],
  });

  // state para formulario, errores, loading/submitting
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    roleID: '',
    positionID: '',
    departmentID: '',
    is_active: true,
    document: '',
    hire_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) al abrir el modal, cargo referencias y datos del usuario
  useEffect(() => {
    if (!show) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getReferenceData().then((resp) => {
        // me aseguro de que siempre llegue en shape { positions, departments, roles }
        const { positions = [], departments = [], roles = [] } = resp || {};
        return { positions, departments, roles };
      }),
      userId ? getUserById(userId) : Promise.resolve(null),
    ])
      .then(([refs, user]) => {
        setReferences(refs);

        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            roleID: user.role?.id ?? '',
            positionID: (user.position as any)?.id ?? '',
            departmentID: (user.department as any)?.id ?? '',
            is_active: user.is_active,
            document: user.document || '',
            hire_date: user.hire_date
              ? user.hire_date.split('T')[0]
              : '',
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError('No se pudo cargar la información. Intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  }, [show, userId]);

  // validación simple
  const validateForm = (): boolean => {
    const newErr: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErr.name = 'El nombre es obligatorio.';
    }
    if (!formData.email.trim()) {
      newErr.email = 'El email es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErr.email = 'Email con formato inválido.';
    }
    if (
      formData.hire_date &&
      new Date(formData.hire_date) > new Date()
    ) {
      newErr.hire_date = 'La fecha de contratación no puede ser futura.';
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // handler de cambios
  const handleChange = (
    field: keyof FormData,
    value: string | boolean | number | ''
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  // envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !userId) return;

    setSubmitting(true);
    setError(null);

    const payload: UserUpdateDTO = {
      name: formData.name,
      email: formData.email,
      is_active: formData.is_active,
      document: formData.document,
      hire_date: formData.hire_date,
      roleID:
        typeof formData.roleID === 'number'
          ? formData.roleID
          : undefined,
      positionID:
        typeof formData.positionID === 'number'
          ? formData.positionID
          : undefined,
      departmentID:
        typeof formData.departmentID === 'number'
          ? formData.departmentID
          : undefined,
    };

    try {
      await updateUser(userId, payload);
      onUpdated();
      handleClose();
    } catch (err: any) {
      console.error('Error al actualizar:', err);
      setError(
        err.response?.data?.message ||
          'Error al actualizar el empleado. Intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // reset + cerrar
  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      roleID: '',
      positionID: '',
      departmentID: '',
      is_active: true,
      document: '',
      hire_date: '',
    });
    setErrors({});
    setError(null);
    onClose();
  };

  // si no debe mostrarse
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <UserIcon className="w-6 h-6" />
            </div>
            Editar Empleado
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full" />
            </div>
          ) : (
            <>
              {/* alerta genérica */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* nombre / email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      handleChange('name', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      handleChange('email', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.email
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="correo@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* rol */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.roleID}
                    onChange={(e) =>
                      handleChange(
                        'roleID',
                        e.target.value
                          ? Number(e.target.value)
                          : ''
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 border-gray-300"
                  >
                    <option value="">Seleccione un rol</option>
                    {references.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* cargo */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cargo
                  </label>
                  <select
                    value={formData.positionID}
                    onChange={(e) =>
                      handleChange(
                        'positionID',
                        e.target.value
                          ? Number(e.target.value)
                          : ''
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 border-gray-300"
                  >
                    <option value="">Seleccione un cargo</option>
                    {references.positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* departamento */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Departamento
                  </label>
                  <select
                    value={formData.departmentID}
                    onChange={(e) =>
                      handleChange(
                        'departmentID',
                        e.target.value
                          ? Number(e.target.value)
                          : ''
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 border-gray-300"
                  >
                    <option value="">Seleccione un departamento</option>
                    {references.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* doc / fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Documento
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) =>
                      handleChange('document', e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                    placeholder="Número de documento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de contratación
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      handleChange('hire_date', e.target.value)
                    }
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.hire_date
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.hire_date && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.hire_date}
                    </p>
                  )}
                </div>
              </div>

              {/* estado */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estado del empleado
                </label>
                <div className="flex gap-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.is_active}
                      onChange={() =>
                        handleChange('is_active', true)
                      }
                      className="text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-2 text-gray-700">
                      Activo
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={!formData.is_active}
                      onChange={() =>
                        handleChange('is_active', false)
                      }
                      className="text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="ml-2 text-gray-700">
                      Inactivo
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* footer */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarEmpleadoModal;
