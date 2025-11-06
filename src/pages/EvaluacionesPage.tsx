import React, { useState, useEffect } from "react";
import {
  User,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
  Eye,
  Play,
  Filter,
  Target,
} from "lucide-react";
import { useEvaluaciones } from "../hooks/useEvaluaciones";
import { useFiltrosEvaluaciones } from "../hooks/useFiltrosEvaluaciones";
import RealizarEvaluacionModal from "../components/RealizarEvaluacionModal";
import VerReporteEvaluacionModal from "../components/VerReporteEvaluacionModal";
import type { ResumenEvaluacionDTO } from "../types/evaluation";

const EvaluacionesPage: React.FC = () => {
  const {
    misEvaluaciones,
    cargando,
    error,
    limpiarError,
    obtenerEvaluacionesPorModo,
    refrescarEvaluaciones,
  } = useEvaluaciones();
  const {
    terminoBusqueda,
    filtroEstado,
    establecerTerminoBusqueda,
    establecerFiltroEstado,
  } = useFiltrosEvaluaciones();

  const [modalRealizarOpen, setModalRealizarOpen] = useState(false);
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<{
    id: number | null;
    data: ResumenEvaluacionDTO | null;
  }>({ id: null, data: null });

  // Initialize filter and clear search term
  useEffect(() => {
    establecerFiltroEstado("pending");
    establecerTerminoBusqueda("");
  }, [establecerFiltroEstado, establecerTerminoBusqueda]);

  const BadgeEstado: React.FC<{ estado: string }> = ({ estado }) => {
    const getEstadoConfig = (status: string) => {
      const statusLower = status.toLowerCase();
      switch (statusLower) {
        case "pending":
        case "pendiente":
        case "incomplete":
          return {
            color: "bg-amber-100 text-amber-800 border-amber-200",
            texto: "Pendiente",
          };
        case "completed":
        case "completada":
        case "completado":
        case "realizada":
          return {
            color: "bg-emerald-100 text-emerald-800 border-emerald-200",
            texto: "Completada",
          };
        case "overdue":
        case "vencida":
        case "vencido":
        case "atrasada":
        case "atrasado":
          return {
            color: "bg-rose-100 text-rose-800 border-rose-200",
            texto: "Vencida",
          };
        default:
          console.warn(`⚠️ Unrecognized status: ${status}`);
          return {
            color: "bg-gray-100 text-gray-800 border-gray-200",
            texto: `Desconocido (${status})`,
          };
      }
    };

    const config = getEstadoConfig(estado);
    return (
      <span
        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${config.color} transition-all duration-200`}
      >
        {config.texto}
      </span>
    );
  };

  const evaluacionesComoEvaluador = obtenerEvaluacionesPorModo("evaluador");

  // Derive pending count from evaluations if summary is unreliable
  const pendingCount = evaluacionesComoEvaluador.filter(
    (e) =>
      e.status.toLowerCase() === "pending" ||
      e.status.toLowerCase() === "pendiente" ||
      e.status.toLowerCase() === "incomplete"
  ).length;

  const evaluacionesEvaluadorFiltradas = evaluacionesComoEvaluador.filter(
    (evaluacion: ResumenEvaluacionDTO) => {
      const coincideBusqueda =
        evaluacion.employee_name
          ?.toLowerCase()
          .includes(terminoBusqueda.toLowerCase()) ||
        evaluacion.period_name
          ?.toLowerCase()
          .includes(terminoBusqueda.toLowerCase());
      const normalizedStatus = evaluacion.status
        .toLowerCase()
        .replace(/\s/g, "");
      const coincidenEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pending" &&
          (normalizedStatus === "pending" ||
            normalizedStatus === "pendiente" ||
            normalizedStatus === "incomplete" ||
            normalizedStatus === "pendiente_")) ||
        (filtroEstado === "completed" &&
          (normalizedStatus === "completed" ||
            normalizedStatus === "realizada"));
      if (!coincideBusqueda || !coincidenEstado) {
      }
      return coincideBusqueda && coincidenEstado;
    }
  );

  const handleRealizarEvaluacion = (evaluacionId: number): void => {
    setEvaluacionSeleccionada({ id: evaluacionId, data: null });
    setModalRealizarOpen(true);
  };

  const handleVerReporte = (evaluacionId: number): void => {
    const selectedEval = evaluacionesComoEvaluador.find(
      (evaluacion: ResumenEvaluacionDTO) => evaluacion.id === evaluacionId
    );
    setEvaluacionSeleccionada({ id: evaluacionId, data: selectedEval || null });
    setModalReporteOpen(true);
  };

  const handleEvaluacionCompletada = (): void => {
    refrescarEvaluaciones();
    setModalRealizarOpen(false);
    setEvaluacionSeleccionada({ id: null, data: null });
  };

  const handleReporteCerrado = (): void => {
    setModalReporteOpen(false);
    setEvaluacionSeleccionada({ id: null, data: null });
  };

  const handleToggleVerTodas = (): void => {
    establecerFiltroEstado(filtroEstado === "todos" ? "pending" : "todos");
  };

  const handleFilterTotal = (): void => {
    establecerFiltroEstado("todos");
  };

  const handleFilterPending = (): void => {
    establecerFiltroEstado("pending");
  };

  const handleFilterCompleted = (): void => {
    establecerFiltroEstado("completed");
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-col flex-grow mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg">
              <Target className="w-4 h-4 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sistema de Evaluaciones
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Gestión integral de evaluaciones al personal
              </p>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center flex-grow">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className="text-gray-600 text-sm font-medium">
                Cargando evaluaciones...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 flex items-center gap-3 shadow-sm max-w-2xl w-full">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-rose-800 font-semibold text-base">
                  Error al cargar las evaluaciones
                </p>
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
              <button
                onClick={limpiarError}
                className="text-rose-600 hover:text-rose-800 transition-colors p-2 rounded-full hover:bg-rose-100"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-grow space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de empleado o período..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    value={terminoBusqueda}
                    onChange={(e) => establecerTerminoBusqueda(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleToggleVerTodas}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                    filtroEstado === "todos"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:bg-green-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {filtroEstado === "todos"
                    ? "Mostrar Pendientes"
                    : filtroEstado === "completed"
                    ? "Mostrar Todas"
                    : "Ver Todas"}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Mostrando {evaluacionesEvaluadorFiltradas.length} de{" "}
                {evaluacionesComoEvaluador.length} evaluaciones
                {terminoBusqueda && ` (Buscando: "${terminoBusqueda}")`}
                {filtroEstado !== "todos" &&
                  ` (Filtro: ${
                    filtroEstado === "pending" ? "Pendientes" : "Completadas"
                  })`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={handleFilterTotal}
                className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer ${
                  filtroEstado === "todos" ? "ring-2 ring-indigo-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {evaluacionesComoEvaluador.length}
                    </p>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Asignadas
                    </p>
                  </div>
                </div>
              </div>
              <div
                onClick={handleFilterPending}
                className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer ${
                  filtroEstado === "pending" ? "ring-2 ring-amber-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pendingCount}
                    </p>
                    <p className="text-gray-600 text-sm font-medium">
                      Por Calificar
                    </p>
                  </div>
                </div>
              </div>
              <div
                onClick={handleFilterCompleted}
                className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer ${
                  filtroEstado === "completed" ? "ring-2 ring-emerald-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        evaluacionesComoEvaluador.filter(
                          (e) =>
                            e.status.toLowerCase() === "realizada" ||
                            e.status.toLowerCase() === "completed"
                        ).length
                      }
                    </p>
                    <p className="text-gray-600 text-sm font-medium">
                      Completadas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex-grow flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 font-sans">
                  Evaluaciones por Realizar (
                  {evaluacionesEvaluadorFiltradas.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Empleados que debes evaluar
                </p>
              </div>
              <div className="flex-grow overflow-y-auto min-h-[500px]">
                {evaluacionesEvaluadorFiltradas.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      No tienes evaluaciones{" "}
                      {filtroEstado === "pending"
                        ? "pendientes"
                        : filtroEstado === "completed"
                        ? "completadas"
                        : ""}{" "}
                      por realizar
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {evaluacionesEvaluadorFiltradas.map(
                      (evaluacion: ResumenEvaluacionDTO) => {
                        return (
                          <div
                            key={evaluacion.id}
                            className="p-6 hover:bg-gray-50 transition-all duration-200"
                          >
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
                                    <span>
                                      Período: {evaluacion.period_name}
                                    </span>
                                  </div>
                                  {evaluacion.completed_at && (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-gray-500" />
                                      <span>
                                        Completada:{" "}
                                        {new Date(
                                          evaluacion.completed_at
                                        ).toLocaleDateString("es-ES")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                {evaluacion.status.toLowerCase() ===
                                  "pending" ||
                                evaluacion.status.toLowerCase() ===
                                  "pendiente" ||
                                evaluacion.status.toLowerCase() ===
                                  "incomplete" ? (
                                  <button
                                    onClick={() =>
                                      handleRealizarEvaluacion(evaluacion.id)
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200"
                                  >
                                    <Play className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                      Calificar Ahora
                                    </span>
                                  </button>
                                ) : evaluacion.status.toLowerCase() ===
                                    "overdue" ||
                                  evaluacion.status.toLowerCase() ===
                                    "vencida" ||
                                  evaluacion.status.toLowerCase() ===
                                    "atrasada" ? (
                                  <button
                                    disabled
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed transition-all duration-200"
                                  >
                                    <Play className="w-4 h-4" />
                                    Vencida
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleVerReporte(evaluacion.id)
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Reporte
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            <RealizarEvaluacionModal
              show={modalRealizarOpen}
              evaluationId={evaluacionSeleccionada.id}
              onClose={() => {
                setModalRealizarOpen(false);
                setEvaluacionSeleccionada({ id: null, data: null });
              }}
              onComplete={handleEvaluacionCompletada}
            />

            <VerReporteEvaluacionModal
              show={modalReporteOpen}
              evaluationId={evaluacionSeleccionada.id}
              evaluation={evaluacionSeleccionada.data}
              onClose={handleReporteCerrado}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluacionesPage;
