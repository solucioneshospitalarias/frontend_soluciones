import React, { useState, useEffect } from 'react';
import { getTemplateById } from '../services/evaluationService';
import { FileCheck, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface VerPlantillaModalProps {
  show: boolean;
  onClose: () => void;
  templateId: number | null;
}

interface BackendTemplateCriteria {
  id: number;
  weight: number;
  category: string;
  criteria: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
}

interface BackendTemplate {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  criteria: {
    productivity: BackendTemplateCriteria[];
    work_conduct: BackendTemplateCriteria[];
    skills: BackendTemplateCriteria[];
  };
  summary: {
    total_criteria: number;
    categories_used: number;
    weights_summary: {
      productivity: number;
      work_conduct: number;
      skills: number;
    };
    is_valid_weights: boolean;
  };
  created_at: string;
  updated_at: string;
}

const VerPlantillaModal: React.FC<VerPlantillaModalProps> = ({ 
  show, 
  onClose, 
  templateId 
}) => {
  const [template, setTemplate] = useState<BackendTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && templateId) {
      loadTemplateData();
    }
  }, [show, templateId]);

  const loadTemplateData = async () => {
    if (!templateId) return;
    
    setLoading(true);
    setError(null);
    try {
      const templateData = await getTemplateById(templateId);
      setTemplate(templateData as unknown as BackendTemplate);
    } catch (err) {
      console.error('Error cargando plantilla:', err);
      setError('Error al cargar los datos de la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTemplate(null);
    setError(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = () => {
    if (!template) return { color: 'gray', text: 'Desconocido', icon: AlertCircle };

    if (template.is_active) {
      return { color: 'green', text: 'Activa', icon: CheckCircle };
    } else {
      return { color: 'gray', text: 'Inactiva', icon: AlertCircle };
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'productivity': 'Productividad',
      'work_conduct': 'Conducta Laboral',
      'skills': 'Habilidades'
    };
    return categoryMap[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'productivity': 'bg-blue-100 text-blue-800',
      'work_conduct': 'bg-green-100 text-green-800',
      'skills': 'bg-purple-100 text-purple-800'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  if (!show) return null;

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-purple-500" />
            Detalles de la Plantilla
            {template && <span className="text-lg text-gray-500">#{template.id}</span>}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-600">Cargando plantilla...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : template ? (
            <div className="space-y-6">
              {/* Información General */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Información General
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Plantilla
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 font-medium">{template.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 text-${statusInfo.color}-500`} />
                        <span className={`text-${statusInfo.color}-700 font-medium`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900">{template.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Criterios por Categoría */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Criterios ({template.summary.total_criteria})
                </h4>
                
                <div className="space-y-6">
                  {/* Productividad */}
                  {template.criteria.productivity.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800">
                            {getCategoryDisplayName('productivity')}
                          </h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor('productivity')}`}>
                            {template.criteria.productivity.length} criterio{template.criteria.productivity.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          {template.summary.weights_summary.productivity}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {template.criteria.productivity.map((criterion) => (
                          <div key={criterion.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium">
                                  {criterion.criteria.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {criterion.criteria.description}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg ml-4">
                                {criterion.weight}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conducta Laboral */}
                  {template.criteria.work_conduct.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800">
                            {getCategoryDisplayName('work_conduct')}
                          </h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor('work_conduct')}`}>
                            {template.criteria.work_conduct.length} criterio{template.criteria.work_conduct.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          {template.summary.weights_summary.work_conduct}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {template.criteria.work_conduct.map((criterion) => (
                          <div key={criterion.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium">
                                  {criterion.criteria.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {criterion.criteria.description}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg ml-4">
                                {criterion.weight}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habilidades */}
                  {template.criteria.skills.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800">
                            {getCategoryDisplayName('skills')}
                          </h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor('skills')}`}>
                            {template.criteria.skills.length} criterio{template.criteria.skills.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                          {template.summary.weights_summary.skills}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {template.criteria.skills.map((criterion) => (
                          <div key={criterion.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium">
                                  {criterion.criteria.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {criterion.criteria.description}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg ml-4">
                                {criterion.weight}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumen general */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-900">{template.summary.total_criteria}</p>
                        <p className="text-xs text-purple-700">Total Criterios</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-900">{template.summary.categories_used}</p>
                        <p className="text-xs text-purple-700">Categorías</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-900">
                          {template.summary.weights_summary.productivity + template.summary.weights_summary.work_conduct + template.summary.weights_summary.skills}%
                        </p>
                        <p className="text-xs text-purple-700">Peso Total</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${template.summary.is_valid_weights ? 'text-green-900' : 'text-red-900'}`}>
                          {template.summary.is_valid_weights ? '✓' : '✗'}
                        </p>
                        <p className="text-xs text-purple-700">Pesos Válidos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Información del Sistema
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Creación
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        {formatDate(template.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Última Actualización
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        {formatDate(template.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VerPlantillaModal;