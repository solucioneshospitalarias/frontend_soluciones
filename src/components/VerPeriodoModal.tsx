import React, { useState, useEffect } from 'react';
import { getPeriodById } from '../services/evaluationService';
import type { Period } from '../types/evaluation';
import { Calendar, X, Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface VerPeriodoModalProps {
  show: boolean;
  onClose: () => void;
  periodId: number | null;
}

const VerPeriodoModal: React.FC<VerPeriodoModalProps> = ({ 
  show, 
  onClose, 
  periodId 
}) => {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && periodId) {
      loadPeriodData();
    }
  }, [show, periodId]);

  const loadPeriodData = async () => {
    if (!periodId) return;
    
    setLoading(true);
    setError(null);
    try {
      const periodData = await getPeriodById(periodId);
      setPeriod(periodData);
    } catch (err) {
      console.error('Error cargando período:', err);
      setError('Error al cargar los datos del período');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPeriod(null);
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
    if (!period) return { color: 'gray', text: 'Desconocido', icon: Clock };

    if (period.status === 'active') {
      return { color: 'green', text: 'Activo', icon: CheckCircle };
    } else if (period.status === 'draft') {
      return { color: 'amber', text: 'Borrador', icon: Clock };
    } else if (period.status === 'completed') {
      return { color: 'blue', text: 'Completado', icon: CheckCircle };
    } else if (period.status === 'archived') {
      return { color: 'gray', text: 'Archivado', icon: AlertCircle };
    } else if (period.is_active) {
      return { color: 'green', text: 'Activo', icon: CheckCircle };
    } else {
      return { color: 'gray', text: 'Inactivo', icon: Clock };
    }
  };

  const getDuration = () => {
    if (!period) return '';
    
    try {
      const start = new Date(period.start_date);
      const end = new Date(period.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        return `${diffDays} días`;
      } else if (diffDays <= 30) {
        const weeks = Math.round(diffDays / 7);
        return `${weeks} semana${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.round(diffDays / 30);
        return `${months} mes${months > 1 ? 'es' : ''}`;
      }
    } catch {
      return 'No calculable';
    }
  };

  if (!show) return null;

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Detalles del Período
            {period && <span className="text-lg text-gray-500">#{period.id}</span>}
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Cargando período...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : period ? (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Información General
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Período
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900 font-medium">{period.name}</p>
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

                {period.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-900">{period.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cronograma
                </h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio
                      </label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-900 font-medium">
                          {formatDate(period.start_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Fin
                      </label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-900 font-medium">
                          {formatDate(period.end_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Límite
                      </label>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-orange-900 font-medium">
                          {formatDate(period.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración del Período
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-900 font-medium">{getDuration()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del Sistema
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600 font-mono text-sm">#{period.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                        {formatDate(period.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Última Actualización
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        {formatDate(period.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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

export default VerPeriodoModal;