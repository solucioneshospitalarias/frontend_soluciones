// src/components/CrearEvaluacionModal.tsx
// ✅ Modal corregido con tipos actualizados

import React, { useState, useEffect } from 'react';
import { Activity, X, Loader2, Plus, Calendar, FileCheck, Users, Search, Check } from 'lucide-react';
import { getPeriods, getTemplates, getCriteria, getEmployees, createEvaluationsFromTemplate } from '../services/evaluationService';
import type { Evaluation, Period, Template, Criteria, Employee, CreateEvaluationsFromTemplateDTO } from '../services/evaluationService';

interface CrearEvaluacionModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: (newEvaluation: Evaluation) => void;
}

interface EvaluacionForm {
  title: string;
  description: string;
  periodId: string;
  templateId: string;
  evaluatorId: string;
  selectedEmployees: string[];
}

const CrearEvaluacionModal: React.FC<CrearEvaluacionModalProps> = ({ show, onClose, onCreated }) => {
  const [form, setForm] = useState<EvaluacionForm>({
    title: '',
    description: '',
    periodId: '',
    templateId: '',
    evaluatorId: '1',
    selectedEmployees: [],
  });

  const [periods, setPeriods] = useState<Period[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (show) {
      loadRequiredData();
    }
  }, [show]);

  const loadRequiredData = async () => {
    setLoadingData(true);
    try {
      const [periodsData, templatesData, criteriaData, employeesData] = await Promise.all([
        getPeriods().catch(() => []),
        getTemplates().catch(() => []),
        getCriteria().catch(() => []),
        getEmployees().catch(() => [])
      ]);

      setPeriods(Array.isArray(periodsData) ? periodsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setCriteria(Array.isArray(criteriaData) ? criteriaData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (error) setError(null);
  };

  // ✅ Corregir el toggleEmployee para usar tipos number
  const toggleEmployee = (employeeId: number) => {
    const employeeIdStr = employeeId.toString();
    setForm(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeIdStr)
        ? prev.selectedEmployees.filter(id => id !== employeeIdStr)
        : [...prev.selectedEmployees, employeeIdStr]
    }));
  };

  const selectAllEmployees = () => {
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id.toString());
    setForm(prev => ({
      ...prev,
      selectedEmployees: filteredEmployeeIds
    }));
  };

  const clearSelection = () => {
    setForm(prev => ({
      ...prev,
      selectedEmployees: []
    }));
  };

  // ✅ Corregir filteredEmployees para usar nombres correctos
  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.position.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const selectedPeriod = periods.find(p => p.id.toString() === form.periodId);
  const selectedTemplate = templates.find(t => t.id.toString() === form.templateId);

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'El título de la evaluación es obligatorio.';
    if (!form.periodId) return 'Debe seleccionar un período.';
    if (!form.templateId) return 'Debe seleccionar una plantilla.';
    if (form.selectedEmployees.length === 0) return 'Debe seleccionar al menos un empleado.';
    
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
      const evaluationsData: CreateEvaluationsFromTemplateDTO = {
        template_id: parseInt(form.templateId),
        period_id: parseInt(form.periodId),
        evaluator_id: parseInt(form.evaluatorId),
        employee_ids: form.selectedEmployees.map(id => parseInt(id))
      };

      const result = await createEvaluationsFromTemplate(evaluationsData);

      console.log('Created evaluations:', result);

      setShowSuccess(true);
      
      setTimeout(() => {
        // ✅ Crear un objeto Evaluation con tipos correctos
        const mockEvaluation: Evaluation = {
          id: Date.now(),
          employee_name: `${result.count} empleados`,
          evaluator_name: 'Evaluador actual',
          period_name: selectedPeriod?.name || '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        onCreated(mockEvaluation);
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error creating evaluations:', err);
      setError(err.message || 'Error al crear las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setForm({
      title: '',
      description: '',
      periodId: '',
      templateId: '',
      evaluatorId: '1',
      selectedEmployees: [],
    });
    setEmployeeSearch('');
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Success State */}
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Evaluaciones Creadas!</h3>
            <p className="text-gray-600">
              Se han creado {form.selectedEmployees.length} evaluaciones exitosamente.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-orange-500" />
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

            {loadingData ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Cargando datos necesarios...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Evaluación *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      type="text"
                      placeholder="Ej: Evaluación de Desempeño Q1 2025"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                      placeholder="Descripción de la evaluación..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Selección de período y plantilla */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Período de Evaluación *
                    </label>
                    <select
                      name="periodId"
                      value={form.periodId}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      disabled={loading}
                    >
                      <option value="">Seleccionar período</option>
                      {periods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.name}
                        </option>
                      ))}
                    </select>
                    {selectedPeriod && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedPeriod.start_date).toLocaleDateString('es-ES')} - {new Date(selectedPeriod.end_date).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileCheck className="w-4 h-4 inline mr-1" />
                      Plantilla de Evaluación *
                    </label>
                    <select
                      name="templateId"
                      value={form.templateId}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      disabled={loading}
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {/* ✅ Corregir acceso a criteria */}
                        {selectedTemplate.criteria?.length || 0} criterios configurados
                      </p>
                    )}
                  </div>
                </div>

                {/* Selección de empleados */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      Seleccionar Empleados
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllEmployees}
                        className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 transition-colors"
                        disabled={loading || filteredEmployees.length === 0}
                      >
                        Seleccionar todos ({filteredEmployees.length})
                      </button>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                        disabled={loading || form.selectedEmployees.length === 0}
                      >
                        Limpiar selección
                      </button>
                    </div>
                  </div>

                  {/* Búsqueda de empleados */}
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar empleados por nombre, email o departamento..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={employeeSearch}
                      onChange={e => setEmployeeSearch(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Lista de empleados */}
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-gray-500 text-sm p-4">No se encontraron empleados</p>
                    ) : (
                      <div className="p-2">
                        {filteredEmployees.map(employee => (
                          <div
                            key={employee.id}
                            className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
                              form.selectedEmployees.includes(employee.id.toString())
                                ? 'bg-orange-50 border border-orange-200'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => toggleEmployee(employee.id)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                              form.selectedEmployees.includes(employee.id.toString())
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-300'
                            }`}>
                              {form.selectedEmployees.includes(employee.id.toString()) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              {/* ✅ Usar nombres correctos de propiedades */}
                              <p className="font-medium text-sm">{employee.first_name} {employee.last_name}</p>
                              <p className="text-xs text-gray-500">{employee.position}</p>
                              <p className="text-xs text-gray-400">{employee.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.selectedEmployees.length > 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      {form.selectedEmployees.length} empleado(s) seleccionado(s)
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Preview */}
                {form.title && form.periodId && form.templateId && form.selectedEmployees.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">Vista previa:</h4>
                    <div>
                      <p className="font-medium text-orange-900">{form.title}</p>
                      {form.description && (
                        <p className="text-sm text-orange-700 mb-2">{form.description}</p>
                      )}
                      <div className="text-sm text-orange-700 space-y-1">
                        <p>Período: {selectedPeriod?.name}</p>
                        <p>Plantilla: {selectedTemplate?.name}</p>
                        <p>Empleados: {form.selectedEmployees.length} seleccionados</p>
                        <p className="text-xs">Se crearán {form.selectedEmployees.length} evaluaciones individuales</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || form.selectedEmployees.length === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando {form.selectedEmployees.length} evaluaciones...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Crear {form.selectedEmployees.length} Evaluaciones
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CrearEvaluacionModal;