// src/components/CrearPeriodoModal.tsx
// ✅ Modal corregido sin botón toggle - estado automático basado en fechas

import React, { useState } from 'react';
import { Calendar, X, Loader2, Plus, Info } from 'lucide-react';
import { createPeriod } from '../services/evaluationService';
import type { Period, CreatePeriodDTO } from '../services/evaluationService';

interface CrearPeriodoModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newPeriod: Period) => void;
}

// ✅ Formulario SIN isActive - se determina automáticamente por fechas
interface PeriodForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  dueDate: string;
}

const CrearPeriodoModal: React.FC<CrearPeriodoModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<PeriodForm>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    dueDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Función helper para convertir fecha YYYY-MM-DD a ISO 8601
  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString();
  };

  // ✅ Función para calcular el estado esperado según las fechas
  const calculateExpectedStatus = () => {
    if (!form.startDate || !form.endDate || !form.dueDate) return null;
    
    const now = new Date();
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    const dueDate = new Date(form.dueDate);

    if (now.getTime() < startDate.getTime()) {
      return { status: 'draft', label: 'Borrador', color: 'text-gray-600', bg: 'bg-gray-100' };
    } else if (now.getTime() > dueDate.getTime()) {
      return { status: 'completed', label: 'Completado', color: 'text-blue-600', bg: 'bg-blue-100' };
    } else if (now.getTime() >= startDate.getTime() && now.getTime() <= endDate.getTime()) {
      return { status: 'active', label: 'Activo', color: 'text-green-600', bg: 'bg-green-100' };
    } else {
      return { status: 'draft', label: 'Borrador', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  // ✅ Validaciones mejoradas
  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre del período es obligatorio.';
    if (!form.description.trim()) return 'La descripción es obligatoria.';
    if (!form.startDate) return 'La fecha de inicio es obligatoria.';
    if (!form.endDate) return 'La fecha de fin es obligatoria.';
    if (!form.dueDate) return 'La fecha límite es obligatoria.';
    
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    const dueDate = new Date(form.dueDate);
    
    if (endDate <= startDate) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }
    
    if (dueDate < startDate) {
      return 'La fecha límite no puede ser anterior a la fecha de inicio.';
    }
    
    return null;
  };

  // ✅ Función para sugerir fecha límite automáticamente
  const suggestDueDate = () => {
    if (!form.endDate) return;
    
    const endDate = new Date(form.endDate);
    const suggestedDue = new Date(endDate);
    suggestedDue.setDate(endDate.getDate() + 7); // 7 días después del fin
    
    setForm(prev => ({
      ...prev,
      dueDate: suggestedDue.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Payload SIN is_active - se determina automáticamente por fechas en el backend
      const payload: CreatePeriodDTO = {
        name: form.name.trim(),
        description: form.description.trim(),
        start_date: formatDateForBackend(form.startDate),
        end_date: formatDateForBackend(form.endDate),
        due_date: formatDateForBackend(form.dueDate),
        is_active: true // Valor por defecto, pero el backend lo calculará según fechas
      };

      console.log('📤 Enviando payload:', payload);
      
      const newPeriod = await createPeriod(payload);
      console.log('✅ Período creado:', newPeriod);
      
      setShowSuccess(true);
      
      // Esperar 2 segundos y cerrar
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onCreated(newPeriod);
        onClose();
      }, 2000);
      
    } catch (err: unknown) {
      console.error('❌ Error creando período:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al crear el período');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      dueDate: '',
    });
    setError(null);
    setShowSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const expectedStatus = calculateExpectedStatus();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Período Creado!</h3>
              <p className="text-gray-600">El período se ha configurado exitosamente.</p>
              <p className="text-sm text-gray-500 mt-2">Su estado se determinará automáticamente según las fechas.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-500" />
                  Crear Nuevo Período
                </h3>
                <button 
                  onClick={handleClose} 
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ✅ Información básica - SIN campo de estado activo */}
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Período *
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      type="text"
                      placeholder="Ej: Q1 2025, Semestre I 2025..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={loading}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe el propósito y alcance de este período de evaluación..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* ✅ Fechas del período */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Configuración de Fechas
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Fecha inicio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio *
                      </label>
                      <input
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Fecha fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Fin *
                      </label>
                      <input
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        type="date"
                        min={form.startDate || undefined}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={loading}
                      />
                    </div>

                    {/* Fecha límite */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Fecha Límite *
                        </label>
                        {form.endDate && !form.dueDate && (
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
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                        type="date"
                        min={form.startDate || undefined}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Fecha límite para completar las evaluaciones
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ Estado automático calculado */}
                {expectedStatus && (
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Estado del Período (Automático)
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${expectedStatus.bg} ${expectedStatus.color}`}>
                          {expectedStatus.label}
                        </span>
                        <p className="text-sm text-gray-600 mt-2">
                          El estado se calcula automáticamente según las fechas configuradas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Crear Período
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearPeriodoModal;