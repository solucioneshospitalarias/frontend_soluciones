// src/components/CrearPlantillaModal.tsx
// ✅ Modal corregido con tipos actualizados

import React, { useState, useEffect } from 'react';
import { FileCheck, X, Loader2, Plus, Target, Trash2, Percent } from 'lucide-react';
import { getCriteria, createTemplate } from '../services/evaluationService';
import type { Template, Criteria, CreateTemplateDTO } from '../services/evaluationService';

interface CrearPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newTemplate: Template) => void;
}

interface PlantillaForm {
  name: string;
  description: string;
  selectedCriteria: { criteriaId: number; weight: number }[]; // ✅ criteriaId como number
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

  // Cargar criterios disponibles cuando se abre el modal
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

  // ✅ Corregir addCriteria para usar tipos number
  const addCriteria = (criteria: Criteria) => {
    if (form.selectedCriteria.some(sc => sc.criteriaId === criteria.id)) {
      return; // Ya está agregado
    }

    setForm(prev => ({
      ...prev,
      selectedCriteria: [
        ...prev.selectedCriteria,
        { criteriaId: criteria.id, weight: criteria.weight || 0.1 }
      ]
    }));
  };

  // ✅ Corregir removeCriteria para usar tipos number
  const removeCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.filter(sc => sc.criteriaId !== criteriaId)
    }));
  };

  // ✅ Corregir updateCriteriaWeight para usar tipos number
  const updateCriteriaWeight = (criteriaId: number, weight: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, weight } : sc
      )
    }));
  };

  const getTotalWeight = () => {
    return form.selectedCriteria.reduce((sum, sc) => sum + sc.weight, 0);
  };

  const normalizeWeights = () => {
    const total = getTotalWeight();
    if (total === 0) return;

    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc => ({
        ...sc,
        weight: Number((sc.weight / total).toFixed(3))
      }))
    }));
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre de la plantilla es obligatorio.';
    if (form.selectedCriteria.length === 0) return 'Debe seleccionar al menos un criterio.';
    
    const totalWeight = getTotalWeight();
    if (Math.abs(totalWeight - 1) > 0.01) {
      return 'La suma de los pesos debe ser igual a 1.0 (100%). Use el botón "Normalizar" para ajustar automáticamente.';
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
      // ✅ Crear usando la API real
      const templateData: CreateTemplateDTO = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        criteria: form.selectedCriteria.map(sc => ({
          criteria_id: sc.criteriaId,
          weight: sc.weight
        }))
      };

      console.log('🔄 Creating template with data:', templateData);

      const newTemplate = await createTemplate(templateData);

      console.log('✅ Template created successfully:', newTemplate);

      setShowSuccess(true);
      
      setTimeout(() => {
        onCreated(newTemplate);
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error creating template:', err);
      setError(err.message || 'Error al crear la plantilla');
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

  // ✅ Corregir getCriteriaById para usar tipos number
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
                                  <p className="text-xs text-gray-500">{criteria.category}</p>
                                  <p className="text-xs text-purple-600">Peso sugerido: {Math.round((criteria.weight || 0) * 100)}%</p>
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
                            <span className={`font-medium ${Math.abs(getTotalWeight() - 1) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                              Total: {Math.round(getTotalWeight() * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={normalizeWeights}
                              className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
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
                                    <p className="font-medium text-sm">{criteria?.description}</p>
                                    <p className="text-xs text-gray-500">{criteria?.category}</p>
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
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    value={sc.weight}
                                    onChange={(e) => updateCriteriaWeight(sc.criteriaId, parseFloat(e.target.value) || 0)}
                                    className="flex-1 text-sm p-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                                    placeholder="0.000"
                                    disabled={loading}
                                  />
                                  <span className="text-xs text-gray-500 min-w-[40px]">
                                    {Math.round(sc.weight * 100)}%
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
                      Pesos: {form.selectedCriteria.map(sc => `${Math.round(sc.weight * 100)}%`).join(', ')}
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