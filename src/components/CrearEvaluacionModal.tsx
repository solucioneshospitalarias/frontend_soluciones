import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Calendar, Loader2, AlertCircle, Save, Search, Filter, FileCheck, User, UserCheck, CheckCircle, Clock } from 'lucide-react';
import { getUsers } from '../services/userService';
import servicioEvaluaciones, { getTemplates, createEvaluationsFromTemplate } from '../services/evaluationService'; // Updated import
import type { User as UserType } from '../types/user';
import type { Period, Template, CreateEvaluationsFromTemplateDTO } from '../types/evaluation';
import { referenceService } from '../services/referenceService';
import type { ReferenceData } from '../services/referenceService';

interface FilterState {
  department: string;
  position: string;
}

interface CrearEvaluacionModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newEvaluations: { evaluatedEmployeeIds: number[]; count: number }) => void;
}

const CrearEvaluacionModal: React.FC<CrearEvaluacionModalProps> = ({
  show,
  onClose,
  onCreated,
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

  const getPeriodStatus = (period: Period) => {
    const now = new Date();
    const startDate = new Date(period.start_date);
    const dueDate = new Date(period.due_date);

    if (now >= startDate && now <= dueDate) {
      return {
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
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
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'No disponible',
        description: 'Período no disponible',
      };
    }
  };

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-lg border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Crear Nueva Evaluación</h2>
              {selectedTemplate && (
                <p className="text-sm text-slate-600">Plantilla: <span className="font-medium">{selectedTemplate.name}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-96px)]">
          {loadingData ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Cargando datos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-12 gap-4">
                {/* Left Column - Period & Template */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  {/* Period Selection */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1.5 text-blue-600" />
                      Período de Evaluación *
                    </label>
                    <select
                      value={periodId}
                      onChange={handlePeriodChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-slate-600">Estados de períodos:</p>
                        {periods.slice(0, 3).map(period => {
                          const status = getPeriodStatus(period);
                          const StatusIcon = status.icon;
                          return (
                            <div key={period.id} className={`flex items-center gap-2 p-2 rounded-lg ${status.bg} ${status.border} border text-xs`}>
                              <StatusIcon className={`w-3 h-3 ${status.color}`} />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-slate-900 truncate">{period.name}</span>
                                <span className={`ml-2 ${status.color}`}>({status.label})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Template Selection */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <FileCheck className="w-4 h-4 inline mr-1.5 text-blue-600" />
                      Plantilla de Evaluación *
                    </label>
                    <select
                      value={templateId}
                      onChange={handleTemplateChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700">Descripción</p>
                        <p className="text-sm text-slate-600">{selectedTemplate.description || 'Sin descripción'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column - Evaluator */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  {/* Filters */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900 text-sm">
                        <Filter className="w-4 h-4 inline mr-1.5 text-blue-600" />
                        Filtros
                      </h3>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          Limpiar ({activeFiltersCount})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <select
                          value={filters.department}
                          onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-slate-900 text-sm">Evaluador *</h3>
                    </div>

                    {selectedEvaluator && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900 text-sm">
                            {selectedEvaluator.name || `${selectedEvaluator.first_name || ''} ${selectedEvaluator.last_name || ''}`.trim()}
                          </p>
                          <p className="text-xs text-blue-600">{selectedEvaluator.position || '—'} | {selectedEvaluator.department || '—'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvaluatorId(null)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar evaluador..."
                        value={searchTermEvaluator}
                        onChange={(e) => setSearchTermEvaluator(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={loading}
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredEvaluatorUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-6 text-sm">No se encontraron evaluadores</p>
                      ) : (
                        filteredEvaluatorUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                              evaluatorId === user.id 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'hover:bg-slate-50 border-transparent'
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
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
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
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900 text-sm">Empleados a Evaluar *</h3>
                      </div>
                      {selectedEmployees.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {selectedEmployees.length} seleccionados
                        </span>
                      )}
                    </div>

                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar empleados..."
                        value={searchTermEmployees}
                        onChange={(e) => setSearchTermEmployees(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                        disabled={loading}
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredEmployeeUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-6 text-sm">
                          {evaluatorId 
                            ? 'No se encontraron empleados para evaluar' 
                            : 'Primero seleccione un evaluador'
                          }
                        </p>
                      ) : (
                        filteredEmployeeUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                              selectedEmployees.includes(user.id)
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'hover:bg-slate-50 border-transparent'
                            }`}
                            onClick={() => toggleEmployee(user.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(user.id)}
                              onChange={() => toggleEmployee(user.id)}
                              disabled={loading}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
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
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 mt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg text-sm hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
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