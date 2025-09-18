import React, { useState, useEffect, useMemo } from 'react';
import { FileCheck, X, Loader2, Plus, Trash2, Percent, Lock, Unlock, RotateCcw, ChevronDown, ChevronRight, Users, User, UserCheck, Calendar, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { getUsers, getCriteria } from '../services/userService';
import { getPeriods, createEvaluations } from '../services/evaluationService';
import type { User as UserType } from '../types/user';
import type { Period, Criteria } from '../types/evaluation';
import type { ReferenceData, ConfirmationState } from '../services/referenceService';
import { referenceService } from '../services/referenceService';

interface SelectedCriteria {
  criteriaId: number;
  weight: number;
  category: 'productividad' | 'conducta_laboral' | 'habilidades';
  isLocked: boolean;
}

interface FilterState {
  department: string;
  position: string;
}

interface CrearEvaluacionModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newEvaluations: { evaluatedEmployeeIds: number[]; count: number }) => void;
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationState>>;
}

const CrearEvaluacionModal: React.FC<CrearEvaluacionModalProps> = ({
  show,
  onClose,
  onCreated,
  setConfirmationState,
}) => {
  const [form, setForm] = useState<{
    name: string;
    description: string;
    selectedCriteria: SelectedCriteria[];
    periodId: number | '';
    evaluatorId: number | null;
    selectedEmployees: number[];
  }>({
    name: '',
    description: '',
    selectedCriteria: [],
    periodId: '',
    evaluatorId: null,
    selectedEmployees: [],
  });
  const [availableCriteria, setAvailableCriteria] = useState<Criteria[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [references, setReferences] = useState<ReferenceData>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'todos' | 'productividad' | 'conducta_laboral' | 'habilidades'>('todos');
  const [searchTermEvaluator, setSearchTermEvaluator] = useState('');
  const [searchTermEmployees, setSearchTermEmployees] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    position: '',
  });
  const [collapsedCategories, setCollapsedCategories] = useState<Record<'productividad' | 'conducta_laboral' | 'habilidades', boolean>>({
    productividad: false,
    conducta_laboral: false,
    habilidades: false,
  });

  // Fetch data
  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [userData, refData, periodsData, criteriaData] = await Promise.all([
        getUsers(),
        referenceService.getFormReferences(),
        getProvided(),
        getCriteria(),
      ]);
      console.log('Users loaded:', userData);
      console.log('References loaded:', refData);
      console.log('Periods loaded:', periodsData);
      console.log('Criteria loaded:', criteriaData);
      setUsers(userData);
      setReferences(refData);
      setPeriods(periodsData);
      setAvailableCriteria(Array.isArray(criteriaData) ? criteriaData : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error loading data:', message);
      setError('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  // Format date for periods
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString;
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  // Get period status
  const getPeriodStatus = (period: Period) => {
    const now = new Date();
    const startDate = new Date(period.start_date);
    const dueDate = new Date(period.due_date);

    if (now >= startDate && now <= dueDate) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        label: 'Activo',
        description: 'Disponible para evaluaciones',
      };
    } else if (now < startDate) {
      return {
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: 'Próximo',
        description: `Inicia el ${formatDate(period.start_date)}`,
      };
    } else {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        label: 'No disponible',
        description: 'Período no disponible',
      };
    }
  };

  // Filter employees
  const filteredEvaluatorUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(searchTermEvaluator.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTermEvaluator.toLowerCase()) ||
        (user.position || '').toLowerCase().includes(searchTermEvaluator.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchTermEvaluator.toLowerCase());
      const matchesDepartment = !filters.department || user.department === filters.department;
      const matchesPosition = !filters.position || user.position === filters.position;
      return matchesSearch && matchesDepartment && matchesPosition;
    });
  }, [users, searchTermEvaluator, filters]);

  const filteredEmployeeUsers = useMemo(() => {
    return users.filter(user => {
      if (user.id === form.evaluatorId) return false;
      const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(searchTermEmployees.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTermEmployees.toLowerCase()) ||
        (user.position || '').toLowerCase().includes(searchTermEmployees.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchTermEmployees.toLowerCase());
      const matchesDepartment = !filters.department || user.department === filters.department;
      const matchesPosition = !filters.position || user.position === filters.position;
      return matchesSearch && matchesDepartment && matchesPosition;
    });
  }, [users, searchTermEmployees, filters, form.evaluatorId]);

  // Criteria management
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
          weight: criteria.weight * 100 || 10,
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
          : sc
      ),
    }));
  };

  const lockCriteriaWeight = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, isLocked: true } : sc
      ),
    }));
  };

  const toggleLockCriteria = (criteriaId: number) => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.criteriaId === criteriaId ? { ...sc, isLocked: !sc.isLocked } : sc
      ),
    }));
  };

  const resetCategoryWeights = (targetCategory: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    setForm(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.map(sc =>
        sc.category === targetCategory ? { ...sc, weight: 0, isLocked: false } : sc
      ),
    }));
  };

  const toggleCategoryCollapse = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getTotalWeightByCategory = (category: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    return form.selectedCriteria
      .filter(sc => sc.category === category)
      .reduce((sum, sc) => sum + sc.weight, 0);
  };

  const normalizeWeightsByCategory = (targetCategory: 'productividad' | 'conducta_laboral' | 'habilidades') => {
    setForm(prev => {
      let updatedCriteria = [...prev.selectedCriteria];
      const categoryCriteria = updatedCriteria.filter(sc => sc.category === targetCategory);
      const lockedCriteria = categoryCriteria.filter(sc => sc.isLocked);
      const unlockedCriteria = categoryCriteria.filter(sc => !sc.isLocked);

      const lockedWeight = lockedCriteria.reduce((sum, sc) => sum + sc.weight, 0);
      const remainingWeight = Math.max(0, 100 - lockedWeight);
      const unlockedCount = unlockedCriteria.length;

      if (unlockedCount > 0) {
        const weightPerCriteria = remainingWeight / unlockedCount;
        updatedCriteria = updatedCriteria.map(sc => {
          if (sc.category === targetCategory && !sc.isLocked) {
            return { ...sc, weight: Number(weightPerCriteria.toFixed(2)) };
          }
          return sc;
        });

        const finalCategoryCriteria = updatedCriteria.filter(sc => sc.category === targetCategory);
        const finalTotal = finalCategoryCriteria.reduce((sum, sc) => sum + sc.weight, 0);
        if (Math.abs(finalTotal - 100) > 0.01 && unlockedCriteria.length > 0) {
          const lastUnlocked = unlockedCriteria[unlockedCriteria.length - 1];
          updatedCriteria = updatedCriteria.map(sc => {
            if (sc.criteriaId === lastUnlocked.criteriaId) {
              return { ...sc, weight: Number((sc.weight + (100 - finalTotal)).toFixed(2)) };
            }
            return sc;
          });
        }
      }

      console.log(`🔄 Normalized weights for ${targetCategory}:`, JSON.stringify(updatedCriteria, null, 2));
      return { ...prev, selectedCriteria: updatedCriteria };
    });
  };

  const normalizeAllWeights = () => {
    const categories: ('productividad' | 'conducta_laboral' | 'habilidades')[] = ['productividad', 'conducta_laboral', 'habilidades'];
    categories.forEach(category => normalizeWeightsByCategory(category));
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

  const activeFiltersCount = Object.values(filters).filter(value => value).length;

  const clearFilters = () => {
    setFilters({
      department: '',
      position: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'periodId' ? (parseInt(value) || '') : value,
    }));
    if (error) setError(null);
  };

  const handleEvaluatorSelect = (id: number) => {
    setForm(prev => ({
      ...prev,
      evaluatorId: id,
      selectedEmployees: prev.selectedEmployees.filter(empId => empId !== id),
    }));
  };

  const toggleEmployee = (id: number) => {
    setForm(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(id)
        ? prev.selectedEmployees.filter(empId => empId !== id)
        : [...prev.selectedEmployees, id],
    }));
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre de la evaluación es obligatorio.';
    if (!form.periodId) return 'Seleccione un período.';
    if (!form.evaluatorId) return 'Seleccione un evaluador.';
    if (form.selectedEmployees.length === 0) return 'Seleccione al menos un empleado a evaluar.';
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

    setLoading(true);
    setError(null);

    try {
      const criteriaByCategory = {
        productivity: form.selectedCriteria
          .filter(sc => sc.category === 'productividad')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight / 100 })),
        work_conduct: form.selectedCriteria
          .filter(sc => sc.category === 'conducta_laboral')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight / 100 })),
        skills: form.selectedCriteria
          .filter(sc => sc.category === 'habilidades')
          .map(sc => ({ criteria_id: sc.criteriaId, weight: sc.weight / 100 })),
      };

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        period_id: form.periodId as number,
        evaluator_id: form.evaluatorId!,
        employee_ids: form.selectedEmployees,
        criteria: criteriaByCategory,
      };

      console.log('🔄 Creating evaluations with data:', JSON.stringify(payload, null, 2));
      const newEvaluations = await createEvaluations(payload);
      console.log('✅ Evaluations created:', newEvaluations);

      setShowSuccess(true);

      setTimeout(() => {
        onCreated(newEvaluations);
        setConfirmationState({
          show: true,
          title: '¡Evaluaciones Creadas!',
          message: `Se han creado ${newEvaluations.count} evaluaciones exitosamente.`,
          type: 'success',
          onConfirm: () => setConfirmationState((prev: ConfirmationState) => ({ ...prev, show: false })),
          loading: false,
        });
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Error creating evaluations:', errorMessage);
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
      selectedCriteria: [],
      periodId: '',
      evaluatorId: null,
      selectedEmployees: [],
    });
    setError(null);
    setShowSuccess(false);
    setFilterCategory('todos');
    setSearchTermEvaluator('');
    setSearchTermEmployees('');
    setFilters({ department: '', position: '' });
    setCollapsedCategories({ productividad: false, conducta_laboral: false, habilidades: false });
    onClose();
  };

  const selectedEvaluator = users.find(u => u.id === form.evaluatorId);

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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Evaluaciones Creadas!</h3>
            <p className="text-gray-600">{`Se han creado ${form.selectedEmployees.length} evaluaciones exitosamente.`}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-purple-500" />
                Crear Nueva Evaluación
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
                {/* Left Column: Basic Info, Period, Evaluator, Available Criteria */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Evaluación *
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
                        placeholder="Descripción breve de la evaluación..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Period Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Período de Evaluación *
                    </label>
                    <select
                      name="periodId"
                      value={form.periodId}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={loading}
                    >
                      <option value="">Seleccione un período</option>
                      {periods.map(period => {
                        const status = getPeriodStatus(period);
                        return (
                          <option key={period.id} value={period.id}>
                            {period.name} ({formatDate(period.start_date)} - {formatDate(period.due_date)}) - {status.label}
                          </option>
                        );
                      })}
                    </select>
                    {periods.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-600 mb-2">Estados de períodos:</p>
                        {periods.slice(0, 3).map(period => {
                          const status = getPeriodStatus(period);
                          const StatusIcon = status.icon;
                          return (
                            <div key={period.id} className={`flex items-center gap-2 p-2 rounded-lg ${status.bg} ${status.border} border text-xs`}>
                              <StatusIcon className={`w-3 h-3 ${status.color}`} />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 truncate">{period.name}</span>
                                <span className={`ml-2 ${status.color}`}>({status.label})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Evaluator Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Evaluador *
                    </label>
                    {selectedEvaluator && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">
                            {selectedEvaluator.name || `${selectedEvaluator.first_name || ''} ${selectedEvaluator.last_name || ''}`.trim()}
                          </p>
                          <p className="text-sm text-blue-600">{selectedEvaluator.position || '—'} | {selectedEvaluator.department || '—'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, evaluatorId: null }))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Buscar evaluador..."
                        value={searchTermEvaluator}
                        onChange={(e) => setSearchTermEvaluator(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filteredEvaluatorUsers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">No se encontraron evaluadores</p>
                      ) : (
                        filteredEvaluatorUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                              form.evaluatorId === user.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                            }`}
                            onClick={() => handleEvaluatorSelect(user.id)}
                          >
                            <input
                              type="radio"
                              name="evaluator"
                              checked={form.evaluatorId === user.id}
                              onChange={() => handleEvaluatorSelect(user.id)}
                              disabled={loading}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.position || '—'} | {user.department || '—'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Available Criteria */}
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
                    <div className="border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
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
                                <p className="text-xs text-purple-600">Peso sugerido: {(criteria.weight * 100).toFixed(2)}%</p>
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

                {/* Right Column: Selected Criteria & Employees */}
                <div className="space-y-6">
                  {/* Filters */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">
                        <Filter className="w-4 h-4 inline mr-2 text-blue-600" />
                        Filtros
                      </h5>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          Limpiar ({activeFiltersCount})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={loading}
                      >
                        <option value="">Todos los departamentos</option>
                        {references.departments?.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                      <select
                        value={filters.position}
                        onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={loading}
                      >
                        <option value="">Todos los cargos</option>
                        {references.positions?.map(pos => (
                          <option key={pos.id} value={pos.name}>{pos.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Employees Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-700">
                        <UserCheck className="w-4 h-4 inline mr-2" />
                        Empleados a Evaluar *
                      </h5>
                      {form.selectedEmployees.length > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {form.selectedEmployees.length} seleccionados
                        </span>
                      )}
                    </div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Buscar empleados..."
                        value={searchTermEmployees}
                        onChange={(e) => setSearchTermEmployees(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {filteredEmployeeUsers.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          {form.evaluatorId ? 'No se encontraron empleados' : 'Primero seleccione un evaluador'}
                        </p>
                      ) : (
                        filteredEmployeeUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                              form.selectedEmployees.includes(user.id) ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-transparent'
                            }`}
                            onClick={() => toggleEmployee(user.id)}
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedEmployees.includes(user.id)}
                              onChange={() => toggleEmployee(user.id)}
                              disabled={loading}
                              className="w-4 h-4 text-green-500 focus:ring-green-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.position || '—'} | {user.department || '—'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Selected Criteria */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-700">Criterios Seleccionados *</h5>
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
                    <div className="border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {form.selectedCriteria.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay criterios seleccionados</p>
                      ) : (
                        <div className="space-y-4">
                          {(['productividad', 'conducta_laboral', 'habilidades'] as const).map(category => {
                            const categoryCriteria = groupedSelectedCriteria[category];
                            if (categoryCriteria.length === 0) return null;
                            const isCollapsed = collapsedCategories[category];
                            return (
                              <div key={category}>
                                <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => toggleCategoryCollapse(category)}>
                                  <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {category === 'productividad' ? 'Productividad' : category === 'conducta_laboral' ? 'Conducta Laboral' : 'Habilidades'}
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
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || form.selectedCriteria.length === 0 || form.selectedEmployees.length === 0}
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
                      Crear {form.selectedEmployees.length} Evaluacion{form.selectedEmployees.length !== 1 ? 'es' : ''}
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

export default CrearEvaluacionModal;