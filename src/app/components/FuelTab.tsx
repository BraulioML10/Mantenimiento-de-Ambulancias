import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  Gauge,
  Search,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react"
import {
  useAmbulances,
  type Ambulance,
  type AmbulanceStatus,
  type PreventiveAlertStatus,
} from "../AmbulanceContext"
import { supabase } from "../../lib/supabaseClient"

type SortOption =
  | "codigo"
  | "mayor_uso"
  | "mayor_necesidad"
  | "menor_necesidad"
  | "mayor_km_total"

interface FuelTabProps {
  onRequestMaintenance?: (
    ambulanceCode: string,
    type: "preventiva" | "correctiva"
  ) => void
}

export function FuelTab({ onRequestMaintenance }: FuelTabProps) {
  const {
    ambulances,
    isLoading,
    error,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getProgressPercentage,
    getEstadoCalculado,
    getAlertaPreventiva,
    formatKm,
    statusConfig,
    preventiveAlertConfig,
  } = useAmbulances()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AmbulanceStatus | "todos">("todos")
  const [alertFilter, setAlertFilter] = useState<PreventiveAlertStatus | "todos">("todos")
  const [sortOption, setSortOption] = useState<SortOption>("mayor_necesidad")
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null)
  const [activeMaintenanceCodes, setActiveMaintenanceCodes] = useState<Set<string>>(
    new Set()
  )

  const selectedAmbulance = ambulances.find(
    (ambulance) => ambulance.id === selectedAmbulanceId
  )

  useEffect(() => {
    const loadActiveMaintenances = async () => {
      const { data } = await supabase
        .from("maintenance_records")
        .select("ambulance_code")
        .in("status", ["programada", "en_taller", "esperando_repuesto"])

      setActiveMaintenanceCodes(
        new Set((data || []).map((item) => item.ambulance_code as string))
      )
    }

    loadActiveMaintenances()
  }, [])

  const totalFlota = ambulances.length

  const proximas = ambulances.filter(
    (ambulance) => getAlertaPreventiva(ambulance) === "proxima_mantencion"
  ).length

  const requeridas = ambulances.filter(
    (ambulance) =>
      getAlertaPreventiva(ambulance) === "mantencion_preventiva_requerida"
  ).length

  const sinAlerta = ambulances.filter(
    (ambulance) => getAlertaPreventiva(ambulance) === "sin_alerta"
  ).length

  const promedioUso =
    ambulances.length > 0
      ? Math.round(
          ambulances.reduce(
            (sum, ambulance) => sum + getUsoDesdeMantencion(ambulance),
            0
          ) / ambulances.length
        )
      : 0

  const topNecesidad = useMemo(() => {
    return [...ambulances]
      .sort((a, b) => {
        const alertaA = getAlertaPreventiva(a)
        const alertaB = getAlertaPreventiva(b)

        const pesoA =
          alertaA === "mantencion_preventiva_requerida"
            ? 3
            : alertaA === "proxima_mantencion"
              ? 2
              : 1

        const pesoB =
          alertaB === "mantencion_preventiva_requerida"
            ? 3
            : alertaB === "proxima_mantencion"
              ? 2
              : 1

        if (pesoA !== pesoB) return pesoB - pesoA

        return getKmFaltantes(a) - getKmFaltantes(b)
      })
      .slice(0, 8)
  }, [ambulances, getAlertaPreventiva, getKmFaltantes])

  const filteredAmbulances = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    const filtered = ambulances.filter((ambulance) => {
      const estadoOperativo = getEstadoCalculado(ambulance)
      const alertaPreventiva = getAlertaPreventiva(ambulance)

      const estadoTexto = statusConfig[estadoOperativo].label.toLowerCase()
      const alertaTexto = preventiveAlertConfig[alertaPreventiva].label.toLowerCase()

      const matchesSearch =
        !term ||
        ambulance.id.toLowerCase().includes(term) ||
        ambulance.patente.toLowerCase().includes(term) ||
        ambulance.base.toLowerCase().includes(term) ||
        ambulance.modelo.toLowerCase().includes(term) ||
        estadoTexto.includes(term) ||
        alertaTexto.includes(term)

      const matchesStatus =
        statusFilter === "todos" || estadoOperativo === statusFilter

      const matchesAlert =
        alertFilter === "todos" || alertaPreventiva === alertFilter

      return matchesSearch && matchesStatus && matchesAlert
    })

    return filtered.sort((a, b) => {
      if (sortOption === "codigo") {
        return a.id.localeCompare(b.id, "es-CL", { numeric: true })
      }

      if (sortOption === "mayor_uso") {
        return getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a)
      }

      if (sortOption === "menor_necesidad") {
        return getKmFaltantes(b) - getKmFaltantes(a)
      }

      if (sortOption === "mayor_km_total") {
        return b.kilometrajeActual - a.kilometrajeActual
      }

      const alertaA = getAlertaPreventiva(a)
      const alertaB = getAlertaPreventiva(b)

      const pesoA =
        alertaA === "mantencion_preventiva_requerida"
          ? 3
          : alertaA === "proxima_mantencion"
            ? 2
            : 1

      const pesoB =
        alertaB === "mantencion_preventiva_requerida"
          ? 3
          : alertaB === "proxima_mantencion"
            ? 2
            : 1

      if (pesoA !== pesoB) return pesoB - pesoA

      return getKmFaltantes(a) - getKmFaltantes(b)
    })
  }, [
    ambulances,
    searchTerm,
    statusFilter,
    alertFilter,
    sortOption,
    getEstadoCalculado,
    getAlertaPreventiva,
    getUsoDesdeMantencion,
    getKmFaltantes,
    statusConfig,
    preventiveAlertConfig,
  ])

  const limpiarFiltros = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setAlertFilter("todos")
    setSortOption("mayor_necesidad")
  }

  const exportToCsv = () => {
    const headers = [
      "Código móvil",
      "Patente",
      "Base",
      "Modelo",
      "Estado operativo",
      "Alerta preventiva",
      "Kilometraje total actual",
      "Uso desde última mantención",
      "Pauta preventiva de mantención",
      "Faltan para próxima mantención",
      "Avance preventivo",
      "Última actualización",
    ]

    const rows = filteredAmbulances.map((ambulance) => {
      const estadoOperativo = getEstadoCalculado(ambulance)
      const alertaPreventiva = getAlertaPreventiva(ambulance)

      return [
        ambulance.id,
        ambulance.patente,
        ambulance.base,
        ambulance.modelo,
        statusConfig[estadoOperativo].label,
        preventiveAlertConfig[alertaPreventiva].label,
        ambulance.kilometrajeActual,
        getUsoDesdeMantencion(ambulance),
        ambulance.pautaPreventivaKm,
        getKmFaltantes(ambulance),
        `${Math.round(getProgressPercentage(ambulance))}%`,
        ambulance.lastUpdate,
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n")

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "control_kilometraje_ambulancias.csv"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const renderAmbulanceDetail = (ambulance: Ambulance) => {
    const estadoOperativo = getEstadoCalculado(ambulance)
    const alertaPreventiva = getAlertaPreventiva(ambulance)
    const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)
    const kmFaltantes = getKmFaltantes(ambulance)
    const progress = getProgressPercentage(ambulance)

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-inter font-bold text-gray-900">
                Control de kilometraje · {ambulance.id}
              </h2>
              <p className="text-sm font-inter text-gray-600">
                Información asociada a la unidad {ambulance.patente}.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAmbulanceId(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge className={`${statusConfig[estadoOperativo].badgeClass} font-inter`}>
              {statusConfig[estadoOperativo].label}
            </Badge>

            <Badge
              className={`${preventiveAlertConfig[alertaPreventiva].badgeClass} font-inter`}
            >
              {preventiveAlertConfig[alertaPreventiva].label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Código móvil</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {ambulance.id}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Patente</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {ambulance.patente}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Base</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {ambulance.base}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Modelo</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {ambulance.modelo}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">
                Kilometraje total actual
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {formatKm(ambulance.kilometrajeActual)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">
                Uso desde última mantención
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {formatKm(usoDesdeMantencion)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">
                Pauta preventiva de mantención
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                Cada {formatKm(ambulance.pautaPreventivaKm)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">
                Faltan para próxima mantención
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {formatKm(kmFaltantes)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-inter mb-2">
              <span className="text-gray-600">Avance preventivo por kilometraje</span>
              <span className="font-semibold text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full ${preventiveAlertConfig[alertaPreventiva].progressClass}`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>

            <p className="text-xs font-inter text-gray-500 mt-2">
              Última actualización registrada: {ambulance.lastUpdate} hrs
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-6 border border-gray-200">
          <p className="text-sm font-inter text-gray-600">
            Cargando información de kilometraje...
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border border-red-200 bg-red-50">
          <p className="text-sm font-inter text-red-700">
            No fue posible cargar la información de kilometraje: {error}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Control de Kilometraje
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Seguimiento global del kilometraje total, uso desde última mantención
            y avance preventivo de cada ambulancia.
          </p>
        </div>

        <Button variant="outline" className="font-inter" onClick={exportToCsv}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Flota total</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {totalFlota}
          </p>
          <p className="text-xs font-inter text-blue-700">
            Ambulancias registradas
          </p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Sin alerta</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {sinAlerta}
          </p>
          <p className="text-xs font-inter text-green-700">
            Dentro de margen preventivo
          </p>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm font-inter text-amber-700">
            Próximas a mantención
          </p>
          <p className="text-3xl font-inter font-bold text-amber-900">
            {proximas}
          </p>
          <p className="text-xs font-inter text-amber-700">
            Se aproximan a la pauta
          </p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">
            Mantención requerida
          </p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {requeridas}
          </p>
          <p className="text-xs font-inter text-red-700">
            Superan la pauta preventiva
          </p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">
            Uso promedio
          </p>
          <p className="text-3xl font-inter font-bold text-gray-900">
            {promedioUso.toLocaleString("es-CL")}
          </p>
          <p className="text-xs font-inter text-gray-700">
            km desde última mantención
          </p>
        </Card>
      </div>

      {requeridas > 0 && (
        <Card className="p-5 bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <div>
              <h2 className="text-base font-inter font-bold text-red-900">
                Unidades con mantención preventiva requerida
              </h2>
              <p className="text-sm font-inter text-red-700">
                Existen {requeridas} ambulancia(s) que superan la pauta preventiva de mantención configurada.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 border border-gray-200 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Control por ambulancia
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por móvil, patente, base o modelo..."
                className="pl-10 font-inter"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AmbulanceStatus | "todos")
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
            >
              <option value="todos">Todos los estados</option>
              <option value="operativa">Operativa</option>
              <option value="mantencion_preventiva">
                En mantenimiento preventivo
              </option>
              <option value="mantencion_correctiva">
                En mantenimiento correctivo
              </option>
              <option value="fuera_servicio">Fuera de servicio</option>
            </select>

            <select
              value={alertFilter}
              onChange={(event) =>
                setAlertFilter(event.target.value as PreventiveAlertStatus | "todos")
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
            >
              <option value="todos">Todas las alertas</option>
              <option value="sin_alerta">Sin alerta</option>
              <option value="proxima_mantencion">Próxima a mantención</option>
              <option value="mantencion_preventiva_requerida">
                Mantención requerida
              </option>
            </select>

            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
            >
              <option value="mayor_necesidad">
                Mayor necesidad de mantención
              </option>
              <option value="menor_necesidad">
                Mayor margen disponible
              </option>
              <option value="mayor_uso">
                Mayor uso desde última mantención
              </option>
              <option value="mayor_km_total">
                Mayor kilometraje total
              </option>
              <option value="codigo">
                Orden por código móvil
              </option>
            </select>
          </div>

          {(searchTerm ||
            statusFilter !== "todos" ||
            alertFilter !== "todos" ||
            sortOption !== "mayor_necesidad") && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="font-inter"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {filteredAmbulances.map((ambulance) => {
              const estadoOperativo = getEstadoCalculado(ambulance)
              const alertaPreventiva = getAlertaPreventiva(ambulance)
              const estadoConfig = statusConfig[estadoOperativo]
              const alertaConfig = preventiveAlertConfig[alertaPreventiva]
              const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)
              const kmFaltantes = getKmFaltantes(ambulance)
              const progress = getProgressPercentage(ambulance)

              return (
                <Card key={ambulance.id} className="p-3 border border-gray-200">
                  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.2fr_auto] gap-3 items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-red-600" />
                        <h3 className="text-sm font-inter font-bold text-gray-900">
                          {ambulance.id} · {ambulance.patente}
                        </h3>
                      </div>

                      <p className="text-xs font-inter text-gray-600 mt-1">
                        {ambulance.base}
                      </p>

                      <p className="text-xs font-inter text-gray-500">
                        {ambulance.modelo}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2">
                          <p className="text-[11px] font-inter text-gray-500">
                            Km total
                          </p>
                          <p className="text-xs font-inter font-bold text-gray-900">
                            {formatKm(ambulance.kilometrajeActual)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2">
                          <p className="text-[11px] font-inter text-gray-500">
                            Uso mantención
                          </p>
                          <p className="text-xs font-inter font-bold text-gray-900">
                            {formatKm(usoDesdeMantencion)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2">
                          <p className="text-[11px] font-inter text-gray-500">
                            Pauta preventiva
                          </p>
                          <p className="text-xs font-inter font-bold text-gray-900">
                            Cada {formatKm(ambulance.pautaPreventivaKm)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2">
                          <p className="text-[11px] font-inter text-gray-500">
                            Faltan
                          </p>
                          <p className="text-xs font-inter font-bold text-gray-900">
                            {formatKm(kmFaltantes)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-inter mb-1">
                          <span className="text-gray-600">
                            Avance preventivo
                          </span>
                          <span className="font-semibold text-gray-900">
                            {Math.round(progress)}%
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full ${alertaConfig.progressClass}`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex xl:flex-col items-start xl:items-end justify-between gap-2">
                      <div className="flex flex-wrap xl:justify-end gap-2">
                        <Badge className={`${estadoConfig.badgeClass} font-inter`}>
                          {estadoConfig.shortLabel}
                        </Badge>

                        <Badge className={`${alertaConfig.badgeClass} font-inter`}>
                          {alertaConfig.shortLabel}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="font-inter"
                        onClick={() => setSelectedAmbulanceId(ambulance.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>

                      <Button
                        size="sm"
                        className="font-inter"
                        variant={
                          activeMaintenanceCodes.has(ambulance.id)
                            ? "outline"
                            : "default"
                        }
                        disabled={activeMaintenanceCodes.has(ambulance.id)}
                        onClick={() =>
                          onRequestMaintenance?.(ambulance.id, "preventiva")
                        }
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        {activeMaintenanceCodes.has(ambulance.id)
                          ? "Mantencion programada"
                          : "MP"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}

            {filteredAmbulances.length === 0 && (
              <div className="p-8 text-center text-sm font-inter text-gray-500">
                No se encontraron ambulancias con los filtros aplicados.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Prioridad por kilometraje
            </h2>
          </div>

          <p className="text-sm font-inter text-gray-600 mb-4">
            Unidades ordenadas según necesidad preventiva y menor margen disponible.
          </p>

          <div className="space-y-4">
            {topNecesidad.map((ambulance) => {
              const alertaPreventiva = getAlertaPreventiva(ambulance)
              const alertaConfig = preventiveAlertConfig[alertaPreventiva]
              const progress = getProgressPercentage(ambulance)
              const kmFaltantes = getKmFaltantes(ambulance)

              return (
                <div key={ambulance.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-inter font-semibold text-gray-900">
                        {ambulance.id} · {ambulance.patente}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        Faltan {formatKm(kmFaltantes)}
                      </p>
                    </div>

                    <Badge className={`${alertaConfig.badgeClass} font-inter`}>
                      {alertaConfig.shortLabel}
                    </Badge>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${alertaConfig.progressClass}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-inter font-semibold text-blue-900">
                  Lectura del indicador
                </p>
                <p className="text-sm font-inter text-blue-800 mt-1">
                  El avance se calcula con el uso desde la última mantención sobre
                  la pauta preventiva definida para cada ambulancia.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {selectedAmbulance && renderAmbulanceDetail(selectedAmbulance)}
    </div>
  )
}
