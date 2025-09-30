import { useState, useEffect, useCallback } from "react";
import { servicioEvaluaciones } from "../services/evaluationService";
import type { MisEvaluacionesRespuestaDTO, ResumenEvaluacionDTO } from "../types/evaluation";

interface RetornoUseEvaluaciones {
  misEvaluaciones: MisEvaluacionesRespuestaDTO | null;
  cargando: boolean;
  error: string | null;
  limpiarError: () => void;
  obtenerEvaluacionesPorModo: (modo: "evaluador" | "empleado") => ResumenEvaluacionDTO[];
  refrescarEvaluaciones: () => void;
}

const getDefaultEvaluationsStructure = (): MisEvaluacionesRespuestaDTO => ({
  as_employee: {
    evaluations: [],
    summary: { total: 0, completed: 0, pending: 0 },
  },
  as_evaluator: {
    evaluations: [],
    summary: { total: 0, completed: 0, pending_to_evaluate: 0 },
  },
});

export const useEvaluaciones = (): RetornoUseEvaluaciones => {
  const [misEvaluaciones, setMisEvaluaciones] = useState<MisEvaluacionesRespuestaDTO | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      console.log("🔍 Obteniendo mis evaluaciones...");
      const response = await servicioEvaluaciones.obtenerMisEvaluaciones();
      console.log("✅ Datos procesados en hook:", response);
      setMisEvaluaciones(response);
    } catch (err: any) {
      console.error("❌ Error al obtener evaluaciones:", err);
      setError(err.message || "Error al cargar las evaluaciones");
      setMisEvaluaciones(getDefaultEvaluationsStructure());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    console.log("🔄 Montando hook de evaluaciones...");
    fetchEvaluaciones();
  }, [fetchEvaluaciones]);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  const obtenerEvaluacionesPorModo = useCallback(
    (modo: "evaluador" | "empleado"): ResumenEvaluacionDTO[] => {
      if (!misEvaluaciones) {
        console.warn("⚠️ misEvaluaciones es null, retornando array vacío");
        return [];
      }
      const evaluaciones =
        modo === "evaluador"
          ? misEvaluaciones.as_evaluator.evaluations
          : misEvaluaciones.as_employee.evaluations;
      console.log(`📋 Evaluaciones para modo ${modo}:`, evaluaciones);
      return evaluaciones || [];
    },
    [misEvaluaciones]
  );

  const refrescarEvaluaciones = useCallback(() => {
    console.log("🔄 Refrescando evaluaciones...");
    fetchEvaluaciones();
  }, [fetchEvaluaciones]);

  return {
    misEvaluaciones,
    cargando,
    error,
    limpiarError,
    obtenerEvaluacionesPorModo,
    refrescarEvaluaciones,
  };
};