import { useState, useEffect, useCallback } from "react";
import { servicioEvaluaciones } from "../services/evaluationService";
import type { MisEvaluacionesRespuestaDTO, ResumenEvaluacionDTO } from "../types/evaluation";

interface RetornoUseEvaluaciones {
  misEvaluaciones: MisEvaluacionesRespuestaDTO;
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
  const [misEvaluaciones, setMisEvaluaciones] = useState<MisEvaluacionesRespuestaDTO>(
    getDefaultEvaluationsStructure()
  );
  const [cargando, setCargando] = useState<boolean>(true); // Start as true
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluaciones = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      console.log(`🔍 Obteniendo mis evaluaciones... (${Date.now()})`);
      const response = await servicioEvaluaciones.obtenerMisEvaluaciones();
      console.log("✅ Datos procesados en hook:", JSON.stringify(response, null, 2));
      setMisEvaluaciones({
        as_employee: response.as_employee ?? { evaluations: [], summary: { total: 0, completed: 0, pending: 0 } },
        as_evaluator: response.as_evaluator ?? { evaluations: [], summary: { total: 0, completed: 0, pending_to_evaluate: 0 } },
      });
    } catch (err: unknown) {
      console.error("❌ Error al obtener evaluaciones:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al cargar las evaluaciones";
      setError(errorMessage);
      setMisEvaluaciones(getDefaultEvaluationsStructure());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    console.log("🔄 Montando hook de evaluaciones...");
    let isMounted = true;
    fetchEvaluaciones().then(() => {
      if (!isMounted) {
        console.log("🛑 Component unmounted, skipping state update");
      }
    });
    return () => {
      isMounted = false;
      console.log("🛑 Hook unmounted");
    };
  }, [fetchEvaluaciones]);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  const obtenerEvaluacionesPorModo = useCallback(
    (modo: "evaluador" | "empleado"): ResumenEvaluacionDTO[] => {
      console.log(`📋 Obteniendo evaluaciones para modo ${modo}...`);
      const evaluaciones =
        modo === "evaluador"
          ? misEvaluaciones.as_evaluator?.evaluations ?? []
          : misEvaluaciones.as_employee?.evaluations ?? [];
      console.log(`📋 Evaluaciones para modo ${modo}:`, evaluaciones.map(e => ({ id: e.id, employee_name: e.employee_name, status: e.status })));
      return evaluaciones;
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