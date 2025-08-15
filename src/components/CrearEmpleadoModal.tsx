import React, { useState } from 'react';
import { createUser } from '../services/userService';
import type { UserCreateDTO } from '../types/user';

interface CrearEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const CrearEmpleadoModal: React.FC<CrearEmpleadoModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<UserCreateDTO>({
    email: '',
    document: '',
    password: '',
    firstName: '',
    lastName: '',
    roleID: 0,
    positionID: 0,
    hireDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    if (name === 'roleID' || name === 'positionID') {
      parsedValue = parseInt(value);
    }

    setForm({
      ...form,
      [name]: parsedValue,
    });
  };

  const validateForm = (): string | null => {
    if (!form.firstName.trim()) return 'El nombre es obligatorio.';
    if (!form.lastName.trim()) return 'El apellido es obligatorio.';
    if (!form.email.trim()) return 'El correo electrónico es obligatorio.';
    if (!form.document.trim()) return 'El documento es obligatorio.';
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.roleID === 0) return 'Debes seleccionar un rol.';
    if (form.positionID === 0) return 'Debes seleccionar un cargo.';
    if (!form.hireDate.trim()) return 'La fecha de contratación es obligatoria.';
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
        hireDate: `${form.hireDate}T00:00:00Z`, // ← formato ISO completo
      };

      await createUser(payload);
      alert('✅ Empleado creado exitosamente');
      await onCreated();
      setForm({
        email: '',
        document: '',
        password: '',
        firstName: '',
        lastName: '',
        roleID: 0,
        positionID: 0,
        hireDate: '',
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.details || 'Error al crear empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Crear Nuevo Empleado</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <input name="firstName" value={form.firstName} onChange={handleChange} type="text" placeholder="Nombre(s)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input name="lastName" value={form.lastName} onChange={handleChange} type="text" placeholder="Apellidos" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Correo electrónico" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input name="document" value={form.document} onChange={handleChange} type="text" placeholder="Documento de identidad" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Contraseña (mínimo 6 caracteres)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <input name="hireDate" value={form.hireDate} onChange={handleChange} type="date" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />

          <select name="positionID" value={form.positionID} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <option value={0}>Seleccionar cargo</option>
            <option value={1}>Mensajero</option>
            <option value={2}>Supervisor</option>
            <option value={3}>Administrativo</option>
          </select>

          <select name="roleID" value={form.roleID} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <option value={0}>Seleccionar rol</option>
            <option value={2}>Empleado</option>
            <option value={1}>Administrador</option>
          </select>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
            >
              {loading ? 'Guardando...' : 'Crear Empleado'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearEmpleadoModal;
