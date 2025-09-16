// src/components/EditarCriterioModal.tsx
import React, { useState, useEffect } from 'react';
import { updateCriteria, getCriteria } from '../services/evaluationService';
import type { Criteria, UpdateCriteriaDTO } from '../types/evaluation';
import { Target, X, Loader2, AlertCircle, Save } from 'lucide-react';

interface ConfirmationState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info' | 'success';
  loading: boolean;
}

interface EditarCriterioModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  criteriaId: number | null;
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationState>>;
}

const EditarCriterioModal: React.FC<EditarCriterioModalProps> = ({
  show,
  onClose,
  onUpdated,
  criteriaId,
  setConfirmationState,
}) => {
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [form, setForm] = useState<UpdateCriteriaDTO>({});
  const [loading, setLoading] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showConfirmation = (config: Omit<ConfirmationState, 'show' | 'loading'>) => {
    setConfirmationState({
      ...config,
      show: true,
      loading: false,
    });
  };

  useEffect(() => {
    if (show && criteriaId) {
      const loadCriteriaData = async () => {
        setLoadingCriteria(true);
        setError(null);
        try {
          const criteriaData = await getCriteria().then(criteria =>
            criteria.find(c => c.id === criteriaId)
          );
          if (!criteriaData) {
            throw new Error('Criterio no encontrado');
          }
          setCriteria(criteriaData);
          setForm({
            name: criteriaData.name,
            description: criteriaData.description,
            weight: criteriaData.weight,
            category: criteriaData.category,
          });
        } catch (err) {
          console.error('Error cargando criterio:', err);
          setError('Error al cargar los datos del criterio');
        } finally {
          setLoadingCriteria(false);
        }
      };
      loadCriteriaData();
    }
  }, [show, criteriaId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'weight' ? parseFloat(value) : value,
    }));

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

    if (!form.name?.trim()) {
      errors.name = 'El nombre del criterio es obligatorio.';
    }
    if (!form.description?.trim()) {
      errors.description = 'La descripción es obligatoria.';
    }
    if (form.weight === undefined || isNaN(form.weight)) {
      errors.weight = 'El peso es obligatorio y debe ser un número.';
    } else if (form.weight < 0 || form.weight > 1) {
      errors.weight = 'El peso debe estar entre 0 y 1.';
    }
    if (!form.category) {
      errors.category = 'La categoría es obligatoria.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!criteriaId || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: UpdateCriteriaDTO = {
        name: form.name?.trim(),
        description: form.description?.trim(),
        weight: form.weight,
        category: form.category as 'productividad' | 'conducta_laboral' | 'habilidades',
      };

      await updateCriteria(criteriaId, payload);

      showConfirmation({
        title: '¡Criterio Actualizado!',
        message: `El criterio "${form.name}" se ha actualizado exitosamente.`,
        type: 'success',
        onConfirm: async () => {
          await onUpdated();
          onClose();
        },
      });
    } catch (err: unknown) {
      console.error('Error updating criteria:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);

      showConfirmation({
        title: 'Error',
        message: `Error al actualizar el criterio: ${errorMessage}`,
        type: 'danger',
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCriteria(null);
    setForm({});
    setError(null);
    setFieldErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-500" />
            Editar Criterio
            {criteria && <span className="text-lg text-gray-500">#{criteria.id}</span>}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {loadingCriteria ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Información del Criterio
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Criterio *
                    </label>
                    <input
                      name="name"
                      value={form.name || ''}
                      onChange={handleChange}
                      type="text"
                      placeholder="Ej: Productividad, Comunicación..."
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={form.description || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe el criterio de evaluación..."
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none ${
                        fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso (0-1) *
                    </label>
                    <input
                      name="weight"
                      value={form.weight !== undefined ? form.weight : ''}
                      onChange={handleChange}
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="Ej: 0.3"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        fieldErrors.weight ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.weight && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.weight}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={form.category || ''}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        fieldErrors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="" disabled>
                        Selecciona una categoría
                      </option>
                      <option value="productividad">Productividad</option>
                      <option value="conducta_laboral">Conducta Laboral</option>
                      <option value="habilidades">Habilidades</option>
                    </select>
                    {fieldErrors.category && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.category}</p>
                    )}
                  </div>
                </div>
              </div>

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
                  disabled={loading || loadingCriteria}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Actualizar Criterio
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

export default EditarCriterioModal;