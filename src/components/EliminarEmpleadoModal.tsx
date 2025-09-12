import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, UserX, UserCheck, Loader2 } from 'lucide-react';
import { deleteUser } from '../services/userService';
import type { User } from '../types/user';

interface EliminarEmpleadoModalProps {
  show: boolean;
  onClose: () => void;
  onDeleted: () => Promise<void>;
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
  const [deleteMode, setDeleteMode] = useState<'disable' | 'delete'>('disable');
  const [showSuccess, setShowSuccess] = useState<boolean>(false); // ✅ Estado de éxito
  const [successMessage, setSuccessMessage] = useState<string>(''); // ✅ Mensaje de éxito

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteUser(user.id);
      
      // ✅ Determinar el mensaje de éxito según la operación
      const message = deleteMode === 'delete' 
        ? `${user.name} ha sido eliminado permanentemente del sistema.`
        : `${user.name} ha sido desactivado exitosamente.`;
      
      setSuccessMessage(message);
      setShowSuccess(true);
      await onDeleted();
      
      // Cerrar modal después de mostrar éxito
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2500);
      
    } catch (err: unknown) { // ✅ Arreglado: cambié any por unknown
      console.error('Error al procesar empleado:', err);
      
      // ✅ Type guard para manejar el error correctamente
      let errorMessage = 'Error al procesar el empleado. Intenta de nuevo.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Si el error menciona que fue desactivado, tratarlo como éxito
      if (errorMessage.includes('desactivado') || errorMessage.includes('deshabilitado')) {
        setSuccessMessage(`${user.name} ha sido desactivado exitosamente.`);
        setShowSuccess(true);
        await onDeleted();
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2500);
      } else {
        setError(errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setError(null);
    setDeleteMode('disable');
    setShowSuccess(false);
    setSuccessMessage('');
    onClose();
  };

  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        
        {/* ✅ Success State */}
        {showSuccess ? (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {deleteMode === 'delete' ? '¡Empleado Eliminado!' : '¡Empleado Desactivado!'}
              </h3>
              <p className="text-gray-600">{successMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${
                  deleteMode === 'delete' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}>
                  {deleteMode === 'delete' ? <Trash2 className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                </div>
                {deleteMode === 'delete' ? 'Eliminar Empleado' : 'Desactivar Empleado'}
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  deleteMode === 'delete' ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <AlertTriangle className={`w-8 h-8 ${
                    deleteMode === 'delete' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                </div>
              </div>

              {/* Action Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona la acción a realizar:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="disable"
                      checked={deleteMode === 'disable'}
                      onChange={(e) => setDeleteMode(e.target.value as 'disable' | 'delete')}
                      className="text-orange-600 border-gray-300 focus:ring-orange-500"
                      disabled={deleting}
                    />
                    <span className="ml-2 text-gray-700">
                      <strong>Desactivar</strong> - El empleado se mantiene en el sistema pero inactivo
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="delete"
                      checked={deleteMode === 'delete'}
                      onChange={(e) => setDeleteMode(e.target.value as 'disable' | 'delete')}
                      className="text-red-600 border-gray-300 focus:ring-red-500"
                      disabled={deleting}
                    />
                    <span className="ml-2 text-gray-700">
                      <strong>Eliminar</strong> - Se borra permanentemente del sistema
                    </span>
                  </label>
                </div>
              </div>

              {/* Warning Message */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {deleteMode === 'delete' 
                    ? '¿Estás seguro de que quieres eliminar este empleado?'
                    : '¿Estás seguro de que quieres desactivar este empleado?'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {deleteMode === 'delete'
                    ? 'Esta acción no se puede deshacer. Se eliminará permanentemente:'
                    : 'El empleado será marcado como inactivo pero sus datos se conservarán:'
                  }
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

              <div className={`border rounded-lg p-4 mb-6 ${
                deleteMode === 'delete' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    deleteMode === 'delete' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <div className={`text-sm ${
                    deleteMode === 'delete' ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    <strong>
                      {deleteMode === 'delete' ? 'Advertencia:' : 'Información:'}
                    </strong> {deleteMode === 'delete' 
                      ? 'Esta acción eliminará permanentemente todos los datos del empleado del sistema.'
                      : 'El empleado podrá ser reactivado posteriormente desde el panel de administración.'
                    }
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
                className={`px-6 py-2 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  deleteMode === 'delete'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                }`}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {deleteMode === 'delete' ? 'Eliminando...' : 'Desactivando...'}
                  </>
                ) : (
                  <>
                    {deleteMode === 'delete' ? <Trash2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    {deleteMode === 'delete' ? 'Eliminar Empleado' : 'Desactivar Empleado'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EliminarEmpleadoModal;