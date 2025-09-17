import React, { useState } from 'react';
import { 
  User, Calendar, Building, Info, CheckCircle, 
  Clock, FileText, Search, Filter, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { useEvaluaciones, useFiltrosEvaluaciones } from '../hooks/useEvaluaciones';
import servicioEvaluaciones from '../services/evaluationService';

const EvaluacionesPage: React.FC = () => {
  // Estados locales
  const [vistaActual, setVistaActual] = useState<'lista' | 'calificar'>('lista');
  const [puntuaciones, setPuntuaciones] = useState<Record<number, number>>({});
  const [mostrarInfoPeso, setMostrarInfoPeso] = useState<number | null>(null);

  // Hooks personalizados
  const {
    misEvaluaciones,
    evaluacionActual,
    cargando,
    error,
    enviando,
    cargarEvaluacionParaCalificar,
    enviarPuntuaciones,
    limpiarError,
    limpiarEvaluacionActual,
    obtenerEvaluacionesPorModo,
    esEvaluacionCompleta
  } = useEvaluaciones();

  const {
    terminoBusqueda,
    filtroEstado,
    establecerTerminoBusqueda,
    establecerFiltroEstado
  } = useFiltrosEvaluaciones();

  // ==================== HANDLERS ====================

  const manejarIniciarEvaluacion = async (evaluacionId: number) => {
    try {
      await cargarEvaluacionParaCalificar(evaluacionId);
      setVistaActual('calificar');
      setPuntuaciones({});
    } catch (err) {
      console.error('Error iniciando evaluación:', err);
    }
  };

  const manejarSeleccionPuntuacion = (criterioId: number, puntuacion: number) => {
    setPuntuaciones(prev => ({ ...prev, [criterioId]: puntuacion }));
  };

  const manejarEnviarEvaluacion = async () => {
    if (!evaluacionActual || !esEvaluacionCompleta(puntuaciones)) return;
    
    try {
      await enviarPuntuaciones(evaluacionActual.id, puntuaciones);
      setVistaActual('lista');
      setPuntuaciones({});
      // Mostrar notificación de éxito
      alert('¡Evaluación completada exitosamente!');
    } catch (err) {
      // El error ya se maneja en el hook
      console.error('Error enviando evaluación:', err);
    }
  };

  const manejarVolverALista = () => {
    setVistaActual('lista');
    limpiarEvaluacionActual();
    setPuntuaciones({});
  };

  // ==================== COMPONENTES AUXILIARES ====================

  const BadgeEstado: React.FC<{ estado: string }> = ({ estado }) => (
    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${servicioEvaluaciones.obtenerColorEstado(estado)}`}>
      {servicioEvaluaciones.obtenerTextoEstado(estado)}
    </div>
  );

  const TooltipInfoPeso: React.FC<{ peso: number; criterioId: number }> = ({ peso, criterioId }) => {
    const infoPeso = servicioEvaluaciones.obtenerInfoPeso(peso);
    const esVisible = mostrarInfoPeso === criterioId;

    return (
      <div className="relative">
        <button
          onClick={() => setMostrarInfoPeso(esVisible ? null : criterioId)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Información sobre el peso del criterio"
        >
          <Info className="w-5 h-5 text-gray-400" />
        </button>
        
        {esVisible && (
          <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10 w-64">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${infoPeso.color}`}></div>
              <span className="text-sm font-medium">{infoPeso.texto}</span>
            </div>
            <p className="text-xs text-gray-600">
              Este criterio influye en la calificación final según su importancia relativa.
            </p>
          </div>
        )}
      </div>
    );
  };

  const SelectorPuntuacion: React.FC<{ criterioId: number; puntuacionActual?: number }> = ({ 
    criterioId, 
    puntuacionActual 
  }) => (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Calificación:</span>
        {puntuacionActual && (
          <span className="text-sm text-gray-600">
            Seleccionado: {puntuacionActual}/5
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((puntuacion) => (
          <button
            key={puntuacion}
            onClick={() => manejarSeleccionPuntuacion(criterioId, puntuacion)}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 border-2
              ${puntuacionActual === puntuacion
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            {puntuacion}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Deficiente</span>
        <span>Excelente</span>
      </div>
    </div>
  );

  // ==================== VISTA DE ERROR ====================

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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

  // ==================== VISTA DE CALIFICACIÓN ====================

  if (vistaActual === 'calificar' && evaluacionActual) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        {/* Header de la evaluación */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={manejarVolverALista}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </button>
            <BadgeEstado estado={evaluacionActual.status} />
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Evaluación de Desempeño</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <User className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <span className="font-medium">Empleado:</span>
                    <div className="text-gray-900 font-semibold">
                      {evaluacionActual.employee.first_name} {evaluacionActual.employee.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{evaluacionActual.employee.position}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <span className="font-medium">Período:</span>
                    <div className="text-gray-900 font-semibold">{evaluacionActual.period.name}</div>
                    <div className="text-sm text-gray-600">{evaluacionActual.period.description}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Building className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <span className="font-medium">Evaluador:</span>
                    <div className="text-gray-900 font-semibold">
                      {evaluacionActual.evaluator.first_name} {evaluacionActual.evaluator.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{evaluacionActual.evaluator.position}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <span className="font-medium">Fecha límite:</span>
                    <div className="text-gray-900 font-semibold">
                      {new Date(evaluacionActual.period.due_date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Criterios de evaluación */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Criterios de Evaluación</h2>
          
          {evaluacionActual.scores.map((criterio) => (
            <div key={criterio.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{criterio.criteria.name}</h3>
                    {criterio.criteria.category && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${servicioEvaluaciones.obtenerColorCategoria(criterio.criteria.category)}`}>
                        {criterio.criteria.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed">{criterio.criteria.description}</p>
                </div>
                
                <TooltipInfoPeso peso={criterio.weight} criterioId={criterio.id} />
              </div>
              
              <SelectorPuntuacion 
                criterioId={criterio.criteria_id} 
                puntuacionActual={puntuaciones[criterio.criteria_id]} 
              />
            </div>
          ))}
        </div>

        {/* Botón de envío */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={manejarEnviarEvaluacion}
            disabled={!esEvaluacionCompleta(puntuaciones) || enviando}
            className={`
              px-8 py-3 rounded-lg font-semibold transition-all duration-200
              ${esEvaluacionCompleta(puntuaciones) && !enviando
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {enviando ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Completar Evaluación
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==================== VISTA PRINCIPAL - LISTA ====================

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
        <h1 className="text-3xl font-bold text-gray-900">Evaluaciones para Calificar</h1>

        {/* Estadísticas */}
        {misEvaluaciones && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {misEvaluaciones.as_evaluator.summary.total}
              </div>
              <div className="text-sm text-blue-800">Total asignadas</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {misEvaluaciones.as_evaluator.summary.pending_to_evaluate}
              </div>
              <div className="text-sm text-yellow-800">Pendientes por calificar</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {misEvaluaciones.as_evaluator.summary.completed}
              </div>
              <div className="text-sm text-green-800">Completadas</div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <p className="text-blue-800">
          🎯 Evaluaciones que debes realizar como evaluador asignado
        </p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Evaluaciones para Calificar</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {evaluacionesFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
                <p className="text-gray-600">
                  {terminoBusqueda || filtroEstado !== 'todos'
                    ? 'No se encontraron evaluaciones con los filtros aplicados.'
                    : 'No tienes evaluaciones disponibles en este momento.'
                  }
                </p>
              </div>
            ) : (
              evaluacionesFiltradas.map((evaluacion) => (
                <div key={evaluacion.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {evaluacion.employee_name}
                        </h3>
                        <BadgeEstado estado={evaluacion.status} />
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>📅 {evaluacion.period_name}</span>
                        {evaluacion.completed_at && (
                          <span>✅ Completada el {new Date(evaluacion.completed_at).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {evaluacion.status === 'pending' && (
                        <button
                          onClick={() => manejarIniciarEvaluacion(evaluacion.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Calificar
                        </button>
                      )}
                      
                      {evaluacion.status === 'completed' && (
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Ver Reporte
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesPage;