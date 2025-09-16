import { useState, useEffect, useCallback } from 'react';
import servicioEvaluaciones, { ErrorEvaluacion } from '../services/evaluationService';
import type {
  EvaluacionParaCalificarDTO,
  MisEvaluacionesRespuestaDTO,
  PuntuacionCriterioDTO,
  FiltrosEvaluacionParams,
  ModoEvaluacion,
  ResumenEvaluacionDTO
} from '../types/evaluation';

// ==================== INTERFACES DEL HOOK ====================

interface RetornoUseEvaluaciones {
  // Estado principal
  misEvaluaciones: MisEvaluacionesRespuestaDTO | null;
  evaluacionActual: EvaluacionParaCalificarDTO | null;
  cargando: boolean;
  error: string | null;
  enviando: boolean;

  // Acciones principales
  cargarMisEvaluaciones: (filtros?: FiltrosEvaluacionParams) => Promise<void>;
  cargarEvaluacionParaCalificar: (evaluacionId: number) => Promise<void>;
  enviarPuntuaciones: (evaluacionId: number, puntuaciones: Record<number, number>) => Promise<void>;
  limpiarError: () => void;
  limpiarEvaluacionActual: () => void;

  // Helpers para la UI
  obtenerEvaluacionesPorModo: (modo: ModoEvaluacion) => ResumenEvaluacionDTO[];
  esEvaluacionCompleta: (puntuaciones: Record<number, number>) => boolean;
}

interface RetornoUseFiltrosEvaluaciones {
  terminoBusqueda: string;
  filtroEstado: string;
  filtroPeriodo: string;
  establecerTerminoBusqueda: (termino: string) => void;
  establecerFiltroEstado: (estado: string) => void;
  establecerFiltroPeriodo: (periodo: string) => void;
  limpiarFiltros: () => void;
  obtenerFiltrosComoParametros: () => FiltrosEvaluacionParams;
}

// ==================== HOOK PRINCIPAL ====================

export const useEvaluaciones = (): RetornoUseEvaluaciones => {
  // Estado
  const [misEvaluaciones, setMisEvaluaciones] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [evaluacionActual, setEvaluacionActual] = useState<EvaluacionParaCalificarDTO | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== ACCIONES PRINCIPALES ====================

  const cargarMisEvaluaciones = useCallback(async (filtros?: FiltrosEvaluacionParams) => {
    setCargando(true);
    setError(null);
    
    try {
      const data = await servicioEvaluaciones.obtenerMisEvaluaciones(filtros);
      console.log('🎯 Datos procesados en hook:', data);
      setMisEvaluaciones(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al cargar las evaluaciones';
      setError(mensaje);
      console.error('Error cargando mis evaluaciones:', err);
      
      // ✅ NUEVO: En caso de error, establecer estructura por defecto para evitar crashes
      setMisEvaluaciones({
        as_employee: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending: 0 }
        },
        as_evaluator: {
          evaluations: [],
          summary: { total: 0, completed: 0, pending_to_evaluate: 0 }
        }
      });
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarEvaluacionParaCalificar = useCallback(async (evaluacionId: number) => {
    setCargando(true);
    setError(null);
    
    try {
      const data = await servicioEvaluaciones.obtenerEvaluacionParaCalificar(evaluacionId);
      setEvaluacionActual(data);
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al cargar la evaluación para calificar';
      setError(mensaje);
      console.error('Error cargando evaluación para calificar:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  const enviarPuntuaciones = useCallback(async (evaluacionId: number, puntuaciones: Record<number, number>) => {
    if (!evaluacionActual) {
      setError('No hay evaluación cargada para calificar');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      // Crear el mapeo de criteria_id a assigned_criteria_id
      const mapaAsignacion: Record<number, number> = {};
      evaluacionActual.scores.forEach(score => {
        mapaAsignacion[score.criteria_id] = score.id;
      });

      // Convertir puntuaciones al formato esperado por el backend
      const puntuacionesFormateadas: PuntuacionCriterioDTO[] = 
        servicioEvaluaciones.formatearPuntuacionesParaEnvio(puntuaciones, mapaAsignacion);

      // Enviar al backend
      await servicioEvaluaciones.enviarPuntuaciones(evaluacionId, puntuacionesFormateadas);
      
      // Recargar mis evaluaciones para reflejar el cambio
      await cargarMisEvaluaciones();
      
      // Limpiar la evaluación actual
      setEvaluacionActual(null);
      
    } catch (err) {
      const mensaje = err instanceof ErrorEvaluacion 
        ? err.message 
        : 'Error al enviar las puntuaciones';
      setError(mensaje);
      console.error('Error enviando puntuaciones:', err);
      throw err; // Re-throw para que el componente pueda manejarlo
    } finally {
      setEnviando(false);
    }
  }, [evaluacionActual, cargarMisEvaluaciones]);

  // ==================== HELPERS ====================

  const obtenerEvaluacionesPorModo = useCallback((modo: ModoEvaluacion): ResumenEvaluacionDTO[] => {
    // ✅ VALIDACIÓN MEJORADA: Verificar que misEvaluaciones no sea null y tenga la estructura correcta
    if (!misEvaluaciones) {
      console.log('⚠️ misEvaluaciones es null, retornando array vacío');
      return [];
    }
    
    try {
      const evaluaciones = modo === 'evaluador' 
        ? misEvaluaciones.as_evaluator?.evaluations || []
        : misEvaluaciones.as_employee?.evaluations || [];
      
      console.log(`📋 Evaluaciones para modo ${modo}:`, evaluaciones);
      return evaluaciones;
    } catch (err) {
      console.error('❌ Error accediendo a evaluaciones por modo:', err);
      return [];
    }
  }, [misEvaluaciones]);

  const esEvaluacionCompleta = useCallback((puntuaciones: Record<number, number>): boolean => {
    if (!evaluacionActual || !evaluacionActual.scores) {
      return false;
    }
    
    try {
      return servicioEvaluaciones.validarPuntuaciones(
        puntuaciones,
        evaluacionActual.scores.map(score => score.criteria_id)
      );
    } catch (err) {
      console.error('❌ Error validando puntuaciones:', err);
      return false;
    }
  }, [evaluacionActual]);

  // ==================== UTILIDADES ====================

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  const limpiarEvaluacionActual = useCallback(() => {
    setEvaluacionActual(null);
  }, []);

  // ==================== EFECTOS ====================

  // Cargar evaluaciones al montar el hook
  useEffect(() => {
    console.log('🔄 Montando hook de evaluaciones...');
    cargarMisEvaluaciones();
  }, [cargarMisEvaluaciones]);

  // Debug: Log cuando cambie misEvaluaciones
  useEffect(() => {
    console.log('🔍 Estado misEvaluaciones actualizado:', misEvaluaciones);
  }, [misEvaluaciones]);

  // Retorno del hook
  return {
    // Estado
    misEvaluaciones,
    evaluacionActual,
    cargando,
    error,
    enviando,

    // Acciones
    cargarMisEvaluaciones,
    cargarEvaluacionParaCalificar,
    enviarPuntuaciones,
    limpiarError,
    limpiarEvaluacionActual,

    // Helpers
    obtenerEvaluacionesPorModo,
    esEvaluacionCompleta
  };
};

// ==================== HOOK PARA FILTROS ====================

export const useFiltrosEvaluaciones = (): RetornoUseFiltrosEvaluaciones => {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  const limpiarFiltros = useCallback(() => {
    setTerminoBusqueda('');
    setFiltroEstado('todos');
    setFiltroPeriodo('todos');
  }, []);

  const obtenerFiltrosComoParametros = useCallback((): FiltrosEvaluacionParams => {
    const parametros: FiltrosEvaluacionParams = {};
    
    if (filtroEstado !== 'todos') {
      parametros.status = filtroEstado;
    }
    
    if (filtroPeriodo !== 'todos') {
      parametros.period_id = parseInt(filtroPeriodo);
    }

    return parametros;
  }, [filtroEstado, filtroPeriodo]);

  return {
    terminoBusqueda,
    filtroEstado,
    filtroPeriodo,
    establecerTerminoBusqueda: setTerminoBusqueda,
    establecerFiltroEstado: setFiltroEstado,
    establecerFiltroPeriodo: setFiltroPeriodo,
    limpiarFiltros,
    obtenerFiltrosComoParametros
  };
};

export default useEvaluaciones;