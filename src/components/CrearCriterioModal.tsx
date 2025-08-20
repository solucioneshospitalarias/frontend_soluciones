import React, { useState } from 'react';
import { Target, X, Loader2, Plus, Percent } from 'lucide-react';
import { createCriteria } from '../services/evaluationService';
import type { Criteria, CreateCriteriaDTO } from '../services/evaluationService';

interface CrearCriterioModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newCriteria: Criteria) => void;
}

interface CriteriaForm {
  name: string;
  description: string;
  weight: string;
  category: string;
}

const CrearCriterioModal: React.FC<CrearCriterioModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<CriteriaForm>({
    name: '',
    description: '',
    weight: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Categorías predefinidas comunes
  const commonCategories = [
    'Comunicación',
    'Creatividad', 
    'Liderazgo',
    'Trabajo en Equipo',
    'Productividad',
    'Puntualidad',
    'Calidad del Trabajo',
    'Iniciativa',
    'Resolución de Problemas',
    'Adaptabilidad'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.description.trim()) return 'La descripción es obligatoria.';
    if (!form.weight.trim()) return 'El peso es obligatorio.';
    if (!form.category.trim()) return 'La categoría es obligatoria.';
    
    const weightNum = parseFloat(form.weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 1) {
      return 'El peso debe ser un número entre 0.01 y 1.0';
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
      // Crear criterio usando la API real
      const criteriaData: CreateCriteriaDTO = {
        name: form.name.trim(),
        description: form.description.trim(),
        weight: parseFloat(form.weight),
        category: form.category.trim()
      };

      const newCriteria = await createCriteria(criteriaData);

      // Mostrar éxito
      setShowSuccess(true);
      
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        onCreated(newCriteria);
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error creating criteria:', err);
      setError(err.message || 'Error al crear el criterio');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setForm({
      name: '',
      description: '',
      weight: '',
      category: '',
    });
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        
        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Criterio Creado!</h3>
            <p className="text-gray-600">El criterio se ha agregado exitosamente al sistema.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-green-500" />
                Crear Nuevo Criterio
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
              
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Criterio *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Ej: Comunicación efectiva, Trabajo en equipo..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Criterio *
                </label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  type="text"
                  placeholder="Descripción detallada del criterio de evaluación..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="inline w-4 h-4 mr-1" />
                  Peso (entre 0.01 y 1.0) *
                </label>
                <input
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  placeholder="Ej: 0.3 para 30%"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El peso representa la importancia del criterio. Ej: 0.3 = 30%
                </p>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div className="space-y-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Seleccionar categoría</option>
                    {commonCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom">+ Categoría personalizada</option>
                  </select>
                  
                  {form.category === '__custom' && (
                    <input
                      name="category"
                      value=""
                      onChange={handleChange}
                      type="text"
                      placeholder="Escribe una nueva categoría"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      disabled={loading}
                    />
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Preview */}
              {form.name && form.description && form.weight && form.category && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{form.name}</p>
                      <p className="text-sm text-gray-600">{form.description}</p>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-md">
                        {form.category}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      {form.weight ? `${Math.round(parseFloat(form.weight) * 100)}%` : '0%'}
                    </span>
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
                      Crear Criterio
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

export default CrearCriterioModal;