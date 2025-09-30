import { useState, useCallback } from "react";

interface RetornoUseFiltrosEvaluaciones {
  terminoBusqueda: string;
  filtroEstado: "pending" | "completed" | "todos";
  establecerTerminoBusqueda: (termino: string) => void;
  establecerFiltroEstado: (estado: "pending" | "completed" | "todos") => void;
}

export const useFiltrosEvaluaciones = (): RetornoUseFiltrosEvaluaciones => {
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<"pending" | "completed" | "todos">("pending");

  const establecerTerminoBusqueda = useCallback((termino: string) => {
    console.log("🔍 Actualizando término de búsqueda:", termino);
    setTerminoBusqueda(termino);
  }, []);

  const establecerFiltroEstado = useCallback((estado: "pending" | "completed" | "todos") => {
    console.log("🔄 Actualizando filtro de estado:", estado);
    setFiltroEstado(estado);
  }, []);

  return {
    terminoBusqueda,
    filtroEstado,
    establecerTerminoBusqueda,
    establecerFiltroEstado,
  };
};