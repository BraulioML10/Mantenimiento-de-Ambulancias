import { useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Calendar,
  CheckCircle,
  Eye,
  Gauge,
  Search,
  Wrench,
} from "lucide-react"
import { useAmbulances, type AmbulanceStatus } from "../AmbulanceContext"

export function SimplifiedDashboard() {
  const {
    ambulances,
    isLoading,
    error,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getProgressPercentage,
    getEstadoCalculado,
    formatKm,
    statusConfig,
  } = useAmbulances()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AmbulanceStatus | "todos">("todos")
  const [showCriticalUnits, setShowCriticalUnits] = useState(false)
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null)

  const selectedAmbulance = ambulances.find((ambulance) => ambulance.id === selectedAmbulanceId)

  const totalFlota = ambulances.length
  const operativas = ambulances.filter((a) => getEstadoCalculado(a) === "operativa").length
  const proximas = ambulances.filter((a) => getEstadoCalculado(a) === "proxima_mantencion").length
  const preventivas = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_preventiva").length
  const correctivas = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_correctiva").length
  const fueraServicio = ambulances.filter((a) => getEstadoCalculado(a) === "fuera_servicio").length

  const criticalAmbulances = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_preventiva"
  )

  const filteredAmbulances = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return ambulances.filter((ambulance) => {
      const estadoCalculado = getEstadoCalculado(ambulance)
      const estadoTexto = statusConfig[estadoCalculado].label.toLowerCase()

      const matchesSearch =
        !term ||
        ambulance.id.toLowerCase().includes(term) ||
        ambulance.patente.toLowerCase().includes(term) ||
        ambulance.base.toLowerCase().includes(term) ||
        ambulance.modelo.toLowerCase().includes(term) ||
        estadoTexto.includes(term)

      const matchesStatus = statusFilter === "todos" || estadoCalculado === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [ambulances, searchTerm, statusFilter, getEstadoCalculado, statusConfig])

  const getProgressColor = (status: AmbulanceStatus) => {
    return statusConfig[status].progressClass
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-6 border border-gray-200">
          <p className="text-sm font-inter text-gray-600">
            Cargando información de la flota...
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
            No fue posible cargar la información de ambulancias: {error}
          </p>
        </Card>
      </div>
    )
  }

  if (selectedAmbulance) {
    const estadoCalculado = getEstadoCalculado(selectedAmbulance)
    const usoDesdeMantencion = getUsoDesdeMantencion(selectedAmbulance)
    const kmFaltantes = getKmFaltantes(selectedAmbulance)
    const progress = getProgressPercentage(selectedAmbulance)

    return (
      <div className="p-6 space-y-6">
        <Button
          variant="outline"
          className="font-inter"
          onClick={() => setSelectedAmbulanceId(null)}
        >
          Volver al inicio
        </Button>

        <Card className="p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-inter font-bold text-gray-900">
                Detalle de ambulancia {selectedAmbulance.id}
              </h2>
              <p className="text-sm font-inter text-gray-600">
                Información general, estado preventivo y control de kilometraje.
              </p>
            </div>

            <Badge className={`${statusConfig[estadoCalculado].badgeClass} font-inter`}>
              {statusConfig[estadoCalculado].label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Código</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {selectedAmbulance.id}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Patente</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {selectedAmbulance.patente}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Base</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {selectedAmbulance.base}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Marca / modelo</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {selectedAmbulance.modelo}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">Kilometraje total</p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {formatKm(selectedAmbulance.kilometrajeActual)}
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
                Faltan para próxima mantención
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {formatKm(kmFaltantes)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-inter text-gray-500">
                Última actualización
              </p>
              <p className="text-lg font-inter font-bold text-gray-900">
                {selectedAmbulance.lastUpdate} hrs
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-inter mb-2">
              <span className="text-gray-600">Avance preventivo</span>
              <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(estadoCalculado)}`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-blue-700" />
            </div>

            <div>
              <h1 className="text-2xl font-inter font-bold text-gray-900">
                Gestión de Mantenimiento Preventivo SAMU - SSVQ
              </h1>
              <p className="text-sm font-inter text-gray-700 mt-1">
                Sistema de gestión para control de kilometraje, mantenciones,
                usuarios y registros QR.
              </p>
            </div>
          </div>

          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-inter">
            Integración con base de datos
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-blue-700">Flota monitoreada</p>
              <p className="text-3xl font-inter font-bold text-blue-900">{totalFlota}</p>
              <p className="text-xs font-inter text-blue-700">Ambulancias en seguimiento</p>
            </div>
            <Gauge className="w-7 h-7 text-blue-600" />
          </div>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-green-700">Operativas</p>
              <p className="text-3xl font-inter font-bold text-green-900">{operativas}</p>
              <p className="text-xs font-inter text-green-700">Disponibles para servicio</p>
            </div>
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-amber-700">Próximas</p>
              <p className="text-3xl font-inter font-bold text-amber-900">{proximas}</p>
              <p className="text-xs font-inter text-amber-700">Requieren monitoreo preventivo</p>
            </div>
            <Calendar className="w-7 h-7 text-amber-600" />
          </div>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-red-700">Mantención requerida</p>
              <p className="text-3xl font-inter font-bold text-red-900">{preventivas}</p>
              <p className="text-xs font-inter text-red-700">Superan la pauta configurada</p>
            </div>
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
        </Card>

        <Card className="p-5 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-orange-700">Correctivas</p>
              <p className="text-3xl font-inter font-bold text-orange-900">{correctivas}</p>
              <p className="text-xs font-inter text-orange-700">Incidencias reportadas</p>
            </div>
            <Wrench className="w-7 h-7 text-orange-600" />
          </div>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-700">Fuera de servicio</p>
              <p className="text-3xl font-inter font-bold text-gray-900">{fueraServicio}</p>
              <p className="text-xs font-inter text-gray-700">No disponibles</p>
            </div>
            <Activity className="w-7 h-7 text-gray-600" />
          </div>
        </Card>
      </div>

      {preventivas > 0 && (
        <Card className="p-5 bg-red-50 border-red-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div>
                <h2 className="text-base font-inter font-bold text-red-900">
                  Alerta de mantención preventiva
                </h2>
                <p className="text-sm font-inter text-red-700">
                  {preventivas} ambulancia(s) requieren programación de mantención según la pauta preventiva configurada por kilometraje.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="font-inter bg-white"
              onClick={() => setShowCriticalUnits((prev) => !prev)}
            >
              {showCriticalUnits ? "Ocultar unidades críticas" : "Ver unidades críticas"}
            </Button>
          </div>

          {showCriticalUnits && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
              {criticalAmbulances.map((ambulance) => (
                <button
                  key={ambulance.id}
                  onClick={() => setSelectedAmbulanceId(ambulance.id)}
                  className="text-left rounded-xl border border-red-200 bg-white p-4 hover:bg-red-50 transition-colors"
                >
                  <p className="font-inter font-bold text-gray-900">
                    {ambulance.id} · {ambulance.patente}
                  </p>
                  <p className="text-sm font-inter text-gray-600">
                    {ambulance.base}
                  </p>
                  <p className="text-sm font-inter text-red-700 mt-1">
                    Uso: {formatKm(getUsoDesdeMantencion(ambulance))}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-inter font-bold text-gray-900">
              Flota total de ambulancias SAMU
            </h2>
            <p className="text-sm font-inter text-gray-600">
              Visualización general de unidades monitoreadas. El detalle completo se encuentra en el botón Ver.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative lg:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por código, patente, base o marca/modelo..."
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
        </div>

        <p className="text-sm font-inter text-gray-600 mb-4">
          Mostrando {filteredAmbulances.length} de {totalFlota} ambulancias
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAmbulances.map((ambulance) => {
            const estadoCalculado = getEstadoCalculado(ambulance)
            const config = statusConfig[estadoCalculado]
            const progress = getProgressPercentage(ambulance)

            return (
              <Card key={ambulance.id} className="p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ambulance className="w-5 h-5 text-red-600" />
                      <h3 className="font-inter font-bold text-gray-900">
                        {ambulance.id}
                      </h3>
                    </div>

                    <p className="text-sm font-inter text-gray-600 mt-1">
                      {ambulance.patente}
                    </p>

                    <p className="text-sm font-inter text-gray-500 mt-1 line-clamp-1">
                      {ambulance.modelo}
                    </p>
                  </div>

                  <Badge className={`${config.badgeClass} font-inter`}>
                    {config.shortLabel}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-inter">
                    <span className="text-gray-600">Km total</span>
                    <span className="font-semibold text-gray-900">
                      {formatKm(ambulance.kilometrajeActual)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-inter">
                    <span className="text-gray-600">Uso mantención</span>
                    <span className="font-semibold text-gray-900">
                      {formatKm(getUsoDesdeMantencion(ambulance))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-inter">
                    <span className="text-gray-600">Faltan</span>
                    <span className="font-semibold text-gray-900">
                      {formatKm(getKmFaltantes(ambulance))}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(estadoCalculado)}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  <p className="text-xs font-inter text-gray-500 mt-1">
                    {Math.round(progress)}% de avance preventivo
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 font-inter"
                  onClick={() => setSelectedAmbulanceId(ambulance.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
              </Card>
            )
          })}
        </div>

        {filteredAmbulances.length === 0 && (
          <div className="p-8 text-center text-sm font-inter text-gray-500">
            No se encontraron ambulancias con los filtros aplicados.
          </div>
        )}
      </Card>
    </div>
  )
}