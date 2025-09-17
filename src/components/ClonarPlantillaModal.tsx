import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import type { Template } from '../types/evaluation';
import { cloneTemplate } from '../services/evaluationService';

interface ConfirmationState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info' | 'success';
  loading: boolean;
}

interface ClonarPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onCloned: (clonedTemplate: Template) => void;
  template: Template | null;
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationState>>;
}

const ClonarPlantillaModal: React.FC<ClonarPlantillaModalProps> = ({
  show,
  onClose,
  onCloned,
  template,
  setConfirmationState,
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default name when modal opens
  useEffect(() => {
    if (show && template) {
      setNewName(`${template.name} (Copia)`);
      setError(null);
    }
  }, [show, template]);

  const handleSubmit = async () => {
    if (!template) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError('El nombre de la plantilla no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      console.log('📋 Cloning template:', template.id, trimmedName);
      const clonedTemplate = await cloneTemplate(template.id, trimmedName);
      onCloned(clonedTemplate);
      setConfirmationState({
        show: true,
        title: '¡Plantilla Clonada!',
        message: `La plantilla "${trimmedName}" se ha creado exitosamente.`,
        type: 'success',
        onConfirm: () => setConfirmationState(prev => ({ ...prev, show: false })),
        loading: false,
      });
      onClose();
    } catch (err: unknown) {
      console.error('❌ Error cloning template:', err);
      setConfirmationState({
        show: true,
        title: 'Error',
        message: `Error al clonar la plantilla: ${(err as Error).message}`,
        type: 'danger',
        onConfirm: () => setConfirmationState(prev => ({ ...prev, show: false })),
        loading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
              <Copy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Clonar Plantilla</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Ingresa el nombre para la nueva plantilla. Por defecto, se usará "{template.name} (Copia)".
          </p>
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError(null);
            }}
            placeholder="Nombre de la nueva plantilla"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Clonar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClonarPlantillaModal;