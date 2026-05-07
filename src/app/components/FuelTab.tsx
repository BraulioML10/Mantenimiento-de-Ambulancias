import { useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  BarChart3,
  Download,
  Gauge,
  Search,
  SortDesc,
  Truck,
  X,
} from "lucide-react"
import {
  useAmbulances,
  type Ambulance,
  type AmbulanceStatus,
} from "../AmbulanceContext"

type SortOption =
  | "mayor_necesidad"
  | "mayor_uso"
  | "menor_faltante"
  | "mayor_kilometraje_total"
  | "menor_kilometraje_total"
  | "mayor_recorrido_sin_mantencion"

export function FuelTab() {
  const {
    ambulances,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getProgressPercentage,
    getEstadoCalculado,
    formatKm,
    statusConfig,
  } = useAmbulances()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AmbulanceStatus | "todos">("todos")
  const [sortOption, setSortOption] = useState<SortOption>("mayor_necesidad")
  const [showCriticalUnits, setShowCriticalUnits] = useState(false)

  const totalFlota = ambulances.length

  const mantencionRequerida = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_preventiva"
  )

  const proximasMantencion = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "proxima_mantencion"
  )

  const usoPromedio = Math.round(
    ambulances.reduce((sum, ambulance) => sum + getUsoDesdeMantencion(ambulance), 0) /
      Math.max(ambulances.length, 1)
  )

  const mayorUso = Math.max(
    ...ambulances.map((ambulance) => getUsoDesdeMantencion(ambulance)),
    0
  )

  const getStatusPriority = (ambulance: Ambulance) => {
    const status = getEstadoCalculado(ambulance)

    switch (status) {
      case "mantencion_preventiva":
        return 0
      case "proxima_mantencion":
        return 1
      case "mantencion_correctiva":
        return 2
      case "fuera_servicio":
        return 3
      case "operativa":
        return 4
      default:
        return 5
    }
  }

  const filteredAndSortedAmbulances = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    const filtered = ambulances.filter((ambulance) => {
      const estadoCalculado = getEstadoCalculado(ambulance)
      const estadoTexto = statusConfig[estadoCalculado].label.toLowerCase()

      const coincideBusqueda =
        !term ||
        ambulance.id.toLowerCase().includes(term) ||
        ambulance.patente.toLowerCase().includes(term) ||
        ambulance.base.toLowerCase().includes(term) ||
        ambulance.modelo.toLowerCase().includes(term) ||
        estadoTexto.includes(term)

      const coincideEstado =
        statusFilter === "todos" || estadoCalculado === statusFilter

      return coincideBusqueda && coincideEstado
    })

    return [...filtered].sort((a, b) => {
      const estadoA = getEstadoCalculado(a)
      const estadoB = getEstadoCalculado(b)

      switch (sortOption) {
        case "mayor_necesidad": {
          const prioridad = getStatusPriority(a) - getStatusPriority(b)
          if (prioridad !== 0) return prioridad
          return getKmFaltantes(a) - getKmFaltantes(b)
        }

        case "mayor_uso":
          return getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a)

        case "menor_faltante":
          return getKmFaltantes(a) - getKmFaltantes(b)

        case "mayor_kilometraje_total":
          return b.kilometrajeActual - a.kilometrajeActual

        case "menor_kilometraje_total":
          return a.kilometrajeActual - b.kilometrajeActual

        case "mayor_recorrido_sin_mantencion": {
          const aSinMantencion =
            estadoA === "operativa" || estadoA === "proxima_mantencion"
          const bSinMantencion =
            estadoB === "operativa" || estadoB === "proxima_mantencion"

          if (aSinMantencion !== bSinMantencion) {
            return Number(bSinMantencion) - Number(aSinMantencion)
          }

          return getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a)
        }

        default:
          return 0
      }
    })
  }, [
    ambulances,
    searchTerm,
    statusFilter,
    sortOption,
    getEstadoCalculado,
    getKmFaltantes,
    getUsoDesdeMantencion,
    statusConfig,
  ])

  const estadoResumen = useMemo(() => {
    const estados: AmbulanceStatus[] = [
      "operativa",
      "proxima_mantencion",
      "mantencion_preventiva",
      "mantencion_correctiva",
      "fuera_servicio",
    ]

    return estados.map((status) => ({
      status,
      label: statusConfig[status].label,
      count: ambulances.filter(
        (ambulance) => getEstadoCalculado(ambulance) === status
      ).length,
      color: statusConfig[status].progressClass,
      badgeClass: statusConfig[status].badgeClass,
    }))
  }, [ambulances, getEstadoCalculado, statusConfig])

  const maxEstadoCount = Math.max(...estadoResumen.map((item) => item.count), 1)

  const topUsoDesdeMantencion = useMemo(() => {
    return [...ambulances]
      .sort((a, b) => getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a))
      .slice(0, 5)
  }, [ambulances, getUsoDesdeMantencion])

  const proximasACumplirPauta = useMemo(() => {
    return [...ambulances]
      .filter((ambulance) => {
        const faltantes = getKmFaltantes(ambulance)
        const estado = getEstadoCalculado(ambulance)

        return (
          faltantes > 0 &&
          (estado === "operativa" || estado === "proxima_mantencion")
        )
      })
      .sort((a, b) => getKmFaltantes(a) - getKmFaltantes(b))
      .slice(0, 5)
  }, [ambulances, getKmFaltantes, getEstadoCalculado])

  const maxTopUso = Math.max(
    ...topUsoDesdeMantencion.map((ambulance) => getUsoDesdeMantencion(ambulance)),
    1
  )

  const limpiarFiltros = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setSortOption("mayor_necesidad")
  }

  const exportarReporteKilometraje = () => {
    const headers = [
      "Código",
      "Patente",
      "Base",
      "Kilometraje total",
      "Uso desde última mantención",
      "Pauta preventiva",
      "Faltan para próxima mantención",
      "Avance preventivo",
      "Estado",
      "Última actualización",
    ]

    const rows = filteredAndSortedAmbulances.map((ambulance) => {
      const estado = statusConfig[getEstadoCalculado(ambulance)].label

      return [
        ambulance.id,
        ambulance.patente,
        ambulance.base,
        ambulance.kilometrajeActual,
        getUsoDesdeMantencion(ambulance),
        ambulance.pautaPreventivaKm,
        getKmFaltantes(ambulance),
        `${Math.round(getProgressPercentage(ambulance))}%`,
        estado,
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
    link.download = "reporte_kilometraje_preventivo_ssvq.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderProgressBar = (ambulance: Ambulance) => {
    const progress = getProgressPercentage(ambulance)
    const estado = getEstadoCalculado(ambulance)
    const config = statusConfig[estado]

    return (
      <div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full ${config.progressClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs font-inter text-gray-500">
          <span>Avance</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    )
  }

  const renderStatusButton = (value: AmbulanceStatus | "todos", label: string) => (
    <Button
      variant={statusFilter === value ? "default" : "outline"}
      size="sm"
      className="font-inter"
      onClick={() => setStatusFilter(value)}
    >
      {label}
    </Button>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Control de Kilometraje Preventivo
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Monitoreo del kilometraje total, uso acumulado desde la última mantención y kilómetros faltantes para alcanzar la pauta preventiva configurada.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="font-inter"
            onClick={() => setShowCriticalUnits(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Ver unidades críticas
          </Button>

          <Button className="font-inter" onClick={exportarReporteKilometraje}>
            <Download className="w-4 h-4 mr-2" />
            Exportar reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Flota monitoreada</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {totalFlota}
          </p>
          <p className="text-xs font-inter text-blue-700">
            Ambulancias con control de km
          </p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">Mantención requerida</p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {mantencionRequerida.length}
          </p>
          <p className="text-xs font-inter text-red-700">
            Superan pauta configurada
          </p>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm font-inter text-amber-700">Próximas</p>
          <p className="text-3xl font-inter font-bold text-amber-900">
            {proximasMantencion.length}
          </p>
          <p className="text-xs font-inter text-amber-700">
            Requieren seguimiento
          </p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Uso promedio</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {formatKm(usoPromedio)}
          </p>
          <p className="text-xs font-inter text-green-700">
            Desde última mantención
          </p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">Mayor uso acumulado</p>
          <p className="text-3xl font-inter font-bold text-gray-900">
            {formatKm(mayorUso)}
          </p>
          <p className="text-xs font-inter text-gray-700">
            Máximo registrado
          </p>
        </Card>
      </div>

      {mantencionRequerida.length > 0 && (
        <Card className="p-5 bg-red-50 border-red-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div>
                <h2 className="font-inter font-bold text-red-900">
                  Alerta por kilometraje preventivo
                </h2>
                <p className="text-sm font-inter text-red-700 mt-1">
                  {mantencionRequerida.length} ambulancia(s) alcanzaron o superaron la pauta preventiva configurada. Se recomienda priorizar su programación de mantención.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="font-inter"
              onClick={() => setShowCriticalUnits(true)}
            >
              Revisar unidades
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Distribución por estado
            </h2>
          </div>

          <div className="space-y-4">
            {estadoResumen.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${item.badgeClass} font-inter`}>
                      {item.label}
                    </Badge>
                  </div>
                  <span className="text-sm font-inter font-semibold text-gray-700">
                    {item.count}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.count / maxEstadoCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Top 5 por uso desde mantención
            </h2>
          </div>

          <div className="space-y-4">
            {topUsoDesdeMantencion.map((ambulance) => {
              const uso = getUsoDesdeMantencion(ambulance)
              const width = (uso / maxTopUso) * 100

              return (
                <div key={ambulance.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-inter font-semibold text-gray-900">
                        {ambulance.id}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        {ambulance.patente}
                      </p>
                    </div>
                    <p className="text-sm font-inter font-semibold text-gray-700">
                      {formatKm(uso)}
                    </p>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        statusConfig[getEstadoCalculado(ambulance)].progressClass
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <SortDesc className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Próximas a cumplir pauta preventiva
            </h2>
          </div>

          <div className="space-y-4">
            {proximasACumplirPauta.map((ambulance) => {
              const faltantes = getKmFaltantes(ambulance)
              const avance = getProgressPercentage(ambulance)

              return (
                <div key={ambulance.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-inter font-semibold text-gray-900">
                        {ambulance.id}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        {ambulance.patente}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-inter font-semibold text-gray-700">
                        Faltan {formatKm(faltantes)}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        Avance {Math.round(avance)}%
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        statusConfig[getEstadoCalculado(ambulance)].progressClass
                      }`}
                      style={{ width: `${avance}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {proximasACumplirPauta.length === 0 && (
              <p className="text-sm font-inter text-gray-500">
                No hay ambulancias próximas a cumplir la pauta preventiva.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por código, patente, base o modelo..."
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
            <option value="proxima_mantencion">Próxima a mantención</option>
            <option value="mantencion_preventiva">Mantención requerida</option>
            <option value="mantencion_correctiva">Correctiva reportada</option>
            <option value="fuera_servicio">Fuera de servicio</option>
          </select>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
          >
            <option value="mayor_necesidad">Mayor necesidad de mantención</option>
            <option value="mayor_uso">Mayor uso desde última mantención</option>
            <option value="menor_faltante">Menor kilometraje faltante</option>
            <option value="mayor_kilometraje_total">Mayor kilometraje total</option>
            <option value="menor_kilometraje_total">Menor kilometraje total</option>
            <option value="mayor_recorrido_sin_mantencion">
              Mayor recorrido sin mantención requerida
            </option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {renderStatusButton("todos", "Todas")}
          {renderStatusButton("operativa", "Operativas")}
          {renderStatusButton("proxima_mantencion", "Próximas")}
          {renderStatusButton("mantencion_preventiva", "Mantención requerida")}
          {renderStatusButton("mantencion_correctiva", "Correctivas")}
          {renderStatusButton("fuera_servicio", "Fuera de servicio")}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm font-inter text-gray-600">
            Mostrando {filteredAndSortedAmbulances.length} de {totalFlota} ambulancias
          </p>

          {(searchTerm || statusFilter !== "todos" || sortOption !== "mayor_necesidad") && (
            <Button
              variant="outline"
              size="sm"
              className="font-inter"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-inter">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Móvil</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Patente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Base</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Km total</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Uso desde mantención</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Pauta preventiva</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Faltan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Avance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Actualización</th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedAmbulances.map((ambulance) => {
                const estado = getEstadoCalculado(ambulance)
                const config = statusConfig[estado]
                const uso = getUsoDesdeMantencion(ambulance)
                const faltantes = getKmFaltantes(ambulance)

                return (
                  <tr key={ambulance.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {ambulance.id}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{ambulance.patente}</td>
                    <td className="px-4 py-3 text-gray-700">{ambulance.base}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatKm(ambulance.kilometrajeActual)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatKm(uso)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatKm(ambulance.pautaPreventivaKm)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatKm(faltantes)}
                    </td>

                    <td className="px-4 py-3 min-w-[180px]">
                      {renderProgressBar(ambulance)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge className={`${config.badgeClass} font-inter`}>
                        {config.shortLabel}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {ambulance.lastUpdate} hrs
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredAndSortedAmbulances.length === 0 && (
            <div className="p-8 text-center text-sm font-inter text-gray-500">
              No se encontraron ambulancias con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      {showCriticalUnits && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 bg-white border border-red-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>

                <div>
                  <h2 className="text-xl font-inter font-bold text-red-900">
                    Unidades críticas por kilometraje
                  </h2>
                  <p className="text-sm font-inter text-red-700 mt-1">
                    Ambulancias que alcanzaron o superaron la pauta preventiva configurada.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCriticalUnits(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mantencionRequerida.map((ambulance) => {
                const uso = getUsoDesdeMantencion(ambulance)
                const faltantes = getKmFaltantes(ambulance)
                const estado = getEstadoCalculado(ambulance)

                return (
                  <Card key={ambulance.id} className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-inter font-bold text-red-900">
                          {ambulance.id} ({ambulance.patente})
                        </h3>
                        <p className="text-xs font-inter text-red-700">
                          {ambulance.base}
                        </p>
                      </div>

                      <Badge className={`${statusConfig[estado].badgeClass} font-inter`}>
                        {statusConfig[estado].shortLabel}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm font-inter">
                      <div className="flex justify-between">
                        <span className="text-red-700">Kilometraje total</span>
                        <span className="font-semibold text-red-900">
                          {formatKm(ambulance.kilometrajeActual)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-red-700">Uso desde mantención</span>
                        <span className="font-semibold text-red-900">
                          {formatKm(uso)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-red-700">Pauta preventiva</span>
                        <span className="font-semibold text-red-900">
                          {formatKm(ambulance.pautaPreventivaKm)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-red-700">Faltan para mantención</span>
                        <span className="font-semibold text-red-900">
                          {formatKm(faltantes)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      {renderProgressBar(ambulance)}
                    </div>
                  </Card>
                )
              })}
            </div>

            {mantencionRequerida.length === 0 && (
              <div className="p-8 text-center text-sm font-inter text-gray-500">
                No hay unidades críticas por kilometraje preventivo.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}