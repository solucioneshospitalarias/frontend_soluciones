import React, { useState, useEffect } from 'react';
import { FileCheck, X, Loader2, Save, Trash2, Percent, Lock, Unlock, RotateCcw, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { getCriteria, getTemplateById, updateTemplate } from '../services/evaluationService';
import { formatForInput, normalizeWeights, getInputStep, sanitizeInputValue, formatPercentage } from '../utils/numberFormatting';
import type { Criteria, UpdateTemplateDTO, Template, BackendTemplateCriteria, TemplateCriteriaByCategory } from '../types/evaluation';

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

  // Helper function para convertir criterios del backend al formato del formulario
  const convertBackendCriteriaToForm = (templateCriteria: Template['criteria']): SelectedCriteria[] => {
    const result: SelectedCriteria[] = [];

    // Si viene como objeto organizado por categorías (estructura del backend)
    if (templateCriteria && typeof templateCriteria === 'object' && !Array.isArray(templateCriteria)) {
      const criteriaByCategory = templateCriteria as TemplateCriteriaByCategory;
      
      // Procesar productivity
      if (criteriaByCategory.productivity && Array.isArray(criteriaByCategory.productivity)) {
        criteriaByCategory.productivity.forEach((tc: BackendTemplateCriteria) => {
          result.push({
            criteriaId: tc.criteria?.id || tc.id,
            weight: tc.weight,
            category: 'productividad',
            isLocked: false
          });
        });
      }

      // Procesar work_conduct
      if (criteriaByCategory.work_conduct && Array.isArray(criteriaByCategory.work_conduct)) {
        criteriaByCategory.work_conduct.forEach((tc: BackendTemplateCriteria) => {
          result.push({
            criteriaId: tc.criteria?.id || tc.id,
            weight: tc.weight,
            category: 'conducta_laboral',
            isLocked: false
          });
        });
      }

      // Procesar skills
      if (criteriaByCategory.skills && Array.isArray(criteriaByCategory.skills)) {
        criteriaByCategory.skills.forEach((tc: BackendTemplateCriteria) => {
          result.push({
            criteriaId: tc.criteria?.id || tc.id,
            weight: tc.weight,
            category: 'habilidades',
            isLocked: false
          });
        });
      }
    }
    // Si viene como array (formato antiguo)
    else if (Array.isArray(templateCriteria)) {
      templateCriteria.forEach((tc) => {
        const criteriaData = availableCriteria.find(c => c.id === tc.criteria_id);
        if (criteriaData) {
          result.push({
            criteriaId: tc.criteria_id,
            weight: tc.weight,
            category: criteriaData.category as 'productividad' | 'conducta_laboral' | 'habilidades',
            isLocked: false
          });
        }
      });
    }

    return result;
  };

  const loadData = async () => {
    if (!templateId) return;

    setLoadingData(true);
    setError(null);
    try {
      // Cargar criterios disponibles
      const criteriaData = await getCriteria();
      
      // ✅ CORRECCIÓN 1: Filtrar solo criterios ACTIVOS (is_active === true)
      const activeCriteria = Array.isArray(criteriaData) 
        ? criteriaData.filter(c => c.is_active === true) 
        : [];
      
      console.log('📋 Total criteria fetched:', criteriaData.length);
      console.log('✅ Active criteria:', activeCriteria.length);
      console.log('❌ Inactive criteria filtered out:', criteriaData.length - activeCriteria.length);
      
      setAvailableCriteria(activeCriteria);

      // Luego cargar la plantilla específica
      const template = await getTemplateById(templateId);
      
      console.log('📋 Template loaded from backend:', template);
      console.log('📋 Template criteria structure:', template.criteria);

      setOriginalTemplate(template);

      // Convertir criterios al formato del formulario
      const selectedCriteria = convertBackendCriteriaToForm(template.criteria);

      console.log('📋 Converted selectedCriteria:', selectedCriteria);

      setForm({
        name: template.name,
        description: template.description || '',
        is_active: template.is_active,
        selectedCriteria,
      });

    } catch (err) {
      console.error('❌ Error loading template data:', err);
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
      category: criteria.category as 'productividad' | 'conducta_laboral' | 'habilidades',
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

  const handleWeightChange = (criteriaId: number, newWeight: string, _category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    const sanitizedWeight = sanitizeInputValue(newWeight, 0, 2);
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, weight: sanitizedWeight } : sc
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

  const getWeightColor = (total: number): string => {
    if (total === 0) return 'text-gray-500';
    if (Math.abs(total - 100) < 0.01) return 'text-green-600 font-bold';
    return 'text-red-600 font-bold';
  };

  // ✅ CORRECCIÓN 2: Normalización que incluye criterios con peso 0
  const normalizeWeightsByCategory = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    console.log(`🔄 Starting normalization for category: ${category}`);
    
    setForm(prev => {
      let updatedCriteria = [...prev.selectedCriteria];
      
      // 1. Filtrar criterios de la categoría objetivo
      const categoryItems = updatedCriteria.filter(sc => sc.category === category);
      
      console.log(`📊 Category items for ${category}:`, categoryItems.length);
      
      // ✅ Separar criterios bloqueados y desbloqueados (incluye criterios con peso 0)
      const lockedItems = categoryItems.filter(sc => sc.isLocked);
      const unlockedItems = categoryItems.filter(sc => !sc.isLocked);
      
      console.log(`🔒 Locked items: ${lockedItems.length}`);
      console.log(`🔓 Unlocked items: ${unlockedItems.length} (including zero-weight items)`);
      console.log(`   Unlocked IDs:`, unlockedItems.map(sc => sc.criteriaId));

      if (unlockedItems.length === 0) {
        console.warn(`⚠️ No unlocked items in ${category} to normalize`);
        return prev;
      }

      // 2. Calcular peso bloqueado total
      const lockedWeight = lockedItems.reduce((sum, sc) => sum + sc.weight, 0);
      console.log(`💰 Total locked weight: ${lockedWeight.toFixed(2)}%`);
      
      // 3. Calcular peso disponible para distribuir
      const remainingWeight = Math.max(0, 100 - lockedWeight);
      console.log(`💵 Remaining weight to distribute: ${remainingWeight.toFixed(2)}%`);

      // 4. ✅ DISTRIBUIR EQUITATIVAMENTE entre TODOS los criterios desbloqueados
      const weightPerItem = remainingWeight / unlockedItems.length;
      console.log(`⚖️ Weight per unlocked item: ${weightPerItem.toFixed(2)}%`);

      // 5. Aplicar el nuevo peso a todos los criterios desbloqueados
      updatedCriteria = updatedCriteria.map(sc => {
        if (sc.category === category && !sc.isLocked) {
          const newWeight = Number(weightPerItem.toFixed(2));
          console.log(`  → Criteria ${sc.criteriaId}: ${sc.weight.toFixed(2)}% → ${newWeight}%`);
          return { ...sc, weight: newWeight };
        }
        return sc;
      });

      // 6. Ajuste de precisión para asegurar que sume exactamente 100%
      const finalCategoryItems = updatedCriteria.filter(sc => sc.category === category);
      const finalTotal = finalCategoryItems.reduce((sum, sc) => sum + sc.weight, 0);
      
      console.log(`🧮 Total after distribution: ${finalTotal.toFixed(2)}%`);

      // Si hay diferencia por redondeo, ajustar en el último criterio desbloqueado
      if (Math.abs(finalTotal - 100) > 0.01 && unlockedItems.length > 0) {
        const adjustment = 100 - finalTotal;
        const lastUnlocked = unlockedItems[unlockedItems.length - 1];
        
        updatedCriteria = updatedCriteria.map(sc => {
          if (sc.criteriaId === lastUnlocked.criteriaId) {
            const adjustedWeight = Number((sc.weight + adjustment).toFixed(2));
            console.log(`  🔧 Final adjustment on criteria ${sc.criteriaId}: ${sc.weight.toFixed(2)}% → ${adjustedWeight}%`);
            return { ...sc, weight: adjustedWeight };
          }
          return sc;
        });
      }

      // 7. Verificación final
      const verificationTotal = updatedCriteria
        .filter(sc => sc.category === category)
        .reduce((sum, sc) => sum + sc.weight, 0);
      
      console.log(`✅ Final total for ${category}: ${verificationTotal.toFixed(2)}%`);
      
      if (Math.abs(verificationTotal - 100) > 0.01) {
        console.warn(`⚠️ Warning: Total doesn't sum to 100%: ${verificationTotal.toFixed(2)}%`);
      }

      return { ...prev, selectedCriteria: updatedCriteria };
    });
  };

  const resetToOriginal = () => {
    if (!originalTemplate) return;

    const selectedCriteria = convertBackendCriteriaToForm(originalTemplate.criteria);

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
          `Los pesos de ${category} deben sumar exactamente 100% (actual: ${formatPercentage(totalWeight, false, 2)}%)`,
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
      // Organizar criterios por categoría como espera el backend
      const criteriaByCategory = {
        productivity: form.selectedCriteria
          .filter(sc => sc.category === 'productividad')
          .filter(sc => sc.weight > 0)
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
        work_conduct: form.selectedCriteria
          .filter(sc => sc.category === 'conducta_laboral')
          .filter(sc => sc.weight > 0)
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
        skills: form.selectedCriteria
          .filter(sc => sc.category === 'habilidades')
          .filter(sc => sc.weight > 0)
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
      };

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
    const criteria = availableCriteria.find(c => c.id === id);
    if (!criteria) {
      console.warn(`⚠️ Criteria with ID ${id} not found in availableCriteria`);
    }
    return criteria;
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
        {loadingData ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando plantilla...</h3>
            <p className="text-gray-600">Obteniendo información de la plantilla</p>
          </div>
        ) : showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Plantilla Actualizada!</h3>
            <p className="text-gray-600">Los cambios se han guardado exitosamente.</p>
          </div>
        ) : (
          <>
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

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Plantilla *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Evaluación Desarrolladores Q1 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe el propósito de esta plantilla..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Plantilla activa (disponible para crear evaluaciones)
                  </label>
                </div>
              </div>

              {/* Sección de criterios */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Criterios de Evaluación</h4>

                {/* Filtros */}
                <div className="mb-4">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as 'todos' | 'productividad' | 'conducta_laboral' | 'habilidades')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todos">Todos los criterios</option>
                    <option value="productividad">Productividad</option>
                    <option value="conducta_laboral">Conducta Laboral</option>
                    <option value="habilidades">Habilidades</option>
                  </select>
                </div>

                {/* Criterios disponibles */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Criterios disponibles:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {filteredAvailableCriteria.map(criteria => {
                      const isSelected = form.selectedCriteria.some(sc => sc.criteriaId === criteria.id);
                      return (
                        <button
                          key={criteria.id}
                          type="button"
                          onClick={() => !isSelected && addCriteria(criteria)}
                          disabled={isSelected}
                          className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{criteria.name}</p>
                            <p className="text-xs text-gray-500">{criteria.category}</p>
                          </div>
                          {!isSelected && <Plus className="w-4 h-4 text-purple-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Criterios seleccionados por categoría */}
                <div className="space-y-4">
                  {(['productividad', 'conducta_laboral', 'habilidades'] as const).map(category => {
                    const categoryCriteria = groupedSelectedCriteria[category];
                    const totalWeight = getTotalWeightByCategory(category);
                    
                    if (categoryCriteria.length === 0) return null;

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => setCollapsedCategories(prev => ({
                              ...prev,
                              [category]: !prev[category]
                            }))}
                            className="flex items-center gap-2"
                          >
                            {collapsedCategories[category] ? (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                            <h5 className="font-medium text-gray-800">
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                            </h5>
                            <span className="text-sm text-gray-500">
                              ({categoryCriteria.length} criterios)
                            </span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={getWeightColor(totalWeight)}>
                              {formatPercentage(totalWeight, true, 2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => normalizeWeightsByCategory(category)}
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                            >
                              Normalizar
                            </button>
                          </div>
                        </div>

                        {!collapsedCategories[category] && (
                          <div className="space-y-2">
                            {categoryCriteria.map(sc => {
                              const criteria = getCriteriaById(sc.criteriaId);
                              if (!criteria) return null;

                              return (
                                <div key={sc.criteriaId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{criteria.name}</p>
                                    <p className="text-xs text-gray-500">{criteria.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleCriteriaLock(sc.criteriaId)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      {sc.isLocked ? (
                                        <Lock className="w-4 h-4 text-gray-600" />
                                      ) : (
                                        <Unlock className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={formatForInput(sc.weight, 2)}
                                        onChange={(e) => handleWeightChange(sc.criteriaId, e.target.value, category)}
                                        disabled={sc.isLocked}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        min="0"
                                        max="100"
                                        step={getInputStep(2)}
                                      />
                                      <Percent className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeCriteria(sc.criteriaId)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
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
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Actualizar Plantilla
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

export default EditarPlantillaModal;