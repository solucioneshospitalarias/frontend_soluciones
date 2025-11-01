import React, { useState, useEffect } from 'react';
import { getTemplateById } from '../services/evaluationService';
import { FileCheck, X, Loader2, AlertCircle } from 'lucide-react';

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
    productivity?: BackendTemplateCriteria[] | null;
    work_conduct?: BackendTemplateCriteria[] | null;
    skills?: BackendTemplateCriteria[] | null;
    seguridad_trabajo?: BackendTemplateCriteria[] | null;
  };
  summary: {
    total_criteria: number;
    categories_used: number;
    weights_summary: {
      productivity: number;
      work_conduct: number;
      skills: number;
      seguridad_trabajo: number;
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

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'productivity': 'Productividad',
      'work_conduct': 'Conducta Laboral',
      'skills': 'Habilidades',
      'seguridad_trabajo': 'Seguridad y salud en el Trabajo',
    };
    return categoryMap[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'productivity': 'bg-blue-50 text-blue-800',
      'work_conduct': 'bg-green-50 text-green-800',
      'skills': 'bg-purple-50 text-purple-800',
      'seguridad_trabajo': 'bg-yellow-50 text-yellow-800',
    };
    return colorMap[category] || 'bg-gray-50 text-gray-800';
  };

  const getValidationStatus = () => {
    if (!template?.summary.is_valid_weights) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-600 text-sm">Los pesos no son válidos. Por favor, verifique la configuración.</p>
        </div>
      );
    }
    return null;
  };

  // Helper para obtener longitud segura de una categoría
  const getCategoryLength = (category: BackendTemplateCriteria[] | null | undefined): number => {
    return category?.length ?? 0;
  };

  // Helper para mapear una categoría de forma segura
  const mapCategory = (category: BackendTemplateCriteria[] | null | undefined, categoryKey: keyof BackendTemplate['criteria']): React.ReactNode => {
    const items = category ?? [];
    return items.map((criterion) => (
      <div key={criterion.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="space-y-2">
          <p className="text-gray-900 font-medium">{criterion.criteria.name}</p>
          <p className="text-sm text-gray-600">{criterion.criteria.description}</p>
          <span className={`inline-block text-xs font-bold ${getCategoryColor(categoryKey as string).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
            {criterion.weight.toFixed(2)}%
          </span>
        </div>
      </div>
    ));
  };

  // Helper para obtener el peso de una categoría de forma segura
  const getCategoryWeight = (categoryKey: keyof BackendTemplate['summary']['weights_summary']): number => {
    return template?.summary.weights_summary[categoryKey] ?? 0;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
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
            <div className="space-y-8">
              {/* Información General */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-800 mb-6 text-xl flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-500" />
                  Información General
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Plantilla
                    </label>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 font-medium text-lg">{template.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resumen
                    </label>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Criterios:</span>
                        <span className="font-medium">{template.summary.total_criteria}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Categorías Usadas:</span>
                        <span className="font-medium">{template.summary.categories_used}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pesos Válidos:</span>
                        <span className={`font-medium ${template.summary.is_valid_weights ? 'text-green-600' : 'text-red-600'}`}>
                          {template.summary.is_valid_weights ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 leading-relaxed">{template.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Criterios por Categoría */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-800 mb-6 text-xl flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-500" />
                  Criterios
                </h4>
                
                {getValidationStatus()}

                <div className="space-y-8">
                  {/* Productividad */}
                  {getCategoryLength(template.criteria.productivity) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800 text-lg">
                            {getCategoryDisplayName('productivity')}
                          </h5>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor('productivity')}`}>
                            {getCategoryLength(template.criteria.productivity)} criterio{getCategoryLength(template.criteria.productivity) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          {getCategoryWeight('productivity').toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mapCategory(template.criteria.productivity, 'productivity')}
                      </div>
                    </div>
                  )}

                  {/* Conducta Laboral */}
                  {getCategoryLength(template.criteria.work_conduct) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800 text-lg">
                            {getCategoryDisplayName('work_conduct')}
                          </h5>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor('work_conduct')}`}>
                            {getCategoryLength(template.criteria.work_conduct)} criterio{getCategoryLength(template.criteria.work_conduct) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                          {getCategoryWeight('work_conduct').toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mapCategory(template.criteria.work_conduct, 'work_conduct')}
                      </div>
                    </div>
                  )}

                  {/* Habilidades */}
                  {getCategoryLength(template.criteria.skills) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800 text-lg">
                            {getCategoryDisplayName('skills')}
                          </h5>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor('skills')}`}>
                            {getCategoryLength(template.criteria.skills)} criterio{getCategoryLength(template.criteria.skills) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                          {getCategoryWeight('skills').toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mapCategory(template.criteria.skills, 'skills')}
                      </div>
                    </div>
                  )}

                  {/* Seguridad y salud en el Trabajo */}
                  {getCategoryLength(template.criteria.seguridad_trabajo) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800 text-lg">
                            {getCategoryDisplayName('seguridad_trabajo')}
                          </h5>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor('seguridad_trabajo')}`}>
                            {getCategoryLength(template.criteria.seguridad_trabajo)} criterio{getCategoryLength(template.criteria.seguridad_trabajo) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                          {getCategoryWeight('seguridad_trabajo').toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mapCategory(template.criteria.seguridad_trabajo, 'seguridad_trabajo')}
                      </div>
                    </div>
                  )}

                  {/* Si no hay criterios */}
                  {template.summary.total_criteria === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No hay criterios asociados a esta plantilla.</p>
                  )}
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