import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Calendar, Loader2, AlertCircle, Save, Search, Filter, FileCheck, User, UserCheck, CheckCircle, Clock } from 'lucide-react';
import { getUsers } from '../services/userService';
import servicioEvaluaciones, { getTemplates, createEvaluationsFromTemplate } from '../services/evaluationService'; // Updated import
import type { User as UserType } from '../types/user';
import type { Period, Template, CreateEvaluationsFromTemplateDTO } from '../types/evaluation';
import type { ReferenceData, ConfirmationState } from '../services/referenceService';
import { referenceService } from '../services/referenceService';

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
  const [users, setUsers] = useState<UserType[]>([]);
  const [references, setReferences] = useState<ReferenceData>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [evaluatorId, setEvaluatorId] = useState<number | null>(null);
  const [periodId, setPeriodId] = useState<number | ''>('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTermEvaluator, setSearchTermEvaluator] = useState('');
  const [searchTermEmployees, setSearchTermEmployees] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    position: '',
  });

  // Fetch users, references, periods, and templates
  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [userData, refData, periodsData, templatesData] = await Promise.all([
        getUsers(),
        referenceService.getFormReferences(),
        servicioEvaluaciones.getPeriods(), // Updated to use servicioEvaluaciones.getPeriods()
        getTemplates(),
      ]);
      console.log('Users loaded:', userData);
      console.log('References loaded:', refData);
      console.log('Periods loaded:', periodsData);
      console.log('Templates loaded:', templatesData);
      setUsers(userData);
      setReferences(refData);
      setPeriods(periodsData);
      setTemplates(templatesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error loading data:', message);
      setError('Error al cargar empleados, referencias, períodos o plantillas');
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

  // Get period status with visual feedback
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

  // Filter employees for evaluator
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

  // Filter employees for evaluation (excluding evaluator)
  const filteredEmployeeUsers = useMemo(() => {
    return users.filter(user => {
      if (user.id === evaluatorId) return false;
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
  }, [users, searchTermEmployees, filters, evaluatorId]);

  const activeFiltersCount = Object.values(filters).filter(value => value).length;

  const clearFilters = () => {
    setFilters({
      department: '',
      position: '',
    });
  };

  const handleEvaluatorSelect = (id: number) => {
    setEvaluatorId(id);
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodId(parseInt(e.target.value) || '');
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTemplateId(parseInt(e.target.value) || '');
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployees((prev: number[]) => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      }
      return [...prev, id];
    });
  };

  const validateForm = (): string | null => {
    if (!evaluatorId) return 'Seleccione un evaluador';
    if (!periodId) return 'Seleccione un período';
    if (!templateId) return 'Seleccione una plantilla';
    if (selectedEmployees.length === 0) return 'Seleccione al menos un empleado a evaluar';
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
      const payload: CreateEvaluationsFromTemplateDTO = {
        template_id: templateId as number,
        period_id: periodId as number,
        evaluator_id: evaluatorId!,
        employee_ids: selectedEmployees,
      };

      console.log('🔄 Creating evaluations from template:', payload);
      const data = await createEvaluationsFromTemplate(payload);
      console.log('✅ Evaluations created:', data);

      onCreated(data);
      setConfirmationState({
        show: true,
        title: '¡Evaluaciones Creadas!',
        message: `Se han creado ${data.count} evaluaciones exitosamente.`,
        type: 'success',
        onConfirm: () => setConfirmationState((prev: ConfirmationState) => ({ ...prev, show: false })),
        loading: false,
      });
      handleClose();
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
    setEvaluatorId(null);
    setPeriodId('');
    setTemplateId('');
    setSelectedEmployees([]);
    setError(null);
    setSearchTermEvaluator('');
    setSearchTermEmployees('');
    setFilters({ department: '', position: '' });
    onClose();
  };

  const selectedEvaluator = users.find(u => u.id === evaluatorId);
  const selectedTemplate = templates.find(t => t.id === templateId);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Crear Nueva Evaluación</h2>
              {selectedTemplate && (
                <p className="text-sm text-gray-600">Plantilla: <span className="font-medium">{selectedTemplate.name}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {loadingData ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Period & Template */}
                <div className="col-span-12 md:col-span-4 space-y-6">
                  {/* Period Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Período de Evaluación *
                    </label>
                    <select
                      value={periodId}
                      onChange={handlePeriodChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    {/* Period status indicators */}
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

                  {/* Template Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <FileCheck className="w-4 h-4 inline mr-2" />
                      Plantilla de Evaluación *
                    </label>
                    <select
                      value={templateId}
                      onChange={handleTemplateChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="">Seleccione una plantilla</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700">Descripción</p>
                        <p className="text-sm text-gray-600">{selectedTemplate.description || 'Sin descripción'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column - Evaluator */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  {/* Filters */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 text-base">
                        <Filter className="w-4 h-4 inline mr-2 text-blue-600" />
                        Filtros
                      </h3>
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
                      <div>
                        <select
                          value={filters.department}
                          onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={loading}
                        >
                          <option value="">Todos los departamentos</option>
                          {references.departments?.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={filters.position}
                          onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={loading}
                        >
                          <option value="">Todos los cargos</option>
                          {references.positions?.map(pos => (
                            <option key={pos.id} value={pos.name}>{pos.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Evaluator Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 text-base">Evaluador *</h3>
                    </div>

                    {selectedEvaluator && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900 text-base">
                            {selectedEvaluator.name || `${selectedEvaluator.first_name || ''} ${selectedEvaluator.last_name || ''}`.trim()}
                          </p>
                          <p className="text-sm text-blue-600">{selectedEvaluator.position || '—'} | {selectedEvaluator.department || '—'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvaluatorId(null)}
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={loading}
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredEvaluatorUsers.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 text-sm">No se encontraron evaluadores</p>
                      ) : (
                        filteredEvaluatorUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                              evaluatorId === user.id 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'hover:bg-gray-50 border-transparent'
                            }`}
                            onClick={() => handleEvaluatorSelect(user.id)}
                          >
                            <input
                              type="radio"
                              name="evaluator"
                              checked={evaluatorId === user.id}
                              onChange={() => handleEvaluatorSelect(user.id)}
                              disabled={loading}
                              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.position || '—'} | {user.department || '—'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Employees */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  {/* Employee Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900 text-base">Empleados a Evaluar *</h3>
                      </div>
                      {selectedEmployees.length > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {selectedEmployees.length} seleccionados
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                        disabled={loading}
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredEmployeeUsers.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 text-sm">
                          {evaluatorId 
                            ? 'No se encontraron empleados para evaluar' 
                            : 'Primero seleccione un evaluador'
                          }
                        </p>
                      ) : (
                        filteredEmployeeUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                              selectedEmployees.includes(user.id)
                                ? 'bg-green-50 border-green-200'
                                : 'hover:bg-gray-50 border-transparent'
                            }`}
                            onClick={() => toggleEmployee(user.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(user.id)}
                              onChange={() => toggleEmployee(user.id)}
                              disabled={loading}
                              className="w-4 h-4 text-green-500 focus:ring-green-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.position || '—'} | {user.department || '—'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 text-base"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Crear {selectedEmployees.length} Evaluacion{selectedEmployees.length !== 1 ? 'es' : ''}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearEvaluacionModal;