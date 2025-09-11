// src/components/CrearPlantillaModal.tsx
import React, { useState, useEffect } from 'react';
import { FileCheck, X, Loader2, Plus, Target, Trash2, Percent } from 'lucide-react';
import { getCriteria, createTemplate } from '../services/evaluationService';
import type { Template, Criteria, CreateTemplateDTO } from '../types/evaluation';

interface CrearPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newTemplate: Template) => void;
}

interface PlantillaForm {
  name: string;
  description: string;
  selectedCriteria: { criteriaId: number; weight: number; category: 'productividad' | 'conducta_laboral' | 'habilidades' }[];
}

const CrearPlantillaModal: React.FC<CrearPlantillaModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<PlantillaForm>({
    name: '',
    description: '',
    selectedCriteria: [],
  });

  const [availableCriteria, setAvailableCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      loadCriteria();
    }
  }, [show]);

  const loadCriteria = async () => {
    setLoadingCriteria(true);
    try {
      const criteria = await getCriteria();
      setAvailableCriteria(Array.isArray(criteria) ? criteria : []);
    } catch (err) {
      console.error('Error loading criteria:', err);
      setError('Error al cargar los criterios disponibles');
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const addCriteria = (criteria: Criteria) => {
    if (form.selectedCriteria.some(sc => sc.criteriaId === criteria.id)) {
      return; // Ya está agregado
    }

    setForm(prev => ({
      ...prev,
      selectedCriteria: [
        ...prev.selectedCriteria,
        {
          criteriaId: criteria.id,
          weight: criteria.weight || 10, // Usar peso del criterio o 10 por defecto
          category: criteria.category
        }
      ]
    }));
  };

  const removeCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.filter(sc => sc.criteriaId !== criteriaId)
    }));
  };

  const updateCriteriaWeight = (criteriaId: number, weight: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, weight: isNaN(weight) ? 0.1 : Math.max(0.1, Math.min(100, weight)) } : sc
      )
    }));
  };

  const updateCriteriaCategory = (criteriaId: number, category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, category } : sc
      )
    }));
  };

  const getTotalWeightByCategory = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    return form.selectedCriteria
      .filter(sc => sc.category === category)
      .reduce((sum, sc) => sum + sc.weight, 0);
  };

  const normalizeWeightsByCategory = () => {
    const categories: ('productividad' | 'conducta_laboral' | 'habilidades')[] = ['productividad', 'conducta_laboral', 'habilidades'];
    
    setForm(prev => {
      let updatedCriteria = [...prev.selectedCriteria];
      
      categories.forEach(category => {
        const categoryCriteria = updatedCriteria.filter(sc => sc.category === category);
        const totalWeight = categoryCriteria.reduce((sum, sc) => sum + sc.weight, 0);
        
        if (totalWeight > 0 && categoryCriteria.length > 0) {
          // Normalizar para que sume 100%
          const scale = 100 / totalWeight;
          updatedCriteria = updatedCriteria.map(sc => {
            if (sc.category === category) {
              const newWeight = sc.weight * scale;
              // Redondear a 2 decimales y asegurar que esté entre 0.1 y 100
              return { ...sc, weight: Math.max(0.1, Math.min(100, Number(newWeight.toFixed(2)))) };
            }
            return sc;
          });
          
          // Ajustar el último criterio para garantizar que sume exactamente 100%
          const finalCategoryCriteria = updatedCriteria.filter(sc => sc.category === category);
          const finalTotal = finalCategoryCriteria.reduce((sum, sc) => sum + sc.weight, 0);
          if (Math.abs(finalTotal - 100) > 0.01 && finalCategoryCriteria.length > 0) {
            const lastCriteria = finalCategoryCriteria[finalCategoryCriteria.length - 1];
            updatedCriteria = updatedCriteria.map(sc => {
              if (sc.criteriaId === lastCriteria.criteriaId) {
                return { ...sc, weight: Number((sc.weight + (100 - finalTotal)).toFixed(2)) };
              }
              return sc;
            });
          }
        }
      });
      
      console.log('🔄 Normalized weights:', JSON.stringify(updatedCriteria, null, 2));
      
      return { ...prev, selectedCriteria: updatedCriteria };
    });
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre de la plantilla es obligatorio.';
    if (form.selectedCriteria.length === 0) return 'Debe seleccionar al menos un criterio.';
    
    const categories: ('productividad' | 'conducta_laboral' | 'habilidades')[] = ['productividad', 'conducta_laboral', 'habilidades'];
    const validationErrors: string[] = [];

    categories.forEach(category => {
      const totalWeight = getTotalWeightByCategory(category);
      if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
        validationErrors.push(
          `Los pesos de ${category} deben sumar exactamente 100% (actual: ${totalWeight.toFixed(2)}%)`
        );
      }
    });

    if (validationErrors.length > 0) {
      return validationErrors.join('. ') + '. Use el botón "Normalizar" para ajustar automáticamente.';
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
      // Agrupar criterios por categoría, enviar pesos como están (en porcentaje 0-100)
      const criteriaByCategory = {
        productivity: form.selectedCriteria
          .filter(sc => sc.category === 'productividad')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })), // Enviar como porcentaje
        work_conduct: form.selectedCriteria
          .filter(sc => sc.category === 'conducta_laboral')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })), // Enviar como porcentaje
        skills: form.selectedCriteria
          .filter(sc => sc.category === 'habilidades')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })) // Enviar como porcentaje
      };

      const templateData: CreateTemplateDTO = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        criteria: criteriaByCategory
      };

      console.log('🔄 Creating template with data:', JSON.stringify(templateData, null, 2));

      const newTemplate = await createTemplate(templateData);

      console.log('✅ Template created successfully:', newTemplate);

      setShowSuccess(true);
      
      setTimeout(() => {
        onCreated(newTemplate);
        handleClose();
      }, 1500);

    } catch (err: unknown) {
      console.error('❌ Error creating template:', err);
      setError((err as Error).message || 'Error al crear la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setForm({
      name: '',
      description: '',
      selectedCriteria: [],
    });
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const getCriteriaById = (id: number) => {
    return availableCriteria.find(c => c.id === id);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Plantilla Creada!</h3>
            <p className="text-gray-600">La plantilla se ha configurado exitosamente.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-purple-500" />
                Crear Nueva Plantilla
              </h3>
              <button 
                onClick={handleClose} 
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Plantilla *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Ej: Evaluación Anual, Evaluación Trimestral..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Opcional)
                  </label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    type="text"
                    placeholder="Descripción breve de la plantilla..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Selección de criterios */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Criterios de Evaluación
                </h4>

                {loadingCriteria ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Cargando criterios...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Criterios disponibles */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Criterios Disponibles</h5>
                      <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        {availableCriteria.length === 0 ? (
                          <p className="text-gray-500 text-sm">No hay criterios disponibles</p>
                        ) : (
                          availableCriteria
                            .filter(c => !form.selectedCriteria.some(sc => sc.criteriaId === c.id))
                            .map(criteria => (
                              <div
                                key={criteria.id}
                                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg mb-2"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{criteria.description}</p>
                                  <p className="text-xs text-gray-500">
                                    {criteria.category === 'productividad' ? 'Productividad' :
                                     criteria.category === 'conducta_laboral' ? 'Conducta Laboral' :
                                     'Habilidades'}
                                  </p>
                                  <p className="text-xs text-purple-600">Peso sugerido: {criteria.weight.toFixed(2)}%</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addCriteria(criteria)}
                                  className="p-1 hover:bg-purple-100 rounded"
                                  disabled={loading}
                                >
                                  <Plus className="w-4 h-4 text-purple-600" />
                                </button>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Criterios seleccionados */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-700">Criterios Seleccionados</h5>
                        {form.selectedCriteria.length > 0 && (
                          <div className="text-sm">
                            {['productividad', 'conducta_laboral', 'habilidades'].map(category => {
                              const total = getTotalWeightByCategory(category as 'productividad' | 'conducta_laboral' | 'habilidades');
                              return (
                                <span
                                  key={category}
                                  className={`block ${Math.abs(total - 100) < 0.01 || total === 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {category === 'productividad' ? 'Productividad' :
                                   category === 'conducta_laboral' ? 'Conducta Laboral' :
                                   'Habilidades'}: {total.toFixed(2)}%
                                </span>
                              );
                            })}
                            <button
                              type="button"
                              onClick={normalizeWeightsByCategory}
                              className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                              disabled={loading}
                            >
                              Normalizar
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        {form.selectedCriteria.length === 0 ? (
                          <p className="text-gray-500 text-sm">No hay criterios seleccionados</p>
                        ) : (
                          form.selectedCriteria.map(sc => {
                            const criteria = getCriteriaById(sc.criteriaId);
                            return (
                              <div key={sc.criteriaId} className="p-3 bg-gray-50 rounded-lg mb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{criteria?.description || 'Criterio desconocido'}</p>
                                    <select
                                      value={sc.category}
                                      onChange={(e) => updateCriteriaCategory(sc.criteriaId, e.target.value as 'productividad' | 'conducta_laboral' | 'habilidades')}
                                      className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 mt-1"
                                      disabled={loading}
                                    >
                                      <option value="productividad">Productividad</option>
                                      <option value="conducta_laboral">Conducta Laboral</option>
                                      <option value="habilidades">Habilidades</option>
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeCriteria(sc.criteriaId)}
                                    className="p-1 hover:bg-red-100 rounded"
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Percent className="w-3 h-3 text-gray-400" />
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    value={sc.weight}
                                    onChange={(e) => updateCriteriaWeight(sc.criteriaId, parseFloat(e.target.value))}
                                    className="flex-1 text-sm p-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                                    placeholder="0.0"
                                    disabled={loading}
                                  />
                                  <span className="text-xs text-gray-500 min-w-[40px]">
                                    {sc.weight.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Preview */}
              {form.name && form.selectedCriteria.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Vista previa:</h4>
                  <div>
                    <p className="font-medium text-purple-900">{form.name}</p>
                    {form.description && (
                      <p className="text-sm text-purple-700 mb-2">{form.description}</p>
                    )}
                    <p className="text-sm text-purple-700">
                      {form.selectedCriteria.length} criterios configurados
                    </p>
                    <p className="text-xs text-purple-600">
                      Pesos por categoría:
                      {['productividad', 'conducta_laboral', 'habilidades'].map(category => {
                        const total = getTotalWeightByCategory(category as 'productividad' | 'conducta_laboral' | 'habilidades');
                        return total > 0 ? `${category === 'productividad' ? 'Productividad' : category === 'conducta_laboral' ? 'Conducta Laboral' : 'Habilidades'}: ${total.toFixed(2)}%` : null;
                      }).filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || form.selectedCriteria.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear Plantilla
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

export default CrearPlantillaModal;