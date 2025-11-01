import React, { useState } from 'react';
import { Target, X, Loader2, Plus } from 'lucide-react';
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
  category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo' | '';
}

const CrearCriterioModal: React.FC<CrearCriterioModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<CriteriaForm>({
    name: '',
    description: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Define valid categories with display names (matching backend CriteriaCategory)
  const validCategories = [
    { value: 'productividad', label: 'Productividad' },
    { value: 'conducta_laboral', label: 'Conducta Laboral' },
    { value: 'habilidades', label: 'Habilidades' },
    { value: 'seguridad_trabajo', label: 'Seguridad y salud en el trabajo' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.description.trim()) return 'La descripción es obligatoria.';
    if (!form.category) return 'La categoría es obligatoria.';
    
    // Validate category
    if (!validCategories.some(cat => cat.value === form.category)) {
      return 'Categoría no válida. Seleccione Productividad, Conducta Laboral, Habilidades o Seguridad y salud en el trabajo.';
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
      const criteriaData: CreateCriteriaDTO = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category as 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo'
      };

      console.log('🔄 Creating criteria with data:', criteriaData);
      const newCriteria = await createCriteria(criteriaData);

      setShowSuccess(true);
      
      setTimeout(() => {
        onCreated(newCriteria);
        handleClose();
      }, 1500);

    } catch (err: unknown) {
      console.error('❌ Error creating criteria:', err);
      setError(
        err instanceof Error && (err.message.includes('400') || err.message.includes('category'))
          ? 'Categoría no válida. Debe ser Productividad, Conducta Laboral o Habilidades.'
          : err instanceof Error
          ? err.message
          : 'Error al crear el criterio'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setForm({
      name: '',
      description: '',
      category: '',
    });
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryObj = validCategories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Criterio Creado!</h3>
            <p className="text-gray-600">
              El criterio se ha agregado exitosamente al sistema.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Crear Criterio</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Criterio *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Ej: Comunicación Efectiva"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe qué evalúa este criterio..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                >
                  <option value="">Seleccionar categoría</option>
                  {validCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {form.name && form.description && form.category && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{form.name}</p>
                      <p className="text-sm text-gray-600">{form.description}</p>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-md">
                        {getCategoryDisplayName(form.category)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading}
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
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CrearCriterioModal;