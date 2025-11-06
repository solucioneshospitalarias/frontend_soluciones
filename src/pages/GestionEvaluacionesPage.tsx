import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Calendar,
  FileCheck,
  Plus,
  Play,
  Search,
  BarChart3,
  Edit,
  Copy,
  Trash2,
  X,
  CheckCircle,
  TrendingUp,
  Activity,
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
  type Criteria,
  type Period,
  type Template,
  type Evaluation
} from '../services/evaluationService';
import { type TemplateCriteria } from '../types/evaluation';
import CrearCriterioModal from '../components/CrearCriterioModal';
import CrearPeriodoModal from '../components/CrearPeriodoModal';
import CrearPlantillaModal from '../components/CrearPlantillaModal';
import EditarPlantillaModal from '../components/EditarPlantillaModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EditarPeriodoModal from '../components/EditarPeriodoModal';
import EditarCriterioModal from '../components/EditarCriterioModal';
import VerPlantillaModal from '../components/VerPlantillaModal';
import ClonarPlantillaModal from '../components/ClonarPlantillaModal';
import CrearEvaluacionDesdePlantillaModal from '../components/CrearEvaluacionDesdePlantillaModal';
import VerEvaluacionModal from '../components/VerEvaluacionModal';

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

// Interfaces para tipado estricto
interface TemplateCriteriaByCategory {
  productivity?: BackendTemplateCriteria[];
  work_conduct?: BackendTemplateCriteria[];
  skills?: BackendTemplateCriteria[];
  seguridad_trabajo?: BackendTemplateCriteria[];
}

interface BackendTemplateCriteria {
  id: number;
  weight: number;
  category: string;
  criteria: {
    id: number;
    name: string;
    description: string;
  };
}

const GestionEvaluacionesPage: React.FC = () => {
  // ==================== ESTADOS ====================
  const [activeTab, setActiveTab] = useState<'periodos' | 'criterios' | 'plantillas'>('periodos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTermConfig, setSearchTermConfig] = useState('');
  const [searchTermEvaluations, setSearchTermEvaluations] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pending' | 'completed' | 'overdue'>('todos');
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [cloningItems, setCloningItems] = useState<Set<number>>(new Set());
  const [showCrearEvaluacionDesdePlantillaModal, setShowCrearEvaluacionDesdePlantillaModal] = useState(false);
  const [selectedTemplateForEvaluation, setSelectedTemplateForEvaluation] = useState<Template | null>(null);
  const [showVerEvaluacionModal, setShowVerEvaluacionModal] = useState(false);
  const [viewingEvaluationId, setViewingEvaluationId] = useState<number | null>(null);

  // ==================== ESTADOS DE MODALES ====================
  const [showCrearCriterioModal, setShowCrearCriterioModal] = useState(false);
  const [showCrearPeriodoModal, setShowCrearPeriodoModal] = useState(false);
  const [showCrearPlantillaModal, setShowCrearPlantillaModal] = useState(false);
  const [showEditarPlantillaModal, setShowEditarPlantillaModal] = useState(false);
  const [showEditarPeriodoModal, setShowEditarPeriodoModal] = useState(false);
  const [showEditarCriterioModal, setShowEditarCriterioModal] = useState(false);
  const [showVerPlantillaModal, setShowVerPlantillaModal] = useState(false);
  const [showClonarPlantillaModal, setShowClonarPlantillaModal] = useState(false);
  const [cloningTemplate, setCloningTemplate] = useState<Template | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editingCriteriaId, setEditingCriteriaId] = useState<number | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [viewingTemplateId, setViewingTemplateId] = useState<number | null>(null);

  // ==================== ESTADO DE CONFIRMACIÓN ====================
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger',
    loading: false
  });

  // ==================== MAPPING DE ESTADOS API (ESPAÑOL) A FRONTEND (INGLÉS) ====================
  const statusMap = {
    'pendiente': 'pending',
    'realizada': 'completed',
    'atrasada': 'overdue',
    'pending': 'pending',
    'completed': 'completed',
    'overdue': 'overdue',
  } as const;

  const mapApiStatusToFilter = (apiStatus: string): string => {
    return statusMap[apiStatus as keyof typeof statusMap] || 'pending';
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'realizada':
        return 'Realizada';
      case 'atrasada':
        return 'Atrasada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Realizada';
      case 'overdue':
        return 'Atrasada';
      default:
        return status;
    }
  };

  // ==================== FUNCIÓN AUXILIAR PARA CALCULAR PESOS ====================
  const calculateTemplateStats = (template: Template) => {
    let criteriaCount = 0;
    let criteriaWeights = 'N/A';
    
    // 1. Calcular cantidad de criterios
    if ('criteria_count' in template && typeof template.criteria_count === 'number') {
      criteriaCount = template.criteria_count;
    } 
    else if (template.summary?.total_criteria) {
      criteriaCount = template.summary.total_criteria;
    }
    else if (template.criteria && typeof template.criteria === 'object') {
      if (Array.isArray(template.criteria)) {
        criteriaCount = template.criteria.length;
      } else {
        // Es TemplateCriteriaByCategory
        const criteriaObj = template.criteria as TemplateCriteriaByCategory;
        criteriaCount = (criteriaObj.productivity?.length || 0) +
                      (criteriaObj.work_conduct?.length || 0) +
                      (criteriaObj.skills?.length || 0) +
                      (criteriaObj.seguridad_trabajo?.length || 0);
      }
    }
    
    // 2. Calcular pesos correctamente
    if (template.criteria && typeof template.criteria === 'object') {
      try {
        let weights: number[] = [];
        
        if (Array.isArray(template.criteria)) {
          // Si es array, obtener pesos directamente
          weights = template.criteria.map((c: TemplateCriteria) => c.weight || 0);
        } else {
          // Si es por categorías, aplanar y obtener pesos
          const criteriaObj = template.criteria as TemplateCriteriaByCategory;
          
          // Recopilar todos los pesos de todas las categorías
          const allCriteria: BackendTemplateCriteria[] = [
            ...(criteriaObj.productivity || []),
            ...(criteriaObj.work_conduct || []),
            ...(criteriaObj.skills || []),
            ...(criteriaObj.seguridad_trabajo || [])
          ];
          
          weights = allCriteria.map(c => c.weight || 0);
        }
        
        if (weights.length > 0) {
          criteriaWeights = weights
            .map(weight => {
              // El backend envía los pesos como números enteros (50 = 50%)
              // No como decimales (0.5 = 50%)
              return `${Math.round(weight)}%`;
            })
            .join(', ');
        }
      } catch (error) {
        console.error('Error calculating template weights:', error, template);
        criteriaWeights = 'Error';
      }
    }
    
    return { criteriaCount, criteriaWeights };
  };

  // ==================== EFECTOS ====================
  useEffect(() => {
    loadAllData();
  }, []);

  // ==================== FUNCIONES DE CARGA ====================
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
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

  // ==================== HANDLERS DE ACTUALIZACIÓN ====================
  const handlePeriodUpdated = async () => {
    await loadAllData();
    setShowEditarPeriodoModal(false);
    setEditingPeriodId(null);
  };

  const handleCriteriaUpdated = async () => {
    await loadAllData();
    setShowEditarCriterioModal(false);
    setEditingCriteriaId(null);
  };

  const handleTemplateUpdated = (updatedTemplate: Template) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === updatedTemplate.id ? updatedTemplate : template
      )
    );
    setShowEditarPlantillaModal(false);
    setEditingTemplateId(null);
    showConfirmation({
      title: '¡Plantilla Actualizada!',
      message: `La plantilla "${updatedTemplate.name}" se ha actualizado exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  const handleEvaluationFromTemplateCreated = (newEvaluations: { evaluatedEmployeeIds: number[]; count: number }) => {
    loadAllData();
    setShowCrearEvaluacionDesdePlantillaModal(false);
    setSelectedTemplateForEvaluation(null);
    showConfirmation({
      title: '¡Evaluaciones Creadas!',
      message: `Se han creado ${newEvaluations.count} evaluaciones exitosamente.`,
      type: 'success',
      onConfirm: hideConfirmation
    });
  };

  // ==================== CÁLCULOS Y MEMO ====================
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
      p.name.toLowerCase().includes(searchTermConfig.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchTermConfig.toLowerCase())
    ), [periods, searchTermConfig]
  );

  const filteredCriteria = useMemo(() =>
    criteria
      .filter(c => c.is_active) // Solo criterios activos
      .filter(c =>
        (c.name.toLowerCase().includes(searchTermConfig.toLowerCase()) ||
         c.description.toLowerCase().includes(searchTermConfig.toLowerCase())) &&
        (selectedCategory === 'todos' || c.category === selectedCategory)
      ), [criteria, searchTermConfig, selectedCategory]
  );

  const filteredTemplates = useMemo(() =>
    templates.filter(t =>
      t.name.toLowerCase().includes(searchTermConfig.toLowerCase()) ||
      (t.description?.toLowerCase() || '').includes(searchTermConfig.toLowerCase())
    ), [templates, searchTermConfig]
  );

  // ==================== FILTRO DE EVALUACIONES CON MAPPING DE ESTADOS ====================
  const filteredEvaluations = useMemo(() => {
    const result = evaluations.filter(e => {
      const matchesSearch =
        e.employee_name.toLowerCase().includes(searchTermEvaluations.toLowerCase()) ||
        e.evaluator_name.toLowerCase().includes(searchTermEvaluations.toLowerCase()) ||
        e.period_name.toLowerCase().includes(searchTermEvaluations.toLowerCase());
      
      const normalizedStatus = mapApiStatusToFilter(e.status);
      const matchesState = filtroEstado === 'todos' || normalizedStatus === filtroEstado;
      
      return matchesSearch && matchesState;
    });
    return result;
  }, [evaluations, searchTermEvaluations, filtroEstado]);

  // ==================== FUNCIONES AUXILIARES ====================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pendiente':
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'atrasada':
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  // ==================== FUNCIONES DE CONFIRMACIÓN ====================
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

  // ==================== FUNCIONES DE ELIMINACIÓN ====================
  const handleDelete = async (type: string, id: number, itemName?: string) => {
    const typeNames = {
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
          switch (type) {
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

  // ==================== FUNCIÓN DE CLONADO ====================
  const handleClone = (template: Template) => {
    setCloningTemplate(template);
    setShowClonarPlantillaModal(true);
  };

  const handleCloned = (clonedTemplate: Template) => {
    setCloningItems(prev => new Set(prev).add(clonedTemplate.id));
    setTemplates(prev => [clonedTemplate, ...prev]);
    setCloningItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(clonedTemplate.id);
      return newSet;
    });
    setShowClonarPlantillaModal(false);
    setCloningTemplate(null);
  };

  // ==================== FUNCIONES DE CREACIÓN ====================
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

  // ==================== HANDLERS DE CREACIÓN ====================
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
    setTemplates(prev => {
      const updatedTemplates = [newTemplate, ...prev];
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

  // ==================== COMPONENTE STAT CARD ====================
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

  // ==================== FUNCIÓN PARA RENDERIZAR CONTENIDO DE TABS ====================
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={searchTermConfig}
                  onChange={e => setSearchTermConfig(e.target.value)}
                />
              </div>
              {searchTermConfig && (
                <button
                  onClick={() => setSearchTermConfig('')}
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
                  <p>{searchTermConfig ? 'No se encontraron períodos con los filtros aplicados' : 'No hay períodos configurados'}</p>
                </div>
              ) : (
                filteredPeriods.map(period => {
                  const isDeleting = deletingItems.has(period.id);
                  return (
                    <div
                      key={period.id}
                      className={`group p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-green-200 transition mb-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{period.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${period.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          {period.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </div>
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
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Editar período"
                          disabled={isDeleting}
                        >
                          <Edit className="w-4 h-4 text-green-700" />
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={searchTermConfig}
                  onChange={e => setSearchTermConfig(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'todos' ? 'Todas las categorías' : formatCategory(c)}
                  </option>
                ))}
              </select>
              {(searchTermConfig || selectedCategory !== 'todos') && (
                <button
                  onClick={() => { setSearchTermConfig(''); setSelectedCategory('todos'); }}
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
                  <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
                        <h4 className="font-semibold text-gray-900">{criterio.name}</h4>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <span className="inline-block bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-gray-800">{formatCategory(criterio.category)}</span>
                        <p className="text-gray-700 leading-relaxed">{criterio.description}</p>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCriteriaId(criterio.id);
                            setShowEditarCriterioModal(true);
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Editar criterio"
                          disabled={isDeleting}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDelete('criteria', criterio.id, criterio.name)}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={searchTermConfig}
                  onChange={e => setSearchTermConfig(e.target.value)}
                />
              </div>
              {searchTermConfig && (
                <button
                  onClick={() => setSearchTermConfig('')}
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
                  <p>{searchTermConfig ? 'No se encontraron plantillas con los filtros aplicados' : 'No hay plantillas configurados'}</p>
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const isDeleting = deletingItems.has(template.id);
                  const isCloning = cloningItems.has(template.id);
                  
                  // ✅ USAR LA FUNCIÓN AUXILIAR PARA CALCULAR STATS
                  const { criteriaCount, criteriaWeights } = calculateTemplateStats(template);

                  return (
                    <div
                      key={template.id}
                      className={`group p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-green-200 transition mb-3 ${isDeleting || isCloning ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${template.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          {template.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="text-gray-600">{template.description}</p>
                        <div className="flex justify-between">
                          <span>Criterios: {criteriaCount}</span>
                          <span className="text-xs">Pesos: {criteriaWeights}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setViewingTemplateId(template.id);
                            setShowVerPlantillaModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg"
                          title="Ver detalles"
                          disabled={isDeleting || isCloning}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setShowEditarPlantillaModal(true);
                          }}
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
                          onClick={() => {
                            setSelectedTemplateForEvaluation(template);
                            setShowCrearEvaluacionDesdePlantillaModal(true);
                          }}
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

  // ==================== ESTADOS DE CARGA Y ERROR ====================
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

  // ==================== COMPONENTE PRINCIPAL ====================
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg">
                <BarChart3 className="w-4 h-4 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sistema de Evaluaciones</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Gestión integral de evaluaciones al personal</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
              icon={<FileCheck className="w-5 h-5" />}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6 max-[1024px]:grid-cols-1">
          {/* Left Column: Configuration */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600 rounded-xl shadow-sm">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
                    <p className="text-sm text-gray-600">Períodos, Criterios y Plantillas</p>
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition"
                >
                  <Plus className="w-4 h-4" /> Crear
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row bg-gray-50 rounded-xl p-1 mb-4 gap-2 sm:gap-0">
                {(['periodos', 'criterios', 'plantillas'] as const).map(tab => {
                  const icon = tab === 'periodos' ? Calendar : tab === 'criterios' ? FileCheck : FileCheck;
                  const colorClass = activeTab === tab
                    ? 'bg-white text-green-700 shadow-sm border border-green-100'
                    : 'text-gray-600 hover:text-gray-900';
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSearchTermConfig('');
                        setSelectedCategory('todos');
                      }}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${colorClass}`}
                    >
                      {React.createElement(icon, { className: 'w-4 h-4 inline mr-2' })}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-[400px]">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Right Column: Evaluations */}
          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600 rounded-xl shadow-sm">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Evaluaciones</h2>
                  <p className="text-gray-600">Lista de evaluaciones</p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar evaluaciones..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={searchTermEvaluations}
                  onChange={e => setSearchTermEvaluations(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as 'todos' | 'pending' | 'completed' | 'overdue')}
              >
                <option value="todos">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="completed">Realizada</option>
                <option value="overdue">Atrasada</option>
              </select>
              {(searchTermEvaluations || filtroEstado !== 'todos') && (
                <button
                  onClick={() => { setSearchTermEvaluations(''); setFiltroEstado('todos'); }}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Evaluations List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredEvaluations.map(evaluation => {
                const isDeleting = deletingItems.has(evaluation.id);
                return (
                  <div
                    key={evaluation.id}
                    className={`group p-6 md:p-7 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <h3 className="font-semibold text-gray-900 text-lg">{evaluation.employee_name}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(evaluation.status)}`}>
                        {getStatusDisplay(evaluation.status)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-5 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Evaluador:</span>
                        <span className="font-medium text-gray-800">{evaluation.evaluator_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Período:</span>
                        <span className="font-medium text-gray-800">{evaluation.period_name}</span>
                      </div>
                      {evaluation.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Completada:</span>
                          <span className="font-medium text-gray-800">{formatDate(evaluation.completed_at)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setViewingEvaluationId(evaluation.id);
                          setShowVerEvaluacionModal(true);
                        }}
                        className="p-2.5 hover:bg-blue-50 rounded-lg"
                        title="Ver evaluación"
                        disabled={isDeleting}
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete('evaluation', evaluation.id, evaluation.employee_name)}
                        className="p-2.5 hover:bg-red-50 rounded-lg"
                        title="Eliminar evaluación"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}
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
      <EditarPlantillaModal
        show={showEditarPlantillaModal}
        onClose={() => {
          setShowEditarPlantillaModal(false);
          setEditingTemplateId(null);
        }}
        onUpdated={handleTemplateUpdated}
        templateId={editingTemplateId}
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
      <EditarCriterioModal
        show={showEditarCriterioModal}
        onClose={() => {
          setShowEditarCriterioModal(false);
          setEditingCriteriaId(null);
        }}
        onUpdated={handleCriteriaUpdated}
        criteriaId={editingCriteriaId}
        setConfirmationState={setConfirmationState}
      />
      <VerPlantillaModal
        show={showVerPlantillaModal}
        onClose={() => {
          setShowVerPlantillaModal(false);
          setViewingTemplateId(null);
        }}
        templateId={viewingTemplateId}
      />
      <ClonarPlantillaModal
        show={showClonarPlantillaModal}
        onClose={() => {
          setShowClonarPlantillaModal(false);
          setCloningTemplate(null);
        }}
        onCloned={handleCloned}
        template={cloningTemplate}
        setConfirmationState={setConfirmationState}
      />
      <CrearEvaluacionDesdePlantillaModal
        show={showCrearEvaluacionDesdePlantillaModal}
        onClose={() => {
          setShowCrearEvaluacionDesdePlantillaModal(false);
          setSelectedTemplateForEvaluation(null);
        }}
        onCreated={handleEvaluationFromTemplateCreated}
        template={selectedTemplateForEvaluation}
        setConfirmationState={setConfirmationState}
      />
      <VerEvaluacionModal
        show={showVerEvaluacionModal}
        onClose={() => {
          setShowVerEvaluacionModal(false);
          setViewingEvaluationId(null);
        }}
        evaluationId={viewingEvaluationId}
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

export default GestionEvaluacionesPage;