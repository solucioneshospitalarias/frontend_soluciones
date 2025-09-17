import React, { useState } from 'react';
import { 
  User, Search, Filter, AlertCircle, 
  FileText, Target, CheckCircle, Clock 
} from 'lucide-react';
import { useEvaluaciones, useFiltrosEvaluaciones } from '../hooks/useEvaluaciones';
import RealizarEvaluacionModal from '../components/RealizarEvaluacionModal';

const EvaluacionesPage: React.FC = () => {
  // Estados para el modal
  const [modalRealizarOpen, setModalRealizarOpen] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<number | null>(null);

  // Hooks personalizados
  const {
    misEvaluaciones,
    cargando,
    error,
    obtenerEvaluacionesPorModo,
    cargarMisEvaluaciones,
    limpiarError
  } = useEvaluaciones();

  const {
    terminoBusqueda,
    filtroEstado,
    establecerTerminoBusqueda,
    establecerFiltroEstado
  } = useFiltrosEvaluaciones();

  // ==================== HANDLERS ====================

  const handleRealizarEvaluacion = (evaluacionId: number) => {
    setEvaluacionSeleccionada(evaluacionId);
    setModalRealizarOpen(true);
  };

  const handleEvaluacionCompletada = () => {
    // Recargar las evaluaciones después de completar una
    cargarMisEvaluaciones();
    setModalRealizarOpen(false);
    setEvaluacionSeleccionada(null);
  };

  const handleVerReporte = (evaluacionId: number) => {
    // TODO: Implementar modal de ver reporte
    console.log('Ver reporte de evaluación:', evaluacionId);
  };

  // ==================== COMPONENTES AUXILIARES ====================

  const BadgeEstado: React.FC<{ estado: string }> = ({ estado }) => {
    const getEstadoConfig = (status: string) => {
      switch (status) {
        case 'pending':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            texto: 'Pendiente'
          };
        case 'completed':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            texto: 'Completada'
          };
        case 'overdue':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            texto: 'Vencida'
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            texto: estado
          };
      }
    };

    const config = getEstadoConfig(estado);
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.texto}
      </span>
    );
  };

  // ==================== VISTA DE ERROR ====================

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error al cargar las evaluaciones</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={limpiarError}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ==================== VISTA PRINCIPAL ====================

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Evaluaciones</h1>
        <p className="text-gray-600">Gestiona las evaluaciones que debes realizar y revisa tus propias evaluaciones</p>

        {/* Estadísticas */}
        {misEvaluaciones && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {misEvaluaciones.as_evaluator.summary.total}
                  </div>
                  <div className="text-sm text-blue-800">Total asignadas</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {misEvaluaciones.as_evaluator.summary.pending_to_evaluate}
                  </div>
                  <div className="text-sm text-yellow-800">Pendientes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {misEvaluaciones.as_evaluator.summary.completed}
                  </div>
                  <div className="text-sm text-green-800">Completadas</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {misEvaluaciones.as_employee.summary.total}
                  </div>
                  <div className="text-sm text-purple-800">Mis evaluaciones</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por empleado o período..."
              value={terminoBusqueda}
              onChange={(e) => establecerTerminoBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filtroEstado}
              onChange={(e) => establecerFiltroEstado(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="overdue">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800">
            Evaluaciones que debes realizar como evaluador asignado
          </p>
        </div>
      </div>

      {/* Estado de carga */}
      {cargando && (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Cargando evaluaciones...</span>
          </div>
        </div>
      )}

      {/* Lista de evaluaciones */}
      {!cargando && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Evaluaciones para Calificar ({evaluacionesFiltradas.length})
            </h2>
          </div>
          
          {evaluacionesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
              <p className="text-gray-600">
                {terminoBusqueda || filtroEstado !== 'todos'
                  ? 'No se encontraron evaluaciones con los filtros aplicados.'
                  : 'No tienes evaluaciones asignadas en este momento.'
                }
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-4">
              {evaluacionesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
                  <p className="text-gray-600">
                    {terminoBusqueda || filtroEstado !== 'todos'
                      ? 'No se encontraron evaluaciones con los filtros aplicados.'
                      : 'No tienes evaluaciones asignadas en este momento.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {evaluacionesFiltradas.map((evaluacion) => (
                    <div key={evaluacion.id} className="group p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-blue-200 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {evaluacion.employee_name}
                            </h3>
                            <p className="text-sm text-gray-500">Empleado a evaluar</p>
                          </div>
                        </div>
                        <BadgeEstado estado={evaluacion.status} />
                      </div>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Período:</span>
                          <span className="font-medium">{evaluacion.period_name}</span>
                        </div>
                        {evaluacion.completed_at && (
                          <div className="flex items-center justify-between">
                            <span>Completada:</span>
                            <span className="font-medium">{new Date(evaluacion.completed_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* BOTONES MUY VISIBLES */}
                      <div className="flex gap-2 mt-4">
                        {evaluacion.status === 'pending' && (
                          <button
                            onClick={() => {
                              console.log('Abriendo evaluación ID:', evaluacion.id);
                              handleRealizarEvaluacion(evaluacion.id);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Target className="w-5 h-5" />
                            CALIFICAR AHORA
                          </button>
                        )}
                        
                        {evaluacion.status === 'completed' && (
                          <button 
                            onClick={() => handleVerReporte(evaluacion.id)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <FileText className="w-5 h-5" />
                            VER REPORTE
                          </button>
                        )}

                        {evaluacion.status === 'overdue' && (
                          <button
                            onClick={() => {
                              console.log('Abriendo evaluación atrasada ID:', evaluacion.id);
                              handleRealizarEvaluacion(evaluacion.id);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Target className="w-5 h-5" />
                            CALIFICAR (ATRASADA)
                          </button>
                        )}

                        {/* BOTÓN DE DEBUG - TEMPORAL */}
                        <button
                          onClick={() => {
                            console.log('=== DEBUG INFORMACIÓN ===');
                            console.log('Evaluación completa:', evaluacion);
                            console.log('ID de evaluación:', evaluacion.id);
                            console.log('Status:', evaluacion.status);
                            console.log('Employee name:', evaluacion.employee_name);
                            console.log('Modal state - isOpen:', modalRealizarOpen);
                            console.log('Modal state - selectedId:', evaluacionSeleccionada);
                            console.log('Token en localStorage:', !!localStorage.getItem('token'));
                            console.log('=========================');
                            
                            // Probar el endpoint directamente
                            const token = localStorage.getItem('token');
                            if (token) {
                              fetch(`/api/v1/evaluations/${evaluacion.id}/for-scoring`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              })
                              .then(response => {
                                console.log('Direct fetch response status:', response.status);
                                console.log('Direct fetch response headers:', [...response.headers.entries()]);
                                return response.text();
                              })
                              .then(text => {
                                console.log('Direct fetch response text:', text.substring(0, 500));
                                try {
                                  const json = JSON.parse(text);
                                  console.log('Direct fetch parsed JSON:', json);
                                } catch (_e) {
                                  console.log('Failed to parse as JSON');
                                }
                              })
                              .catch(err => console.error('Direct fetch error:', err));
                            }
                            
                            handleRealizarEvaluacion(evaluacion.id);
                          }}
                          className="px-3 py-3 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                          title="Debug - Ver datos y probar endpoint"
                        >
                          DEBUG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal para realizar evaluación */}
      {modalRealizarOpen && evaluacionSeleccionada && (
        <RealizarEvaluacionModal
          evaluationId={evaluacionSeleccionada}
          isOpen={modalRealizarOpen}
          onClose={() => {
            setModalRealizarOpen(false);
            setEvaluacionSeleccionada(null);
          }}
          onSuccess={handleEvaluacionCompletada}
        />
      )}
    </div>
  );
};

export default EvaluacionesPage;