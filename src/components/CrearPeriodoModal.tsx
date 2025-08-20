// src/components/CrearPeriodoModal.tsx
// ✅ Modal corregido con tipos, API real y campos completos

import React, { useState } from 'react';
import { Calendar, X, Loader2, Plus } from 'lucide-react';
import { createPeriod } from '../services/evaluationService';
import type { Period, CreatePeriodDTO } from '../services/evaluationService';

interface CrearPeriodoModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newPeriod: Period) => void;
}

// ✅ Formulario corregido con todos los campos requeridos
interface PeriodForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  dueDate: string;     // ✅ Campo agregado
  isActive: boolean;   // ✅ Campo agregado
}

const CrearPeriodoModal: React.FC<CrearPeriodoModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<PeriodForm>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    dueDate: '',      // ✅ Inicializado
    isActive: true,   // ✅ Por defecto activo
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // ✅ Manejar checkbox para isActive
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
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
      // ✅ Crear el DTO con la estructura correcta del backend
      const periodData: CreatePeriodDTO = {
        name: form.name.trim(),
        description: form.description.trim(),
        start_date: form.startDate,  // ✅ snake_case
        end_date: form.endDate,      // ✅ snake_case
        due_date: form.dueDate,      // ✅ snake_case
        is_active: form.isActive     // ✅ snake_case
      };

      console.log('🔄 Creating period with data:', periodData);

      // ✅ Usar la API real del servicio
      const newPeriod = await createPeriod(periodData);

      console.log('✅ Period created successfully:', newPeriod);

      // Mostrar éxito
      setShowSuccess(true);
      
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        onCreated(newPeriod);
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error creating period:', err);
      setError(err.message || 'Error al crear el período');
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
      isActive: true,
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

  // ✅ Función helper para formatear fechas
  const formatDate = (dateString: string) => {
    try {
      // ✅ Debug: Ver qué tipo de fecha recibimos
      console.log('🔄 Formatting date:', dateString, typeof dateString);
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('❌ Invalid date:', dateString);
        return dateString;
      }
      
      const formatted = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      console.log('✅ Formatted date:', dateString, '->', formatted);
      return formatted;
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Período Creado!</h3>
            <p className="text-gray-600">El período se ha configurado exitosamente.</p>
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
              
              {/* ✅ Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Estado activo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Período
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      {form.isActive ? 'Período activo' : 'Período inactivo'}
                    </span>
                  </label>
                </div>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  disabled={loading}
                />
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
                      className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-full transition-colors border border-blue-200"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    min={form.startDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha límite para completar las evaluaciones
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* ✅ Preview mejorado */}
              {form.name && form.startDate && form.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Vista previa:</h4>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{form.name}</p>
                      <p className="text-sm text-blue-700 mb-2">{formatDateRange()}</p>
                      {form.description && (
                        <p className="text-xs text-blue-600 mb-2">"{form.description}"</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-blue-600">
                        <span>Estado: {form.isActive ? 'Activo' : 'Inactivo'}</span>
                        {form.dueDate && (
                          <span>Límite: {formatDate(form.dueDate)}</span>
                        )}
                      </div>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500 ml-4" />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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