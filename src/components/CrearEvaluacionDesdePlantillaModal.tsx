import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Calendar, Loader2, AlertCircle, Save, Search, Filter } from 'lucide-react';
import { getUsers } from '../services/userService';
import { getPeriods, createEvaluationsFromTemplate } from '../services/evaluationService';
import type { User } from '../types/user';
import type { Period, Template, CreateEvaluationsFromTemplateDTO } from '../types/evaluation';
import type { ReferenceData, ConfirmationState } from '../services/referenceService';
import { referenceService } from '../services/referenceService';

interface FilterState {
  department: string;
  position: string;
}

interface CrearEvaluacionDesdePlantillaModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newEvaluations: { evaluatedEmployeeIds: number[]; count: number }) => void;
  template: Template | null;
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationState>>;
}

const CrearEvaluacionDesdePlantillaModal: React.FC<CrearEvaluacionDesdePlantillaModalProps> = ({
  show,
  onClose,
  onCreated,
  template,
  setConfirmationState,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [references, setReferences] = useState<ReferenceData>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [evaluatorId, setEvaluatorId] = useState<number | null>(null);
  const [periodId, setPeriodId] = useState<number | ''>('');
  const [selectedEvaluados, setSelectedEvaluados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTermEvaluator, setSearchTermEvaluator] = useState('');
  const [searchTermEvaluados, setSearchTermEvaluados] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    position: '',
  });

  // Fetch employees, references, and periods
  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [userData, refData, periodsData] = await Promise.all([
        getUsers(),
        referenceService.getFormReferences(),
        getPeriods(),
      ]);
      console.log('Users loaded:', userData);
      console.log('References loaded:', refData);
      console.log('Periods loaded:', periodsData);
      setUsers(userData);
      setReferences(refData);
      setPeriods(periodsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error loading data:', message);
      setError('Error al cargar empleados, referencias o períodos');
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

  // Filter employees for evaluator and evaluados
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

  const filteredEvaluadosUsers = useMemo(() => {
    return users.filter(user => {
      if (user.id === evaluatorId) return false; // Exclude evaluator
      const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(searchTermEvaluados.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTermEvaluados.toLowerCase()) ||
        (user.position || '').toLowerCase().includes(searchTermEvaluados.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchTermEvaluados.toLowerCase());
      const matchesDepartment = !filters.department || user.department === filters.department;
      const matchesPosition = !filters.position || user.position === filters.position;
      return matchesSearch && matchesDepartment && matchesPosition;
    });
  }, [users, searchTermEvaluados, filters, evaluatorId]);

  const activeFiltersCount = Object.values(filters).filter(value => value).length;

  const clearFilters = () => {
    setFilters({
      department: '',
      position: '',
    });
    setSearchTermEvaluator('');
    setSearchTermEvaluados('');
  };

  const handleEvaluatorSelect = (id: number) => {
    setEvaluatorId(id);
    setSelectedEvaluados(prev => prev.filter(empId => empId !== id)); // Remove evaluator from evaluados
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodId(parseInt(e.target.value) || '');
  };

  const toggleEvaluado = (id: number) => {
    setSelectedEvaluados((prev: number[]) => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      }
      return [...prev, id];
    });
  };

  const validateForm = (): string | null => {
    if (!evaluatorId) return 'Seleccione un evaluador';
    if (!periodId) return 'Seleccione un período';
    if (selectedEvaluados.length === 0) return 'Seleccione al menos un evaluado';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      const payload: CreateEvaluationsFromTemplateDTO = {
        template_id: template.id,
        user_ids: selectedEvaluados,
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
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Error creating evaluations:', errorMessage);
      setError(errorMessage);
      setConfirmationState({
        show: true,
        title: 'Error',
        message: `Error al crear evaluaciones: ${errorMessage}`,
        type: 'danger',
        onConfirm: () => setConfirmationState((prev: ConfirmationState) => ({ ...prev, show: false })),
        loading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setEvaluatorId(null);
    setPeriodId('');
    setSelectedEvaluados([]);
    setError(null);
    setSearchTermEvaluator('');
    setSearchTermEvaluados('');
    setFilters({ department: '', position: '' });
    setShowFilters(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Crear Evaluación desde Plantilla</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Evaluator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluador *</label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar evaluador por nombre, email, cargo o departamento..."
                  value={searchTermEvaluator}
                  onChange={(e) => setSearchTermEvaluator(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-xl p-4">
                {filteredEvaluatorUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No se encontraron empleados</p>
                ) : (
                  filteredEvaluatorUsers.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${evaluatorId === user.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                      onClick={() => handleEvaluatorSelect(user.id)}
                    >
                      <input
                        type="radio"
                        name="evaluator"
                        checked={evaluatorId === user.id}
                        onChange={() => handleEvaluatorSelect(user.id)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.position || '—'} | {user.department || '—'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período *</label>
              <select
                value={periodId}
                onChange={handlePeriodChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Seleccione un período</option>
                {periods.map(per => (
                  <option key={per.id} value={per.id}>
                    {per.name} ({formatDate(per.start_date)} - {formatDate(per.end_date)})
                  </option>
                ))}
              </select>
            </div>

            {/* Evaluados Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empleados a Evaluar *</label>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar evaluados por nombre, email, cargo o departamento..."
                    value={searchTermEvaluados}
                    onChange={(e) => setSearchTermEvaluados(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={loading}
                >
                  <Filter className="w-5 h-5" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      >
                        <option value="">Todos los departamentos</option>
                        {references.departments?.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                      <select
                        value={filters.position}
                        onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      >
                        <option value="">Todos los cargos</option>
                        {references.positions?.map(pos => (
                          <option key={pos.id} value={pos.name}>{pos.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-xl p-4">
                {filteredEvaluadosUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No se encontraron empleados</p>
                ) : (
                  filteredEvaluadosUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id={`emp-${user.id}`}
                        checked={selectedEvaluados.includes(user.id)}
                        onChange={() => toggleEvaluado(user.id)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`emp-${user.id}`} className="flex-1 cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.position || '—'} | {user.department || '—'}</p>
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Seleccionados: {selectedEvaluados.length}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading || !template}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Crear Evaluaciones
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CrearEvaluacionDesdePlantillaModal;