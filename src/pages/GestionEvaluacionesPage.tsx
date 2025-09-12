import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Calendar,
  Target,
  FileCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  X,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Activity,
  Copy,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  getCriteria,
  getPeriods,
  getTemplates,
  getEvaluations,
  deleteCriteria,
  deletePeriod,
  deleteTemplate,
  deleteEvaluation,
  cloneTemplate,
  type Criteria,
  type Period,
  type Template,
  type Evaluation
} from '../services/evaluationService';
import CrearCriterioModal from '../components/CrearCriterioModal';
import CrearPeriodoModal from '../components/CrearPeriodoModal';
import CrearPlantillaModal from '../components/CrearPlantillaModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CrearEvaluacionModal from '../components/CrearEvaluacionModal';
import EditarPeriodoModal from '../components/EditarPeriodoModal';

interface Stats {
  totalPeriods: number;
  activePeriods: number;
  totalCriteria: number;
  totalTemplates: number;
  totalEvaluations: number;
  averageWeight: number;
}

interface ConfirmationState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info' | 'success';
  loading: boolean;
}

const GestionEvaluacionesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'periodos' | 'criterios' | 'plantillas'>('periodos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | string>('todos');
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [cloningItems, setCloningItems] = useState<Set<number>>(new Set());
  const [showCrearCriterioModal, setShowCrearCriterioModal] = useState(false);
  const [showCrearPeriodoModal, setShowCrearPeriodoModal] = useState(false);
  const [showCrearPlantillaModal, setShowCrearPlantillaModal] = useState(false);
  const [showCrearEvaluacionModal, setShowCrearEvaluacionModal] = useState(false);
  const [showEditarPeriodoModal, setShowEditarPeriodoModal] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger',
    loading: false
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading all data from API...');
      const [periodsData, criteriaData, templatesData, evaluationsData] = await Promise.all([
        getPeriods().catch(err => {
          console.warn('Periods endpoint failed:', err);
          return [];
        }),
        getCriteria().catch(err => {
          console.warn('Criteria endpoint failed:', err);
          return [];
        }),
        getTemplates().catch(err => {
          console.warn('Templates endpoint failed:', err);
          return [];
        }),
        getEvaluations().catch(err => {
          console.warn('Evaluations endpoint failed:', err);
          return [];
        })
      ]);

      console.log('✅ All data loaded successfully');
      setPeriods(Array.isArray(periodsData) ? periodsData : []);
      setCriteria(Array.isArray(criteriaData) ? criteriaData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setEvaluations(Array.isArray(evaluationsData) ? evaluationsData : []);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Error al cargar los datos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodUpdated = async () => {
    await loadAllData();
    setShowEditarPeriodoModal(false);
    setEditingPeriodId(null);
  };

  const stats: Stats = useMemo(() => {
    const activePeriods = periods.filter(p => p.is_active).length;
    let totalWeight = 0;
    let averageWeight = 0;

    if (Array.isArray(criteria) && criteria.length > 0) {
      totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
      averageWeight = totalWeight / criteria.length;
    }

    return {
      totalPeriods: Array.isArray(periods) ? periods.length : 0,
      activePeriods,
      totalCriteria: Array.isArray(criteria) ? criteria.length : 0,
      totalTemplates: Array.isArray(templates) ? templates.length : 0,
      totalEvaluations: Array.isArray(evaluations) ? evaluations.length : 0,
      averageWeight: Math.round(averageWeight * 100)
    };
  }, [periods, criteria, templates, evaluations]);

  const categories = useMemo(() =>
    ['todos', ...new Set(criteria.map(c => c.category))], [criteria]
  );

  const filteredPeriods = useMemo(() =>
    periods.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ), [periods, searchTerm]
  );

  const filteredCriteria = useMemo(() =>
    criteria.filter(c =>
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'todos' || c.category === selectedCategory)
    ), [criteria, searchTerm, selectedCategory]
  );

  const filteredTemplates = useMemo(() =>
    templates.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ), [templates, searchTerm]
  );

  const filteredEvaluations = useMemo(() =>
    evaluations.filter(e =>
      e.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.evaluator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.period_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [evaluations, searchTerm]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString;
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const showConfirmation = (config: Omit<ConfirmationState, 'show' | 'loading'>) => {
    setConfirmationState({
      ...config,
      show: true,
      loading: false
    });
  };

  const hideConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, show: false }));
  };

  const handleDelete = async (type: string, id: number, itemName?: string) => {
    const typeNames = {
      period: 'período',
      criteria: 'criterio',
      template: 'plantilla',
      evaluation: 'evaluación'
    };

    const typeName = typeNames[type as keyof typeof typeNames] || type;

    showConfirmation({
      title: `Eliminar ${typeName}`,
      message: `¿Estás seguro de que quieres eliminar ${itemName ? `"${itemName}"` : `este ${typeName}`}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmationState(prev => ({ ...prev, loading: true }));
        setDeletingItems(prev => new Set(prev).add(id));

        try {
          console.log(`🗑️ Deleting ${type} with id:`, id);
          switch (type) {
            case 'period':
              await deletePeriod(id);
              setPeriods(prev => prev.filter(item => item.id !== id));
              break;
            case 'criteria':
              await deleteCriteria(id);
              setCriteria(prev => prev.filter(item => item.id !== id));
              break;
            case 'template':
              await deleteTemplate(id);
              setTemplates(prev => prev.filter(item => item.id !== id));
              break;
            case 'evaluation':
              await deleteEvaluation(id);
              setEvaluations(prev => prev.filter(item => item.id !== id));
              break;
          }
          console.log(`✅ ${type} eliminado exitosamente`);
          showConfirmation({
            title: '¡Eliminado!',
            message: `El ${typeName} se ha eliminado exitosamente.`,
            type: 'success',
            onConfirm: hideConfirmation
          });
        } catch (err: unknown) {
          console.error(`❌ Error deleting ${type}:`, err);
          showConfirmation({
            title: 'Error',
            message: `Error al eliminar el ${typeName}: ${(err as Error).message}`,
            type: 'danger',
            onConfirm: hideConfirmation
          });
        } finally {
          setDeletingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
    });
  };

  const handleClone = async (template: Template) => {
    const newName = prompt(`Nombre para la copia de "${template.name}":`);
    if (!newName || !newName.trim()) return;

    setCloningItems(prev => new Set(prev).add(template.id));

    try {
      console.log('📋 Cloning template...');
      const clonedTemplate = await cloneTemplate(template.id, newName.trim());
      setTemplates(prev => [clonedTemplate, ...prev]);
      showConfirmation({
        title: '¡Plantilla Clonada!',
        message: `La plantilla "${newName}" se ha creado exitosamente.`,
        type: 'success',
        onConfirm: hideConfirmation
      });
    } catch (err: unknown) {
      console.error('❌ Error cloning template:', err);
      showConfirmation({
        title: 'Error',
        message: `Error al clonar la plantilla: ${(err as Error).message}`,
        type: 'danger',
        onConfirm: hideConfirmation
      });
    } finally {
      setCloningItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
    }
  };

  const handleCreate = () => {
    switch (activeTab) {
      case 'criterios':
        setShowCrearCriterioModal(true);
        break;
      case 'periodos':
        setShowCrearPeriodoModal(true);
        break;
      case 'plantillas':
        setShowCrearPlantillaModal(true);
        break;
    }
  };

  const handleCriteriaCreated = (newCriteria: Criteria) => {
    setCriteria(prev => [newCriteria, ...prev]);
    setShowCrearCriterioModal(false);
    showConfirmation({
      title: '¡Criterio Creado!',
      message: `El criterio "${newCriteria.description}" se ha agregado exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  const handlePeriodCreated = (newPeriod: Period) => {
    setPeriods(prev => [newPeriod, ...prev]);
    setShowCrearPeriodoModal(false);
    showConfirmation({
      title: '¡Período Creado!',
      message: `El período "${newPeriod.name}" se ha configurado exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  const handleTemplateCreated = (newTemplate: Template) => {
    console.log('🔄 Adding new template:', newTemplate);
    setTemplates(prev => {
      const updatedTemplates = [newTemplate, ...prev];
      console.log('✅ Updated templates state:', updatedTemplates);
      return updatedTemplates;
    });
    setShowCrearPlantillaModal(false);
    showConfirmation({
      title: '¡Plantilla Creada!',
      message: `La plantilla "${newTemplate.name}" se ha configurado exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  const handleEvaluationCreated = (newEvaluation: Evaluation) => {
    setEvaluations(prev => [newEvaluation, ...prev]);
    setShowCrearEvaluacionModal(false);
    showConfirmation({
      title: '¡Evaluaciones Creadas!',
      message: `Las evaluaciones se han configurado exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todos');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'periodos':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar períodos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-4">
              {filteredPeriods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{searchTerm ? 'No se encontraron períodos con los filtros aplicados' : 'No hay períodos configurados'}</p>
                </div>
              ) : (
                filteredPeriods.map(period => {
                  const isDeleting = deletingItems.has(period.id);
                  return (
                    <div
                      key={period.id}
                      className={`group p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-blue-200 transition mb-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{period.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${period.is_active ? getStatusColor('active') : getStatusColor('pending')}`}>
                          {period.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </div>
                        <div className="text-xs text-gray-500">ID: {period.id}</div>
                        {period.description && (
                          <div className="text-xs text-gray-600">{period.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingPeriodId(period.id);
                            setShowEditarPeriodoModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg"
                          title="Editar período"
                          disabled={isDeleting}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete('period', period.id, period.name)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Eliminar período"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'criterios':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar criterios..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'todos' ? 'Todas las categorías' : c}
                  </option>
                ))}
              </select>
              {(searchTerm || selectedCategory !== 'todos') && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-4">
              {filteredCriteria.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{criteria.length === 0 ? 'No hay criterios configurados' : 'No se encontraron criterios con los filtros aplicados'}</p>
                </div>
              ) : (
                filteredCriteria.map(criterio => {
                  const isDeleting = deletingItems.has(criterio.id);
                  return (
                    <div
                      key={criterio.id}
                      className={`group p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-green-200 transition mb-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{criterio.description}</h4>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          {Math.round(criterio.weight * 100)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{criterio.category}</span>
                        <div className="text-xs text-gray-500">ID: {criterio.id} | Nombre: {criterio.name}</div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => console.log('Edit criteria:', criterio)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Editar criterio"
                          disabled={isDeleting}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDelete('criteria', criterio.id, criterio.description)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Eliminar criterio"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'plantillas':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{searchTerm ? 'No se encontraron plantillas con los filtros aplicados' : 'No hay plantillas configuradas'}</p>
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const isDeleting = deletingItems.has(template.id);
                  const isCloning = cloningItems.has(template.id);
                  const criteriaCount = template.criteria?.length || 0;
                  const criteriaWeights = template.criteria?.map(c => `${Math.round((c.weight || 0) * 100)}%`).join(', ') || 'N/A';

                  return (
                    <div
                      key={template.id}
                      className={`group p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-purple-200 transition mb-3 ${isDeleting || isCloning ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${template.is_active ? getStatusColor('active') : getStatusColor('pending')}`}>
                          {template.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Criterios: {criteriaCount}</span>
                          <span>ID: {template.id}</span>
                        </div>
                        <div className="text-xs text-gray-500">Pesos: {criteriaWeights}</div>
                        {template.description && (
                          <div className="text-xs text-gray-600">{template.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => console.log('View template:', template)}
                          className="p-2 hover:bg-blue-50 rounded-lg"
                          title="Ver detalles"
                          disabled={isDeleting || isCloning}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => console.log('Edit template:', template)}
                          className="p-2 hover:bg-purple-50 rounded-lg"
                          title="Editar plantilla"
                          disabled={isDeleting || isCloning}
                        >
                          <Edit className="w-4 h-4 text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleClone(template)}
                          className="p-2 hover:bg-orange-50 rounded-lg"
                          title="Clonar plantilla"
                          disabled={isDeleting || isCloning}
                        >
                          {isCloning ? (
                            <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4 text-orange-600" />
                          )}
                        </button>
                        <button
                          onClick={() => console.log('Generate evaluation:', template)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Generar evaluación"
                          disabled={isDeleting || isCloning}
                        >
                          <Play className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDelete('template', template.id, template.name)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Eliminar plantilla"
                          disabled={isDeleting || isCloning}
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Cargando sistema de evaluaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="max-w-8xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sistema de Evaluaciones</h1>
                <p className="text-gray-600 mt-1">Gestión integral de evaluaciones al personal</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
              title="Períodos"
              value={stats.totalPeriods}
              icon={<Calendar className="w-5 h-5" />}
              color="from-blue-500 to-blue-600"
              subtitle={`${stats.activePeriods} activos`}
            />
            <StatCard
              title="Criterios"
              value={stats.totalCriteria}
              icon={<Target className="w-5 h-5" />}
              color="from-green-500 to-green-600"
              subtitle={`${stats.averageWeight}% promedio`}
            />
            <StatCard
              title="Plantillas"
              value={stats.totalTemplates}
              icon={<FileCheck className="w-5 h-5" />}
              color="from-purple-500 to-purple-600"
              subtitle="Disponibles"
            />
            <StatCard
              title="Evaluaciones"
              value={stats.totalEvaluations}
              icon={<Activity className="w-5 h-5" />}
              color="from-orange-500 to-orange-600"
              subtitle="Creadas"
            />
            <StatCard
              title="Categorías"
              value={categories.length - 1}
              icon={<CheckCircle className="w-5 h-5" />}
              color="from-emerald-500 to-emerald-600"
              subtitle="De criterios"
            />
            <StatCard
              title="Total Items"
              value={stats.totalPeriods + stats.totalCriteria + stats.totalTemplates + stats.totalEvaluations}
              icon={<TrendingUp className="w-5 h-5" />}
              color="from-indigo-500 to-indigo-600"
              subtitle="En sistema"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
                    <p className="text-sm text-gray-600">Períodos, Criterios y Plantillas</p>
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 transition"
                >
                  <Plus className="w-4 h-4" /> Crear
                </button>
              </div>

              <div className="flex bg-gray-50 rounded-xl p-1 mb-4">
                {(['periodos', 'criterios', 'plantillas'] as const).map(tab => {
                  const icon = tab === 'periodos' ? Calendar : tab === 'criterios' ? Target : FileCheck;
                  const colorClass = activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                    : 'text-gray-600 hover:text-gray-900';
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        clearFilters();
                      }}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${colorClass}`}
                    >
                      {React.createElement(icon, { className: 'w-4 h-4 inline mr-2' })}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-h-[400px]">
                {renderTabContent()}
              </div>
            </div>
          </div>

          <div className="col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Evaluaciones</h2>
                  <p className="text-gray-600">Administración de evaluaciones creadas</p>
                </div>
              </div>
              <button
                onClick={() => setShowCrearEvaluacionModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-sm hover:from-orange-600 hover:to-orange-700 transition"
              >
                <Plus className="w-5 h-5" /> Nueva Evaluación
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar evaluaciones..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-4">
              {filteredEvaluations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">{searchTerm ? 'No se encontraron evaluaciones con los filtros aplicados' : 'No hay evaluaciones'}</p>
                  <p className="text-sm text-center max-w-md">
                    Crea tu primera evaluación seleccionando una plantilla y generando evaluaciones para empleados específicos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredEvaluations.map(evaluation => {
                    const isDeleting = deletingItems.has(evaluation.id);
                    return (
                      <div
                        key={evaluation.id}
                        className={`group p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-orange-200 transition ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-gray-900 text-lg">{evaluation.employee_name}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(evaluation.status)}`}>
                            {evaluation.status === 'pending' ? 'Pendiente' :
                             evaluation.status === 'completed' ? 'Completada' :
                             evaluation.status === 'overdue' ? 'Atrasada' : evaluation.status}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Evaluador:</span>
                            <span className="font-medium">{evaluation.evaluator_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Período:</span>
                            <span className="font-medium">{evaluation.period_name}</span>
                          </div>
                          {evaluation.completed_at && (
                            <div className="flex justify-between">
                              <span>Completada:</span>
                              <span className="font-medium">{formatDate(evaluation.completed_at)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>ID:</span>
                            <span className="font-medium text-xs">{evaluation.id}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => console.log('View evaluation:', evaluation)}
                            className="p-2 hover:bg-blue-50 rounded-lg"
                            title="Ver detalles"
                            disabled={isDeleting}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => console.log('Edit evaluation:', evaluation)}
                            className="p-2 hover:bg-orange-50 rounded-lg"
                            title="Editar evaluación"
                            disabled={isDeleting}
                          >
                            <Edit className="w-4 h-4 text-orange-600" />
                          </button>
                          <button
                            onClick={() => console.log('View report:', evaluation)}
                            className="p-2 hover:bg-green-50 rounded-lg"
                            title="Ver reporte"
                            disabled={isDeleting}
                          >
                            <BarChart3 className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDelete('evaluation', evaluation.id, evaluation.employee_name)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Eliminar evaluación"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CrearCriterioModal
        show={showCrearCriterioModal}
        onClose={() => setShowCrearCriterioModal(false)}
        onCreated={handleCriteriaCreated}
      />
      <CrearPeriodoModal
        show={showCrearPeriodoModal}
        onClose={() => setShowCrearPeriodoModal(false)}
        onCreated={handlePeriodCreated}
      />
      <CrearPlantillaModal
        show={showCrearPlantillaModal}
        onClose={() => setShowCrearPlantillaModal(false)}
        onCreated={handleTemplateCreated}
      />
      <CrearEvaluacionModal
        show={showCrearEvaluacionModal}
        onClose={() => setShowCrearEvaluacionModal(false)}
        onCreated={handleEvaluationCreated}
      />
      <EditarPeriodoModal
        show={showEditarPeriodoModal}
        onClose={() => {
          setShowEditarPeriodoModal(false);
          setEditingPeriodId(null);
        }}
        onUpdated={handlePeriodUpdated}
        periodId={editingPeriodId}
        setConfirmationState={setConfirmationState}
      />
      <ConfirmationModal
        show={confirmationState.show}
        onClose={hideConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        type={confirmationState.type}
        loading={confirmationState.loading}
        confirmText={confirmationState.type === 'success' ? 'Entendido' : 'Confirmar'}
      />
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  isPercentage?: boolean;
}> = ({ title, value, icon, color, subtitle, isPercentage }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 bg-gradient-to-r ${color} rounded-lg text-white`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-gray-600 text-xs font-medium">{title}</p>
      <p className="text-xl font-bold text-gray-900">
        {value}{isPercentage ? '%' : ''}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  </div>
);

export default GestionEvaluacionesPage;