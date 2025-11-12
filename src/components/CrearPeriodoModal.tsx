import React, { useState } from 'react';
import { Calendar, X, Loader2, Plus, Info } from 'lucide-react';
import { createPeriod } from '../services/evaluationService';
import type { Period, CreatePeriodDTO } from '../services/evaluationService';

interface CrearPeriodoModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newPeriod: Period) => void;
}

// ✅ Formulario SIN isActive - se determina automáticamente
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  // ✅ Validaciones
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
      // ✅ Payload SIN is_active - se determina automáticamente
      const periodData: CreatePeriodDTO = {
        name: form.name.trim(),
        description: form.description.trim(),
        start_date: formatDateForBackend(form.startDate),
        end_date: formatDateForBackend(form.endDate),
        due_date: formatDateForBackend(form.dueDate),
        is_active: true // Valor por defecto, el backend calculará según fechas
      };

      console.log('🔄 Creating period with data:', periodData);
      
      const newPeriod = await createPeriod(periodData);
      console.log('✅ Period created:', newPeriod);
      
      setShowSuccess(true);
      
      setTimeout(() => {
        onCreated(newPeriod);
        handleClose();
      }, 1500);
      
    } catch (err: unknown) {
      console.error('❌ Error creating period:', err);
      
      let errorMessage = 'Error al crear el período';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('parsing time') || errorMessage.includes('cannot parse')) {
        errorMessage = 'Error en el formato de fecha. Por favor, verifica que todas las fechas sean válidas.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      dueDate: '',
    });
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  // ✅ Sugerencias mejoradas
  const generateSuggestedNames = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const currentMonth = new Date().getMonth() + 1;
    
    const suggestions = [
      `Q${Math.ceil(currentMonth / 3)} ${currentYear}`,
      `Q${Math.ceil(currentMonth / 3) + 1 > 4 ? 1 : Math.ceil(currentMonth / 3) + 1} ${Math.ceil(currentMonth / 3) + 1 > 4 ? nextYear : currentYear}`,
      `Semestre ${currentMonth <= 6 ? 'I' : 'II'} ${currentYear}`,
      `Semestre ${currentMonth <= 6 ? 'II' : 'I'} ${currentMonth <= 6 ? currentYear : nextYear}`,
      `Anual ${currentYear}`,
      `Anual ${nextYear}`,
      `Mensual ${new Date().toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`,
      `Evaluación ${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    ];
    
    return suggestions;
  };

  // ✅ Función helper para formatear fechas en la UI
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const formatDateRange = () => {
    if (!form.startDate || !form.endDate) return '';
    
    const start = new Date(form.startDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const end = new Date(form.endDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
    
    return `${start} - ${end}`;
  };

  // ✅ Auto-calcular fecha límite sugerida
  const suggestDueDate = () => {
    if (form.endDate) {
      const endDate = new Date(form.endDate);
      // Sugerir 1 semana después de la fecha de fin
      endDate.setDate(endDate.getDate() + 7);
      const suggested = endDate.toISOString().split('T')[0];
      setForm(prev => ({ ...prev, dueDate: suggested }));
    }
  };

  const expectedStatus = calculateExpectedStatus();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
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
                <Calendar className="w-6 h-6 text-green-500" />
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
              
              {/* ✅ Información básica SIN toggle de estado */}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                {/* ✅ Descripción completa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Período *
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe el propósito y objetivos de este período de evaluación..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* ✅ Sugerencias de nombres */}
              <div>
                <p className="text-sm text-gray-700 mb-2">Sugerencias de nombres:</p>
                <div className="flex flex-wrap gap-2">
                  {generateSuggestedNames().slice(0, 6).map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, name: suggestion }))}
                      className="text-xs px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 rounded-full transition-colors border border-green-200"
                      disabled={loading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ Fechas mejoradas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin *
                  </label>
                  <input
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    type="date"
                    min={form.startDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha Límite *
                    </label>
                    {form.endDate && !form.dueDate && (
                      <button
                        type="button"
                        onClick={suggestDueDate}
                        className="text-xs text-green-600 hover:text-green-700"
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
                    min={form.startDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha límite para completar las evaluaciones
                  </p>
                </div>
              </div>

              {/* ✅ Estado automático calculado */}
              {expectedStatus && (
                <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-green-600" />
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* ✅ Preview mejorado */}
              {form.name && form.startDate && form.endDate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Vista previa:</h4>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{form.name}</p>
                      <p className="text-sm text-green-700 mb-2">{formatDateRange()}</p>
                      {form.description && (
                        <p className="text-xs text-green-600 mb-2">"{form.description}"</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-green-600">
                        {form.dueDate && (
                          <span>Límite: {formatDate(form.dueDate)}</span>
                        )}
                      </div>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500 ml-4" />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button 
                  type="button"
                  onClick={handleClose} 
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CrearPeriodoModal;