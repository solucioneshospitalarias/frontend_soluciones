import React, { useState, useEffect } from 'react';
import { getPeriodById, updatePeriod } from '../services/evaluationService';
import type { Period, UpdatePeriodDTO } from '../types/evaluation';
import { Calendar, X, Loader2, AlertCircle, Save, Clock } from 'lucide-react';

interface ConfirmationState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info' | 'success';
  loading: boolean;
}

interface EditarPeriodoModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  periodId: number | null;
  confirmationState?: ConfirmationState;
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationState>>;
}

const EditarPeriodoModal: React.FC<EditarPeriodoModalProps> = ({ 
  show, 
  onClose, 
  onUpdated, 
  periodId,
  confirmationState,  // Desestructuramos el nombre original de la prop
  setConfirmationState
}) => {
  // Asignamos _confirmationState para ignorarla intencionalmente (silencia ESLint/TS)
  const _confirmationState = confirmationState;  // Ahora está "usada" aquí, pero ignorada

  const [period, setPeriod] = useState<Period | null>(null);
  const [form, setForm] = useState<UpdatePeriodDTO>({});
  const [loading, setLoading] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Función para mostrar confirmación usando el estado padre
  const showConfirmation = (config: Omit<ConfirmationState, 'show' | 'loading'>) => {
    setConfirmationState({
      ...config,
      show: true,
      loading: false
    });
  };

  useEffect(() => {
    if (show && periodId) {
      const loadPeriodData = async () => {
        setLoadingPeriod(true);
        setError(null);
        try {
          const periodData = await getPeriodById(periodId);
          setPeriod(periodData);
          
          setForm({
            name: periodData.name,
            description: periodData.description,
            start_date: periodData.start_date ? new Date(periodData.start_date).toISOString().split('T')[0] : '',
            end_date: periodData.end_date ? new Date(periodData.end_date).toISOString().split('T')[0] : '',
            due_date: periodData.due_date ? new Date(periodData.due_date).toISOString().split('T')[0] : '',
            is_active: periodData.is_active,
          });
        } catch (err) {
          console.error('Error cargando período:', err);
          setError('Error al cargar los datos del período');
        } finally {
          setLoadingPeriod(false);
        }
      };

      loadPeriodData();
    }
  }, [show, periodId]); // Dependencias correctas; loadPeriodData ya no es una dependencia externa

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | boolean = value;

    if (type === 'checkbox') {
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name?.trim()) {
      errors.name = 'El nombre del período es obligatorio.';
    }
    if (!form.description?.trim()) {
      errors.description = 'La descripción es obligatoria.';
    }
    if (!form.start_date) {
      errors.start_date = 'La fecha de inicio es obligatoria.';
    }
    if (!form.end_date) {
      errors.end_date = 'La fecha de fin es obligatoria.';
    }
    if (!form.due_date) {
      errors.due_date = 'La fecha límite es obligatoria.';
    }

    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio.';
      }
    }

    if (form.start_date && form.due_date) {
      const startDate = new Date(form.start_date);
      const dueDate = new Date(form.due_date);
      
      if (dueDate < startDate) {
        errors.due_date = 'La fecha límite no puede ser anterior a la fecha de inicio.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!periodId || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: UpdatePeriodDTO = {
        name: form.name?.trim(),
        description: form.description?.trim(),
        start_date: form.start_date ? formatDateForBackend(form.start_date) : undefined,
        end_date: form.end_date ? formatDateForBackend(form.end_date) : undefined,
        due_date: form.due_date ? formatDateForBackend(form.due_date) : undefined,
        is_active: form.is_active,
      };

      await updatePeriod(periodId, payload);
      
      // Mostrar confirmación de éxito usando el modal padre
      showConfirmation({
        title: '¡Período Actualizado!',
        message: `El período "${form.name}" se ha actualizado exitosamente.`,
        type: 'success',
        onConfirm: async () => {
          await onUpdated();
          onClose();
        }
      });
    } catch (err: unknown) {
      console.error('Error updating period:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage || 'Error al actualizar período');
      
      // Mostrar confirmación de error usando el modal padre
      showConfirmation({
        title: 'Error',
        message: `Error al actualizar el período: ${errorMessage}`,
        type: 'danger',
        onConfirm: () => {} // No hace nada adicional, solo cierra
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPeriod(null);
    setForm({});
    setError(null);
    setFieldErrors({});
    onClose();
  };

  const suggestDueDate = () => {
    if (form.end_date) {
      const endDate = new Date(form.end_date);
      endDate.setDate(endDate.getDate() + 7); // 1 semana después
      const suggested = endDate.toISOString().split('T')[0];
      setForm(prev => ({ ...prev, due_date: suggested }));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Editar Período
            {period && <span className="text-lg text-gray-500">#{period.id}</span>}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {loadingPeriod ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
                  <Calendar className="w-4 h-4" />
                  Información General
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Período *
                    </label>
                    <input
                      name="name"
                      value={form.name || ''}
                      onChange={handleChange}
                      type="text"
                      placeholder="Ej: Q1 2025, Semestre I 2025..."
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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
                      placeholder="Describe el propósito y objetivos de este período de evaluación..."
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                        fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cronograma
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      name="start_date"
                      value={form.start_date || ''}
                      onChange={handleChange}
                      type="date"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.start_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.start_date && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.start_date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Fin *
                    </label>
                    <input
                      name="end_date"
                      value={form.end_date || ''}
                      onChange={handleChange}
                      type="date"
                      min={form.start_date || undefined}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.end_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.end_date && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.end_date}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Fecha Límite *
                      </label>
                      {form.end_date && !form.due_date && (
                        <button
                          type="button"
                          onClick={suggestDueDate}
                          className="text-xs text-blue-600 hover:text-blue-700"
                          disabled={loading}
                        >
                          Sugerir
                        </button>
                      )}
                    </div>
                    <input
                      name="due_date"
                      value={form.due_date || ''}
                      onChange={handleChange}
                      type="date"
                      min={form.start_date || undefined}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.due_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.due_date && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.due_date}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha límite para completar las evaluaciones
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Estado del Período
                </h4>
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
                  disabled={loading || loadingPeriod}
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
                      Actualizar Período
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

export default EditarPeriodoModal;