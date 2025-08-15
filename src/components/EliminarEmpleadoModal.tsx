import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { deleteUser } from '../services/userService';
import type { User } from '../types/user';

interface EliminarEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: User | null;
}

const EliminarEmpleadoModal: React.FC<EliminarEmpleadoModalProps> = ({
  show,
  onClose,
  onDeleted,
  user
}) => {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteUser(user.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      console.error('Error al eliminar empleado:', err);
      setError(err.response?.data?.message || 'Error al eliminar el empleado. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            Eliminar Empleado
          </h2>
          <button
            onClick={handleClose}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Estás seguro de que quieres eliminar este empleado?
            </h3>
            <p className="text-gray-600 mb-4">
              Esta acción no se puede deshacer. Se eliminará permanentemente la información de:
            </p>
            
            {/* Employee Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              {user.position && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Cargo:</span> {user.position}
                </div>
              )}
              {user.department && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Departamento:</span> {user.department}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-medium">ID:</span> {user.id}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-yellow-800 text-sm">
                <strong>Advertencia:</strong> Esta acción eliminará permanentemente todos los datos del empleado del sistema.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar Empleado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliminarEmpleadoModal;