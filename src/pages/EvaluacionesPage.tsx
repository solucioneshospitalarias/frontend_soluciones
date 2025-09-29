import React, { useState, useEffect } from 'react';
import {
  User,
  Search,
  AlertCircle,
  Target,
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
  Eye,
  Play
} from 'lucide-react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import type {
  MisEvaluacionesRespuestaDTO,
  ResumenEvaluacionDTO,
} from '../types/evaluation';
import RealizarEvaluacionModal from '../components/RealizarEvaluacionModal';
import VerReporteEvaluacionModal from '../components/VerReporteEvaluacionModal'; 

const EvaluacionesPage: React.FC = () => {
  // Estados
  const [misEvaluaciones, setMisEvaluaciones] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  
  // Estados para los modales
  const [modalRealizarOpen, setModalRealizarOpen] = useState(false);
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<number | null>(null);

  // Cargar evaluaciones al montar el componente
  useEffect(() => {
    cargarMisEvaluaciones();
  }, []);

  const cargarMisEvaluaciones = async (): Promise<void> => {
    setCargando(true);
    setError(null);
    
    try {
      const data = await servicioEvaluaciones.obtenerMisEvaluaciones();
      setMisEvaluaciones(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion ? err.message : 'Error al cargar las evaluaciones';
      console.error('Error cargando evaluaciones:', err);
      setError(mensaje);
      
      setMisEvaluaciones({
        as_employee: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending: 0 },
        },
        as_evaluator: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending_to_evaluate: 0 },
        },
      });
    } finally {
      setCargando(false);
    }
  };

  // Handlers
  const handleRealizarEvaluacion = (evaluacionId: number): void => {
    console.log('Abriendo evaluación ID:', evaluacionId);
    setEvaluacionSeleccionada(evaluacionId);
    setModalRealizarOpen(true);
  };

  const handleVerReporte = (evaluacionId: number): void => {
    console.log('Ver reporte de evaluación:', evaluacionId);
    setEvaluacionSeleccionada(evaluacionId);
    setModalReporteOpen(true);
  };

  const handleEvaluacionCompletada = (): void => {
    cargarMisEvaluaciones();
    setModalRealizarOpen(false);
    setEvaluacionSeleccionada(null);
  };

  const handleReporteCerrado = (): void => {
    setModalReporteOpen(false);
    setEvaluacionSeleccionada(null);
  };

  const limpiarError = (): void => {
    setError(null);
  };

  // Componente para badge de estado
  const BadgeEstado: React.FC<{ estado: string }> = ({ estado }) => {
    const getEstadoConfig = (status: string) => {
      const statusLower = status.toLowerCase();
      
      switch (statusLower) {
        case 'pending':
        case 'pendiente':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            texto: 'Pendiente',
          };
        case 'completed':
        case 'completada':
        case 'completado':
        case 'realizada':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            texto: 'Completada',
          };
        case 'overdue':
        case 'vencida':
        case 'vencido':
        case 'atrasada':
        case 'atrasado':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            texto: 'Vencida',
          };
        case 'in_progress':
        case 'en_progreso':
        case 'en_proceso':
          return {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            texto: 'En Progreso',
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            texto: `${status} [DEBUG]`,
          };
      }
    };

    const config = getEstadoConfig(estado);
    
    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color} transition-all`}>
        {config.texto}
      </span>
    );
  };

  // Función para obtener evaluaciones por modo
  const obtenerEvaluacionesPorModo = (modo: 'empleado' | 'evaluador'): ResumenEvaluacionDTO[] => {
    if (!misEvaluaciones) return [];
    
    if (modo === 'empleado') {
      return misEvaluaciones.as_employee.evaluations;
    } else {
      return misEvaluaciones.as_evaluator.evaluations;
    }
  };

  // Vista de error
  if (error) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 shadow-sm max-w-5xl mx-auto">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-base">Error al cargar las evaluaciones</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={limpiarError}
            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-100"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Obtener evaluaciones en modo evaluador
  const evaluaciones = obtenerEvaluacionesPorModo('evaluador');

  // Filtrar evaluaciones localmente
  const evaluacionesFiltradas = evaluaciones.filter(evaluacion => {
    const coincideBusqueda = evaluacion.employee_name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
                           evaluacion.period_name.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const coincidenEstado = filtroEstado === 'todos' || evaluacion.status === filtroEstado;
    return coincideBusqueda && coincidenEstado;
  });

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 font-sans">Mis Evaluaciones</h1>
        <p className="text-gray-600 text-sm">Evaluaciones que debo realizar como evaluador</p>
      </div>

      {/* Loading State */}
      {cargando && (
        <div className="flex items-center justify-center py-12 max-w-5xl mx-auto">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 text-sm font-medium">Cargando evaluaciones...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!cargando && misEvaluaciones && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de empleado o período..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="overdue">Vencidas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {misEvaluaciones.as_evaluator.summary.total}
                  </p>
                  <p className="text-gray-600 text-sm font-medium">Total Asignadas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {misEvaluaciones.as_evaluator.summary.pending_to_evaluate}
                  </p>
                  <p className="text-gray-600 text-sm font-medium">Por Calificar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {misEvaluaciones.as_evaluator.summary.completed}
                  </p>
                  <p className="text-gray-600 text-sm font-medium">Completadas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluations List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 font-sans">
                Evaluaciones Asignadas ({evaluacionesFiltradas.length})
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {evaluacionesFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">No se encontraron evaluaciones</p>
                  <p className="text-gray-400 text-sm">
                    {terminoBusqueda || filtroEstado !== 'todos'
                      ? 'Prueba ajustando los filtros de búsqueda'
                      : 'No tienes evaluaciones asignadas en este momento'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {evaluacionesFiltradas.map((evaluacion) => (
                    <div key={evaluacion.id} className="p-6 hover:bg-gray-50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">
                              {evaluacion.employee_name}
                            </h4>
                            <BadgeEstado estado={evaluacion.status} />
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>Período: {evaluacion.period_name}</span>
                            </div>
                            {evaluacion.completed_at && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-500" />
                                <span>Completada: {new Date(evaluacion.completed_at).toLocaleDateString('es-ES')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          {(evaluacion.status === 'pending' || evaluacion.status === 'pendiente' || evaluacion.status === 'overdue' || evaluacion.status === 'vencida' || evaluacion.status === 'atrasada') ? (
                            <button
                              onClick={() => handleRealizarEvaluacion(evaluacion.id)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                (evaluacion.status === 'overdue' || evaluacion.status === 'vencida' || evaluacion.status === 'atrasada')
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Play className="w-4 h-4" />
                              {(evaluacion.status === 'overdue' || evaluacion.status === 'vencida' || evaluacion.status === 'atrasada') ? 'CALIFICAR (ATRASADA)' : 'CALIFICAR AHORA'}
                            </button>
                          ) : (evaluacion.status === 'completed' || evaluacion.status === 'completada' || evaluacion.status === 'completado' || evaluacion.status === 'realizada') ? (
                            <button 
                              onClick={() => handleVerReporte(evaluacion.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              VER REPORTE
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRealizarEvaluacion(evaluacion.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                            >
                              <Play className="w-4 h-4" />
                              EVALUAR
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para realizar evaluación */}
      <RealizarEvaluacionModal
        show={modalRealizarOpen}
        evaluationId={evaluacionSeleccionada}
        onClose={() => {
          setModalRealizarOpen(false);
          setEvaluacionSeleccionada(null);
        }}
        onComplete={handleEvaluacionCompletada}
      />

      {/* Modal para ver reporte */}
      <VerReporteEvaluacionModal
        show={modalReporteOpen}
        evaluationId={evaluacionSeleccionada}
        onClose={handleReporteCerrado}
      />
    </div>
  );
};

export default EvaluacionesPage;