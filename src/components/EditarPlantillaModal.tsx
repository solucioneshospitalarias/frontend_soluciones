import React, { useState, useEffect } from 'react';
import { FileCheck, X, Loader2, Save, Trash2, Percent, Lock, Unlock, RotateCcw, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { getCriteria, getTemplates, updateTemplate } from '../services/evaluationService';
import type { Template, Criteria, UpdateTemplateDTO } from '../types/evaluation';

interface EditarPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onUpdated: (updatedTemplate: Template) => void;
  templateId: number | null;
}

interface SelectedCriteria {
  criteriaId: number;
  weight: number;
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
  isLocked: boolean;
}

interface PlantillaForm {
  name: string;
  description: string;
  is_active: boolean;
  selectedCriteria: SelectedCriteria[];
}

const EditarPlantillaModal: React.FC<EditarPlantillaModalProps> = ({ 
  show, 
  onClose, 
  onUpdated, 
  templateId 
}) => {
  const [form, setForm] = useState<PlantillaForm>({
    name: '',
    description: '',
    is_active: true,
    selectedCriteria: [],
  });
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [availableCriteria, setAvailableCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'todos' | 'productividad' | 'conducta_laboral' | 'habilidades'>('todos');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<'productividad' | 'conducta_laboral' | 'habilidades', boolean>>({
    productividad: false,
    conducta_laboral: false,
    habilidades: false,
  });

  useEffect(() => {
    if (show && templateId) {
      loadData();
    }
  }, [show, templateId]);

  const loadData = async () => {
    if (!templateId) return;
    
    setLoadingData(true);
    try {
      const [templates, criteria] = await Promise.all([
        getTemplates(),
        getCriteria()
      ]);

      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }

      setOriginalTemplate(template);
      setAvailableCriteria(Array.isArray(criteria) ? criteria : []);

      // Mapear criterios de la plantilla al formato del formulario
      const selectedCriteria: SelectedCriteria[] = template.criteria.map(tc => ({
        criteriaId: tc.criteria_id,
        weight: tc.weight,
        category: tc.criteria.category,
        isLocked: false,
      }));

      setForm({
        name: template.name,
        description: template.description || '',
        is_active: template.is_active,
        selectedCriteria,
      });

    } catch (err) {
      console.error('Error loading template data:', err);
      setError((err as Error).message || 'Error al cargar los datos de la plantilla');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    if (error) setError(null);
  };

  const addCriteria = (criteria: Criteria) => {
    if (form.selectedCriteria.some(sc => sc.criteriaId === criteria.id)) {
      return;
    }

    const newSelected: SelectedCriteria = {
      criteriaId: criteria.id,
      weight: 0,
      category: criteria.category,
      isLocked: false,
    };

    setForm(prev => ({
      ...prev,
      selectedCriteria: [...prev.selectedCriteria, newSelected],
    }));
  };

  const removeCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.filter(sc => sc.criteriaId !== criteriaId),
    }));
  };

  const updateCriteriaWeight = (criteriaId: number, weight: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, weight } : sc
      ),
    }));
  };

  const toggleCriteriaLock = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, isLocked: !sc.isLocked } : sc
      ),
    }));
  };

  const getTotalWeightByCategory = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    return form.selectedCriteria
      .filter(sc => sc.category === category)
      .reduce((sum, sc) => sum + sc.weight, 0);
  };

  const normalizeWeights = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    const categoryItems = form.selectedCriteria.filter(sc => sc.category === category);
    const unlockedItems = categoryItems.filter(sc => !sc.isLocked);
    
    if (unlockedItems.length === 0) return;

    const lockedTotal = categoryItems
      .filter(sc => sc.isLocked)
      .reduce((sum, sc) => sum + sc.weight, 0);
    
    const availableWeight = 100 - lockedTotal;
    const weightPerItem = availableWeight / unlockedItems.length;

    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc => {
        if (sc.category === category && !sc.isLocked) {
          return { ...sc, weight: Math.round(weightPerItem * 100) / 100 };
        }
        return sc;
      }),
    }));
  };

  const resetToOriginal = () => {
    if (!originalTemplate) return;

    const selectedCriteria: SelectedCriteria[] = originalTemplate.criteria.map(tc => ({
      criteriaId: tc.criteria_id,
      weight: tc.weight,
      category: tc.criteria.category,
      isLocked: false,
    }));

    setForm({
      name: originalTemplate.name,
      description: originalTemplate.description || '',
      is_active: originalTemplate.is_active,
      selectedCriteria,
    });
    setError(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'El nombre de la plantilla es requerido.';
    if (form.selectedCriteria.length === 0) return 'Debe seleccionar al menos un criterio.';

    const categories: ('productividad' | 'conducta_laboral' | 'habilidades')[] = ['productividad', 'conducta_laboral', 'habilidades'];
    const validationErrors: string[] = [];

    categories.forEach(category => {
      const totalWeight = getTotalWeightByCategory(category);
      if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
        validationErrors.push(
          `Los pesos de ${category} deben sumar exactamente 100% (actual: ${totalWeight.toFixed(2)}%)`,
        );
      }
    });

    if (validationErrors.length > 0) {
      return validationErrors.join('. ') + '. Use los botones "Normalizar" para ajustar automáticamente.';
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

    if (!templateId) {
      setError('ID de plantilla no válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const criteriaByCategory = form.selectedCriteria.map(sc => ({
        criteria_id: sc.criteriaId,
        weight: sc.weight,
      }));

      const updateData: UpdateTemplateDTO = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        is_active: form.is_active,
        criteria: criteriaByCategory,
      };

      console.log('🔄 Updating template with data:', JSON.stringify(updateData, null, 2));

      const updatedTemplate = await updateTemplate(templateId, updateData);

      console.log('✅ Template updated successfully:', updatedTemplate);

      setShowSuccess(true);

      setTimeout(() => {
        onUpdated(updatedTemplate);
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('❌ Error updating template:', err);
      setError((err as Error).message || 'Error al actualizar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setForm({
      name: '',
      description: '',
      is_active: true,
      selectedCriteria: [],
    });
    setOriginalTemplate(null);
    setError(null);
    setShowSuccess(false);
    setFilterCategory('todos');
    onClose();
  };

  const getCriteriaById = (id: number) => {
    return availableCriteria.find(c => c.id === id);
  };

  const filteredAvailableCriteria = filterCategory === 'todos'
    ? availableCriteria
    : availableCriteria.filter(c => c.category === filterCategory);

  const groupedSelectedCriteria = {
    productividad: form.selectedCriteria.filter(sc => sc.category === 'productividad'),
    conducta_laboral: form.selectedCriteria.filter(sc => sc.category === 'conducta_laboral'),
    habilidades: form.selectedCriteria.filter(sc => sc.category === 'habilidades'),
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Loading State */}
        {loadingData ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando plantilla...</h3>
            <p className="text-gray-600">Obteniendo información de la plantilla</p>
          </div>
        ) : showSuccess ? (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Plantilla Actualizada!</h3>
            <p className="text-gray-600">Los cambios se han guardado exitosamente.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-purple-500" />
                Editar Plantilla
                {originalTemplate && (
                  <span className="text-lg font-normal text-gray-600">
                    - {originalTemplate.name}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToOriginal}
                  disabled={loading}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Restaurar valores originales"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Basic Info + Available Criteria */}
                <div className="space-y-6">
                  <div className="space-y-4">
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
                        Descripción
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
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          name="is_active"
                          type="checkbox"
                          checked={form.is_active}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Plantilla activa
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Criterios Disponibles</h5>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value as 'todos' | 'productividad' | 'conducta_laboral' | 'habilidades')}
                      className="w-full p-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    >
                      <option value="todos">Todas las categorías</option>
                      <option value="productividad">Productividad</option>
                      <option value="conducta_laboral">Conducta Laboral</option>
                      <option value="habilidades">Habilidades</option>
                    </select>
                    <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                      {filteredAvailableCriteria.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No hay criterios disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredAvailableCriteria
                            .filter(criteria => !form.selectedCriteria.some(sc => sc.criteriaId === criteria.id))
                            .map(criteria => (
                              <div
                                key={criteria.id}
                                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900">{criteria.name}</h6>
                                  <p className="text-sm text-gray-600">{criteria.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      criteria.category === 'productividad' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : criteria.category === 'conducta_laboral'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {criteria.category === 'productividad' ? 'Productividad' :
                                       criteria.category === 'conducta_laboral' ? 'Conducta Laboral' : 'Habilidades'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addCriteria(criteria)}
                                  disabled={loading}
                                  className="ml-3 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Selected Criteria */}
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">
                      Criterios Seleccionados ({form.selectedCriteria.length})
                    </h5>
                    
                    {form.selectedCriteria.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500">Selecciona criterios de la lista anterior</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(['productividad', 'conducta_laboral', 'habilidades'] as const).map(category => {
                          const categoryCriteria = groupedSelectedCriteria[category];
                          const totalWeight = getTotalWeightByCategory(category);
                          const isCollapsed = collapsedCategories[category];
                          
                          if (categoryCriteria.length === 0) return null;

                          return (
                            <div key={category} className="border border-gray-200 rounded-lg">
                              <div 
                                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                                onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                              >
                                <div className="flex items-center gap-2">
                                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  <h6 className="font-medium text-gray-900">
                                    {category === 'productividad' ? 'Productividad' :
                                     category === 'conducta_laboral' ? 'Conducta Laboral' : 'Habilidades'}
                                    <span className="text-sm text-gray-600 ml-2">({categoryCriteria.length})</span>
                                  </h6>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {totalWeight.toFixed(1)}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      normalizeWeights(category);
                                    }}
                                    disabled={loading}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                                  >
                                    Normalizar
                                  </button>
                                </div>
                              </div>
                              
                              {!isCollapsed && (
                                <div className="p-3 space-y-3">
                                  {categoryCriteria.map(selectedCriteria => {
                                    const criteria = getCriteriaById(selectedCriteria.criteriaId);
                                    if (!criteria) return null;

                                    return (
                                      <div
                                        key={selectedCriteria.criteriaId}
                                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg"
                                      >
                                        <div className="flex-1">
                                          <h6 className="font-medium text-gray-900">{criteria.name}</h6>
                                          <p className="text-sm text-gray-600">{criteria.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              step="0.1"
                                              value={selectedCriteria.weight}
                                              onChange={e => updateCriteriaWeight(selectedCriteria.criteriaId, parseFloat(e.target.value) || 0)}
                                              disabled={loading || selectedCriteria.isLocked}
                                              className="w-16 p-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                                            />
                                            <Percent className="w-3 h-3 text-gray-400" />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => toggleCriteriaLock(selectedCriteria.criteriaId)}
                                            disabled={loading}
                                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                                          >
                                            {selectedCriteria.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeCriteria(selectedCriteria.criteriaId)}
                                            disabled={loading}
                                            className="p-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
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
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
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

export default EditarPlantillaModal;