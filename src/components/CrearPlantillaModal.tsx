import React, { useState, useEffect } from 'react';
import { FileCheck, X, Loader2, Plus, Trash2, Percent, Lock, Unlock, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { getCriteria, createTemplate } from '../services/evaluationService';
import type { Template, Criteria, CreateTemplateDTO } from '../types/evaluation';

interface CrearPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newTemplate: Template) => void;
}

interface SelectedCriteria {
  criteriaId: number;
  weight: number;
  category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo';
  isLocked: boolean;
}

interface PlantillaForm {
  name: string;
  description: string;
  selectedCriteria: SelectedCriteria[];
}

const CrearPlantillaModal: React.FC<CrearPlantillaModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<PlantillaForm>({
    name: '',
    description: '',
    selectedCriteria: [],
  });
  const [availableCriteria, setAvailableCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [_loadingCriteria, setLoadingCriteria] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'todos' | 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo'>('todos');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo', boolean>>({
    productividad: false,
    conducta_laboral: false,
    habilidades: false,
    seguridad_trabajo: false,
  });

  useEffect(() => {
    if (show) {
      loadCriteria();
    }
  }, [show]);

  // ✅ CORRECCIÓN: Filtrar solo criterios ACTIVOS
  const loadCriteria = async () => {
    setLoadingCriteria(true);
    try {
      const criteria = await getCriteria();
      
      // Filtrar solo criterios ACTIVOS (is_active === true)
      const activeCriteria = Array.isArray(criteria) 
        ? criteria.filter(c => c.is_active === true) 
        : [];
      
      console.log('📋 Total criteria fetched:', criteria.length);
      console.log('✅ Active criteria:', activeCriteria.length);
      console.log('❌ Inactive criteria filtered out:', criteria.length - activeCriteria.length);
      
      setAvailableCriteria(activeCriteria);
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
      return;
    }

    setForm(prev => ({
      ...prev,
      selectedCriteria: [
        ...prev.selectedCriteria,
        {
          criteriaId: criteria.id,
          weight: 0,
          category: criteria.category,
          isLocked: false,
        },
      ],
    }));
  };

  const removeCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.filter(sc => sc.criteriaId !== criteriaId),
    }));
  };

  const updateCriteriaWeight = (criteriaId: number, weight: string) => {
    const parsedWeight = weight === '' ? 0 : parseFloat(weight);
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId
          ? { ...sc, weight: isNaN(parsedWeight) ? 0 : Math.max(0, Math.min(100, parsedWeight)) }
          : sc,
      ),
    }));
  };

  const lockCriteriaWeight = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, isLocked: true } : sc,
      ),
    }));
  };

  const toggleLockCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, isLocked: !sc.isLocked } : sc,
      ),
    }));
  };

  const resetCategoryWeights = (targetCategory: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo') => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.category === targetCategory ? { ...sc, weight: 0, isLocked: false } : sc,
      ),
    }));
  };

  const toggleCategoryCollapse = (category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo') => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getTotalWeightByCategory = (category: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo') => {
    return form.selectedCriteria
      .filter(sc => sc.category === category)
      .reduce((sum, sc) => sum + sc.weight, 0);
  };

  // ✅ CORRECCIÓN: Normalización inclusiva (incluye criterios con peso 0)
  const normalizeWeightsByCategory = (targetCategory: 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo') => {
    console.log(`🔄 Starting normalization for category: ${targetCategory}`);
    
    setForm(prev => {
      let updatedCriteria = [...prev.selectedCriteria];
      
      // 1. Filtrar criterios de la categoría objetivo
      const categoryCriteria = updatedCriteria.filter(sc => sc.category === targetCategory);
      
      console.log(`📊 Category items for ${targetCategory}:`, categoryCriteria.length);
      
      // ✅ Separar criterios bloqueados y desbloqueados (incluye criterios con peso 0)
      const lockedCriteria = categoryCriteria.filter(sc => sc.isLocked);
      const unlockedCriteria = categoryCriteria.filter(sc => !sc.isLocked);
      
      console.log(`🔒 Locked items: ${lockedCriteria.length}`);
      console.log(`🔓 Unlocked items: ${unlockedCriteria.length} (including zero-weight items)`);
      console.log(`   Unlocked IDs:`, unlockedCriteria.map(sc => sc.criteriaId));

      if (unlockedCriteria.length === 0) {
        console.warn(`⚠️ No unlocked items in ${targetCategory} to normalize`);
        return prev;
      }

      // 2. Calcular peso bloqueado total
      const lockedWeight = lockedCriteria.reduce((sum, sc) => sum + sc.weight, 0);
      console.log(`💰 Total locked weight: ${lockedWeight.toFixed(2)}%`);
      
      // 3. Calcular peso disponible para distribuir
      const remainingWeight = Math.max(0, 100 - lockedWeight);
      console.log(`💵 Remaining weight to distribute: ${remainingWeight.toFixed(2)}%`);
      
      // 4. ✅ DISTRIBUIR EQUITATIVAMENTE entre TODOS los criterios desbloqueados
      const unlockedCount = unlockedCriteria.length;
      const weightPerCriteria = remainingWeight / unlockedCount;
      
      console.log(`⚖️ Weight per unlocked item: ${weightPerCriteria.toFixed(2)}%`);

      // 5. Aplicar el nuevo peso a todos los criterios desbloqueados
      updatedCriteria = updatedCriteria.map(sc => {
        if (sc.category === targetCategory && !sc.isLocked) {
          const newWeight = Number(weightPerCriteria.toFixed(2));
          console.log(`  → Criteria ${sc.criteriaId}: ${sc.weight.toFixed(2)}% → ${newWeight}%`);
          return { ...sc, weight: newWeight };
        }
        return sc;
      });

      // 6. Ajuste de precisión para asegurar que sume exactamente 100%
      const finalCategoryCriteria = updatedCriteria.filter(sc => sc.category === targetCategory);
      const finalTotal = finalCategoryCriteria.reduce((sum, sc) => sum + sc.weight, 0);
      
      console.log(`🧮 Total after distribution: ${finalTotal.toFixed(2)}%`);

      // Si hay diferencia por redondeo, ajustar en el último criterio desbloqueado
      if (Math.abs(finalTotal - 100) > 0.01 && unlockedCriteria.length > 0) {
        const adjustment = 100 - finalTotal;
        const lastUnlocked = unlockedCriteria[unlockedCriteria.length - 1];
        
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
        .filter(sc => sc.category === targetCategory)
        .reduce((sum, sc) => sum + sc.weight, 0);
      
      console.log(`✅ Final total for ${targetCategory}: ${verificationTotal.toFixed(2)}%`);
      
      if (Math.abs(verificationTotal - 100) > 0.01) {
        console.warn(`⚠️ Warning: Total doesn't sum to 100%: ${verificationTotal.toFixed(2)}%`);
      }

      return { ...prev, selectedCriteria: updatedCriteria };
    });
  };

  const normalizeAllWeights = () => {
    const categories: ('productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo')[] = ['productividad', 'conducta_laboral', 'habilidades', 'seguridad_trabajo'];
    categories.forEach(category => normalizeWeightsByCategory(category));
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre de la plantilla es obligatorio.';
    if (form.selectedCriteria.length === 0) return 'Debe seleccionar al menos un criterio.';

    const categories: ('productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo')[] = ['productividad', 'conducta_laboral', 'habilidades', 'seguridad_trabajo'];
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

    setLoading(true);
    setError(null);

    try {
      const criteriaByCategory = {
        productivity: form.selectedCriteria
          .filter(sc => sc.category === 'productividad')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
        work_conduct: form.selectedCriteria
          .filter(sc => sc.category === 'conducta_laboral')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
        skills: form.selectedCriteria
          .filter(sc => sc.category === 'habilidades')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight })),
        seguridad_trabajo: form.selectedCriteria
          .filter(sc => sc.category === 'seguridad_trabajo')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight }))
      };

      const templateData: CreateTemplateDTO = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        criteria: criteriaByCategory,
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
    seguridad_trabajo: form.selectedCriteria.filter(sc => sc.category === 'seguridad_trabajo'),
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
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

                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Criterios Disponibles</h5>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value as 'todos' | 'productividad' | 'conducta_laboral' | 'habilidades' | 'seguridad_trabajo')}
                      className="w-full p-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    >
                      <option value="todos">Todas las categorías</option>
                      <option value="productividad">Productividad</option>
                      <option value="conducta_laboral">Conducta Laboral</option>
                      <option value="habilidades">Habilidades</option>
                      <option value="seguridad_trabajo">Seguridad y salud en el Trabajo</option>
                    </select>
                    <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                      {filteredAvailableCriteria.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay criterios disponibles</p>
                      ) : (
                        filteredAvailableCriteria
                          .filter(c => !form.selectedCriteria.some(sc => sc.criteriaId === c.id))
                          .map(criteria => (
                            <div
                              key={criteria.id}
                              className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg mb-2"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{criteria.name}</p>
                                <p className="text-xs text-gray-500">{criteria.description}</p>
                                <p className="text-xs text-blue-600">{criteria.category}</p>
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
                </div>

                {/* Right Column: Selected Criteria */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-700">Criterios Seleccionados</h5>
                    {form.selectedCriteria.length > 0 && (
                      <button
                        type="button"
                        onClick={normalizeAllWeights}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                        disabled={loading}
                      >
                        Normalizar Todo
                      </button>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-[90vh] overflow-y-auto">
                    {form.selectedCriteria.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay criterios seleccionados</p>
                    ) : (
                      <div className="space-y-4">
                        {(['productividad', 'conducta_laboral', 'habilidades', 'seguridad_trabajo'] as const).map(category => {
                          const categoryCriteria = groupedSelectedCriteria[category];
                          if (categoryCriteria.length === 0) return null;
                          const isCollapsed = collapsedCategories[category];
                          return (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => toggleCategoryCollapse(category)}>
                                <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  {category === 'productividad' ? 'Productividad' : category === 'conducta_laboral' ? 'Conducta Laboral' : category === 'habilidades' ? 'Habilidades' : 'Seguridad y Salud en el Trabajo'}
                                  <span className="ml-2 text-sm text-gray-500">({categoryCriteria.length})</span>
                                </h6>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm ${Math.abs(getTotalWeightByCategory(category) - 100) < 0.01 || getTotalWeightByCategory(category) === 0 ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    Total: {getTotalWeightByCategory(category).toFixed(2)}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      normalizeWeightsByCategory(category);
                                    }}
                                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                                    disabled={loading}
                                  >
                                    Normalizar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resetCategoryWeights(category);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    disabled={loading}
                                  >
                                    <RotateCcw className="w-4 h-4 text-gray-500" />
                                  </button>
                                </div>
                              </div>
                              {!isCollapsed && (
                                <div className="space-y-2 border-l-2 border-gray-200 pl-3">
                                  {categoryCriteria.map(sc => {
                                    const criteria = getCriteriaById(sc.criteriaId);
                                    return (
                                      <div key={sc.criteriaId} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{criteria?.name || 'Criterio desconocido'}</p>
                                            <p className="text-xs text-gray-500">{criteria?.description || ''}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => toggleLockCriteria(sc.criteriaId)}
                                              className="p-1 hover:bg-gray-100 rounded"
                                              disabled={loading}
                                            >
                                              {sc.isLocked ? (
                                                <Lock className="w-4 h-4 text-blue-500" />
                                              ) : (
                                                <Unlock className="w-4 h-4 text-gray-400" />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeCriteria(sc.criteriaId)}
                                              className="p-1 hover:bg-red-100 rounded"
                                              disabled={loading}
                                            >
                                              <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Percent className="w-3 h-3 text-gray-400" />
                                          <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={sc.weight}
                                            onChange={e => updateCriteriaWeight(sc.criteriaId, e.target.value)}
                                            onBlur={() => lockCriteriaWeight(sc.criteriaId)}
                                            className="flex-1 text-sm p-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                                            placeholder="0.0"
                                            disabled={loading || sc.isLocked}
                                          />
                                          <span className="text-xs text-gray-500 min-w-[40px]">
                                            {sc.weight.toFixed(2)}%
                                          </span>
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