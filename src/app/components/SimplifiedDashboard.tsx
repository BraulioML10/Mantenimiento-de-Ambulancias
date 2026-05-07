import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Gauge,
  Info,
  RadioTower,
  Save,
  Search,
  Truck,
  Wrench,
  X,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

type AmbulanceStatus =
  | "operativa"
  | "proxima_mantencion"
  | "mantencion_preventiva"
  | "mantencion_correctiva"
  | "fuera_servicio"

interface Ambulance {
  id: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometrajeActual: number
  kilometrajeUltimaMantencion: number
  pautaPreventivaKm: number
  lastUpdate: string
}

interface EditForm {
  originalId: string
  id: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometrajeActual: number
  usoDesdeMantencion: number
  kmFaltantes: number
}

interface PendingChange {
  original: Ambulance
  updated: Ambulance
  changes: string[]
}

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: ReactNode
  className: string
}

const initialAmbulances: Ambulance[] = [
  { id: "R-61", patente: "LVZP-22", base: "SAMU Base Quillota", modelo: "Mercedes-Benz Sprinter 2020", status: "operativa", kilometrajeActual: 45000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:42" },
  { id: "R-60", patente: "LVZP-20", base: "SAMU Base Quillota", modelo: "Ford Transit 2019", status: "proxima_mantencion", kilometrajeActual: 185000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:39" },
  { id: "R-62", patente: "LVZP-23", base: "SAMU Base Quillota", modelo: "Mercedes-Benz Sprinter 2018", status: "mantencion_preventiva", kilometrajeActual: 202000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:31" },
  { id: "R-63", patente: "LVZP-21", base: "SAMU Base Quillota", modelo: "Renault Master 2021", status: "operativa", kilometrajeActual: 67000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:36" },
  { id: "R-11", patente: "TDKZ-25", base: "SAMU Base Quintero", modelo: "Fiat Ducato 2019", status: "mantencion_correctiva", kilometrajeActual: 125000, kilometrajeUltimaMantencion: 50000, pautaPreventivaKm: 100000, lastUpdate: "15:44" },
  { id: "R-12", patente: "HZHC-30", base: "SAMU Base Quintero", modelo: "Mercedes-Benz Sprinter 2017", status: "fuera_servicio", kilometrajeActual: 310000, kilometrajeUltimaMantencion: 200000, pautaPreventivaKm: 100000, lastUpdate: "14:58" },
  { id: "R-13", patente: "HZHC-31", base: "SAMU Base Quintero", modelo: "Ford Transit 2022", status: "operativa", kilometrajeActual: 32000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:41" },
  { id: "R-14", patente: "LPXW-71", base: "SAMU Base Quintero", modelo: "Mercedes-Benz Sprinter 2021", status: "operativa", kilometrajeActual: 58000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:28" },
  { id: "R-20", patente: "HZHC-32", base: "SAMU Base Viña del Mar", modelo: "Renault Master 2019", status: "proxima_mantencion", kilometrajeActual: 192000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:35" },
  { id: "R-21", patente: "TDKZ-23", base: "SAMU Base Viña del Mar", modelo: "Fiat Ducato 2020", status: "operativa", kilometrajeActual: 41000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:43" },
  { id: "R-22", patente: "TDKZ-27", base: "SAMU Base Viña del Mar", modelo: "Mercedes-Benz Sprinter 2019", status: "mantencion_preventiva", kilometrajeActual: 215000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:22" },
  { id: "R-23", patente: "TDKZ-26", base: "SAMU Base Viña del Mar", modelo: "Ford Transit 2020", status: "operativa", kilometrajeActual: 73000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:37" },
  { id: "R-24", patente: "TDKZ-22", base: "SAMU Base Viña del Mar", modelo: "Renault Master 2022", status: "operativa", kilometrajeActual: 28000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:34" },
  { id: "R-25", patente: "TDKZ-24", base: "SAMU Base Viña del Mar", modelo: "Mercedes-Benz Sprinter 2021", status: "mantencion_correctiva", kilometrajeActual: 156000, kilometrajeUltimaMantencion: 80000, pautaPreventivaKm: 100000, lastUpdate: "15:26" },
  { id: "R-80", patente: "HZHC-34", base: "SAMU Base La Ligua", modelo: "Fiat Ducato 2018", status: "operativa", kilometrajeActual: 62000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:40" },
  { id: "R-81", patente: "GZXP-41", base: "SAMU Base La Ligua", modelo: "Ford Transit 2019", status: "proxima_mantencion", kilometrajeActual: 188000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:33" },
  { id: "R-82", patente: "HZHC-33", base: "SAMU Base La Ligua", modelo: "Mercedes-Benz Sprinter 2022", status: "operativa", kilometrajeActual: 51000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:42" },
  { id: "R-83", patente: "HLST-90", base: "SAMU Base La Ligua", modelo: "Renault Master 2020", status: "mantencion_preventiva", kilometrajeActual: 208000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:19" },
  { id: "R-84", patente: "HVHL-11", base: "SAMU Base La Ligua", modelo: "Mercedes-Benz Sprinter 2018", status: "operativa", kilometrajeActual: 39000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:38" },
  { id: "R-31", patente: "GXCB-84", base: "SAMU Base Marga Marga", modelo: "Ford Transit 2021", status: "operativa", kilometrajeActual: 64000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:29" },
  { id: "R-32", patente: "GZXP-41", base: "SAMU Base Marga Marga", modelo: "Mercedes-Benz Sprinter 2020", status: "operativa", kilometrajeActual: 47000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:45" },
  { id: "R-33", patente: "LVZP-24", base: "Hospital de Quilpué", modelo: "Renault Master 2019", status: "mantencion_correctiva", kilometrajeActual: 142000, kilometrajeUltimaMantencion: 70000, pautaPreventivaKm: 100000, lastUpdate: "15:30" },
  { id: "R-34", patente: "LVZP-25", base: "Hospital de Quilpué", modelo: "Fiat Ducato 2022", status: "operativa", kilometrajeActual: 36000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:41" },
  { id: "R-35", patente: "LVZP-26", base: "Hospital de Quilpué", modelo: "Mercedes-Benz Sprinter 2021", status: "proxima_mantencion", kilometrajeActual: 194000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:24" },
  { id: "R-50", patente: "LVZP-30", base: "Hospital Santo Tomás de Limache", modelo: "Ford Transit 2020", status: "operativa", kilometrajeActual: 55000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:39" },
  { id: "R-51", patente: "LVZP-31", base: "Hospital Santo Tomás de Limache", modelo: "Renault Master 2018", status: "operativa", kilometrajeActual: 71000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:25" },
  { id: "R-52", patente: "LVZP-32", base: "Hospital Santo Tomás de Limache", modelo: "Mercedes-Benz Sprinter 2019", status: "mantencion_preventiva", kilometrajeActual: 211000, kilometrajeUltimaMantencion: 100000, pautaPreventivaKm: 100000, lastUpdate: "15:12" },
  { id: "R-53", patente: "HLST-96", base: "Hospital Santo Tomás de Limache", modelo: "Fiat Ducato 2021", status: "operativa", kilometrajeActual: 44000, kilometrajeUltimaMantencion: 0, pautaPreventivaKm: 100000, lastUpdate: "15:46" },
]

const formatKm = (value: number) => `${value.toLocaleString("es-CL")} km`

const getUsoDesdeMantencion = (ambulance: Ambulance) =>
  ambulance.kilometrajeActual - ambulance.kilometrajeUltimaMantencion

const getKmFaltantes = (ambulance: Ambulance) =>
  Math.max(0, ambulance.pautaPreventivaKm - getUsoDesdeMantencion(ambulance))

const getProgressPercentage = (ambulance: Ambulance) =>
  Math.min(100, (getUsoDesdeMantencion(ambulance) / ambulance.pautaPreventivaKm) * 100)

const getEstadoCalculado = (ambulance: Ambulance): AmbulanceStatus => {
  if (ambulance.status === "mantencion_correctiva" || ambulance.status === "fuera_servicio") {
    return ambulance.status
  }

  const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)

  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm) return "mantencion_preventiva"
  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm * 0.8) return "proxima_mantencion"

  return "operativa"
}

const statusConfig: Record<
  AmbulanceStatus,
  {
    label: string
    shortLabel: string
    badgeClass: string
    progressClass: string
  }
> = {
  operativa: {
    label: "Operativa",
    shortLabel: "Operativa",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    progressClass: "bg-green-500",
  },
  proxima_mantencion: {
    label: "Próxima a mantención",
    shortLabel: "Próxima",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    progressClass: "bg-amber-500",
  },
  mantencion_preventiva: {
    label: "Mantención requerida",
    shortLabel: "Requiere mantención",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    progressClass: "bg-red-500",
  },
  mantencion_correctiva: {
    label: "Correctiva reportada",
    shortLabel: "Correctiva",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    progressClass: "bg-orange-500",
  },
  fuera_servicio: {
    label: "Fuera de servicio",
    shortLabel: "Fuera de servicio",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    progressClass: "bg-gray-500",
  },
}

function MetricCard({ title, value, description, icon, className }: MetricCardProps) {
  return (
    <Card className={`p-5 border ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-inter text-gray-600">{title}</p>
          <p className="text-3xl font-inter font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs font-inter text-gray-600 mt-1">{description}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  )
}

function AmbulanceIcon({ status }: { status: AmbulanceStatus }) {
  const color =
    status === "mantencion_preventiva"
      ? "text-red-600"
      : status === "mantencion_correctiva"
        ? "text-orange-600"
        : status === "proxima_mantencion"
          ? "text-amber-600"
          : status === "fuera_servicio"
            ? "text-gray-600"
            : "text-green-600"

  return (
    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
      <Truck className={`w-7 h-7 ${color}`} />
    </div>
  )
}

export function SimplifiedDashboard() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [showCriticalUnits, setShowCriticalUnits] = useState(false)
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null)
  const [editingForm, setEditingForm] = useState<EditForm | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)

  const totalFlota = ambulances.length
  const ambulanciasOperativas = ambulances.filter((a) => getEstadoCalculado(a) === "operativa").length
  const proximasMantencion = ambulances.filter((a) => getEstadoCalculado(a) === "proxima_mantencion").length
  const mantencionRequerida = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_preventiva").length
  const alertasCorrectivas = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_correctiva").length
  const fueraServicio = ambulances.filter((a) => getEstadoCalculado(a) === "fuera_servicio").length

  const ambulanciasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return ambulances.filter((ambulance) => {
      const estadoCalculado = getEstadoCalculado(ambulance)
      const estadoTexto = statusConfig[estadoCalculado].label.toLowerCase()

      const coincideBusqueda =
        !term ||
        ambulance.id.toLowerCase().includes(term) ||
        ambulance.patente.toLowerCase().includes(term) ||
        ambulance.modelo.toLowerCase().includes(term) ||
        ambulance.base.toLowerCase().includes(term) ||
        estadoTexto.includes(term)

      const coincideEstado =
        statusFilter === "todos" || estadoCalculado === statusFilter

      return coincideBusqueda && coincideEstado
    })
  }, [ambulances, searchTerm, statusFilter])

  const unidadesCriticas = useMemo(
    () => ambulances.filter((ambulance) => getEstadoCalculado(ambulance) === "mantencion_preventiva"),
    [ambulances]
  )

  const getCurrentTime = () =>
    new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const iniciarEdicion = (ambulance: Ambulance) => {
    setEditingForm({
      originalId: ambulance.id,
      id: ambulance.id,
      patente: ambulance.patente,
      base: ambulance.base,
      modelo: ambulance.modelo,
      status: ambulance.status,
      kilometrajeActual: ambulance.kilometrajeActual,
      usoDesdeMantencion: getUsoDesdeMantencion(ambulance),
      kmFaltantes: getKmFaltantes(ambulance),
    })
  }

  const crearAmbulanciaDesdeFormulario = (form: EditForm): Ambulance => {
    const kilometrajeActual = Math.max(0, Number(form.kilometrajeActual))
    const usoDesdeMantencion = Math.max(0, Number(form.usoDesdeMantencion))
    const kmFaltantes = Math.max(0, Number(form.kmFaltantes))

    return {
      id: form.id.trim(),
      patente: form.patente.trim(),
      base: form.base.trim(),
      modelo: form.modelo.trim(),
      status: form.status,
      kilometrajeActual,
      kilometrajeUltimaMantencion: kilometrajeActual - usoDesdeMantencion,
      pautaPreventivaKm: usoDesdeMantencion + kmFaltantes,
      lastUpdate: getCurrentTime(),
    }
  }

  const prepararConfirmacion = () => {
    if (!editingForm) return

    if (editingForm.usoDesdeMantencion > editingForm.kilometrajeActual) {
      window.alert(
        "Revisa los datos ingresados.\n\nEl uso acumulado desde la última mantención no puede ser mayor que el kilometraje total de la ambulancia."
      )
      return
    }

    const original = ambulances.find((ambulance) => ambulance.id === editingForm.originalId)
    if (!original) return

    const updated = crearAmbulanciaDesdeFormulario(editingForm)

    const cambios: string[] = []

    const agregarCambio = (label: string, antes: string, despues: string) => {
      if (antes !== despues) cambios.push(`${label}: ${antes} → ${despues}`)
    }

    agregarCambio("Código", original.id, updated.id)
    agregarCambio("Patente", original.patente, updated.patente)
    agregarCambio("Base", original.base, updated.base)
    agregarCambio("Marca/modelo", original.modelo, updated.modelo)
    agregarCambio("Estado registrado", statusConfig[original.status].label, statusConfig[updated.status].label)
    agregarCambio("Kilometraje total", formatKm(original.kilometrajeActual), formatKm(updated.kilometrajeActual))
    agregarCambio("Uso desde última mantención", formatKm(getUsoDesdeMantencion(original)), formatKm(getUsoDesdeMantencion(updated)))
    agregarCambio("Faltan para próxima mantención", formatKm(getKmFaltantes(original)), formatKm(getKmFaltantes(updated)))

    if (cambios.length === 0) {
      setEditingForm(null)
      return
    }

    setPendingChange({
      original,
      updated,
      changes: cambios,
    })
  }

  const confirmarCambioPermanente = () => {
    if (!pendingChange) return

    setAmbulances((prev) =>
      prev.map((ambulance) =>
        ambulance.id === pendingChange.original.id ? pendingChange.updated : ambulance
      )
    )

    if (selectedAmbulance?.id === pendingChange.original.id) {
      setSelectedAmbulance(pendingChange.updated)
    }

    setPendingChange(null)
    setEditingForm(null)
  }

  const renderAmbulanceCard = (ambulance: Ambulance) => {
    const estadoCalculado = getEstadoCalculado(ambulance)
    const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)
    const kmFaltantes = getKmFaltantes(ambulance)
    const progressPercentage = getProgressPercentage(ambulance)
    const config = statusConfig[estadoCalculado]

    return (
      <Card key={ambulance.id} className="p-4 border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AmbulanceIcon status={estadoCalculado} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-inter font-bold text-gray-900">{ambulance.id}</p>
                <p className="text-sm font-inter text-gray-500">({ambulance.patente})</p>
              </div>
              <p className="text-xs font-inter text-gray-500 mt-1">{ambulance.base}</p>
              <p className="text-xs font-inter text-gray-500">{ambulance.modelo}</p>
            </div>
          </div>

          <Badge className={`${config.badgeClass} font-inter`}>
            {config.shortLabel}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-inter">
            <span className="text-gray-600">Kilometraje total</span>
            <span className="font-semibold">{formatKm(ambulance.kilometrajeActual)}</span>
          </div>

          <div className="flex justify-between text-sm font-inter">
            <span className="text-gray-600">Uso desde mantención</span>
            <span className="font-semibold">{formatKm(usoDesdeMantencion)}</span>
          </div>

          <div className="flex justify-between text-sm font-inter">
            <span className="text-gray-600">Faltan para mantención</span>
            <span className="font-semibold">{formatKm(kmFaltantes)}</span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${config.progressClass}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-inter text-gray-500">
            <span>Avance preventivo</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>

          <div className="flex items-center justify-between pt-2 gap-2">
            <div className="flex items-center gap-1 text-xs font-inter text-gray-500">
              <Clock className="w-3 h-3" />
              Actualizado {ambulance.lastUpdate} hrs
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="font-inter"
                onClick={() => setSelectedAmbulance(ambulance)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="font-inter"
                onClick={() => iniciarEdicion(ambulance)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-5 border-blue-200 bg-blue-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl font-inter font-bold text-gray-900">
                Gestión de Mantenimiento Preventivo SAMU - SSVQ
              </h1>
              <p className="text-sm font-inter text-gray-700 mt-1 max-w-4xl">
                Prototipo funcional con datos simulados para apoyar la planificación del
                mantenimiento preventivo de ambulancias, centralizar registros operativos y
                preparar una futura integración con API GPS.
              </p>
            </div>
          </div>

          <Badge className="bg-white text-blue-700 border-blue-200 px-3 py-2 font-inter">
            <RadioTower className="w-4 h-4 mr-2" />
            Datos simulados / integración futura
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <MetricCard title="Flota monitoreada" value={totalFlota} description="Ambulancias en seguimiento" icon={<Gauge className="w-6 h-6 text-blue-600" />} className="bg-blue-50 border-blue-200" />
        <MetricCard title="Operativas" value={ambulanciasOperativas} description="Disponibles para servicio" icon={<CheckCircle className="w-6 h-6 text-green-600" />} className="bg-green-50 border-green-200" />
        <MetricCard title="Próximas" value={proximasMantencion} description="Requieren monitoreo preventivo" icon={<Calendar className="w-6 h-6 text-amber-600" />} className="bg-amber-50 border-amber-200" />
        <MetricCard title="Mantención requerida" value={mantencionRequerida} description="Superan la pauta configurada" icon={<AlertTriangle className="w-6 h-6 text-red-600" />} className="bg-red-50 border-red-200" />
        <MetricCard title="Correctivas" value={alertasCorrectivas} description="Incidencias reportadas" icon={<Wrench className="w-6 h-6 text-orange-600" />} className="bg-orange-50 border-orange-200" />
        <MetricCard title="Fuera de servicio" value={fueraServicio} description="No disponibles" icon={<Activity className="w-6 h-6 text-gray-600" />} className="bg-gray-50 border-gray-200" />
      </div>

      {mantencionRequerida > 0 && (
        <Card className="p-5 bg-red-50 border-red-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="font-inter font-bold text-red-900">
                  Alerta de mantención preventiva
                </h2>
                <p className="text-sm font-inter text-red-700 mt-1">
                  {mantencionRequerida} ambulancia(s) requieren programación de mantención
                  según la pauta preventiva configurada por kilometraje.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="font-inter"
              onClick={() => setShowCriticalUnits((value) => !value)}
            >
              {showCriticalUnits ? "Ocultar unidades críticas" : "Ver unidades críticas"}
            </Button>
          </div>
        </Card>
      )}

      {showCriticalUnits && (
        <Card className="p-5 border-red-200 bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-inter font-bold text-red-900">
                Unidades críticas por mantención preventiva
              </h2>
              <p className="text-sm font-inter text-red-700">
                Ambulancias que alcanzaron o superaron la pauta preventiva de kilometraje.
              </p>
            </div>

            <Button variant="outline" size="sm" className="font-inter" onClick={() => setShowCriticalUnits(false)}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {unidadesCriticas.map((ambulance) => renderAmbulanceCard(ambulance))}
          </div>
        </Card>
      )}

      <Card className="p-5 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-inter font-bold text-gray-900">
              Flota total de ambulancias SAMU
            </h2>
            <p className="text-sm font-inter text-gray-600">
              Visualización general de unidades monitoreadas. El detalle completo se encuentra en el botón Ver.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="relative lg:col-span-2">
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
            onChange={(event) => setStatusFilter(event.target.value)}
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

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-inter text-gray-600">
            Mostrando {ambulanciasFiltradas.length} de {totalFlota} ambulancias
          </p>

          {(searchTerm || statusFilter !== "todos") && (
            <Button
              variant="outline"
              size="sm"
              className="font-inter"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("todos")
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ambulanciasFiltradas.map((ambulance) => renderAmbulanceCard(ambulance))}
        </div>
      </Card>

      {selectedAmbulance && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Información de ambulancia {selectedAmbulance.id}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Detalle operativo y de mantenimiento de la unidad seleccionada.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedAmbulance(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Código</p>
                <p className="font-semibold">{selectedAmbulance.id}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Patente</p>
                <p className="font-semibold">{selectedAmbulance.patente}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border md:col-span-2">
                <p className="text-gray-500">Base / establecimiento</p>
                <p className="font-semibold">{selectedAmbulance.base}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border md:col-span-2">
                <p className="text-gray-500">Marca / modelo</p>
                <p className="font-semibold">{selectedAmbulance.modelo}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Kilometraje total</p>
                <p className="font-semibold">{formatKm(selectedAmbulance.kilometrajeActual)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Última actualización</p>
                <p className="font-semibold">{selectedAmbulance.lastUpdate} hrs</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Uso desde última mantención</p>
                <p className="font-semibold">{formatKm(getUsoDesdeMantencion(selectedAmbulance))}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Faltan para próxima mantención</p>
                <p className="font-semibold">{formatKm(getKmFaltantes(selectedAmbulance))}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Pauta preventiva configurada</p>
                <p className="font-semibold">{formatKm(selectedAmbulance.pautaPreventivaKm)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Estado calculado</p>
                <Badge className={`${statusConfig[getEstadoCalculado(selectedAmbulance)].badgeClass} mt-1`}>
                  {statusConfig[getEstadoCalculado(selectedAmbulance)].label}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setSelectedAmbulance(null)}>
                Cerrar
              </Button>

              <Button className="font-inter" onClick={() => iniciarEdicion(selectedAmbulance)}>
                Editar características
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editingForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Editar características de ambulancia
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Modifica los datos principales utilizados para el control preventivo por kilometraje.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setEditingForm(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Código del móvil</label>
                <Input
                  value={editingForm.id}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, id: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Patente</label>
                <Input
                  value={editingForm.patente}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, patente: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Base / establecimiento</label>
                <Input
                  value={editingForm.base}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, base: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Marca / modelo</label>
                <Input
                  value={editingForm.modelo}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, modelo: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilometraje total de la ambulancia</label>
                <Input
                  type="number"
                  value={editingForm.kilometrajeActual}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      kilometrajeActual: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Uso acumulado desde última mantención</label>
                <Input
                  type="number"
                  value={editingForm.usoDesdeMantencion}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      usoDesdeMantencion: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilómetros faltantes para próxima mantención</label>
                <Input
                  type="number"
                  value={editingForm.kmFaltantes}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      kmFaltantes: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado operacional registrado</label>
                <select
                  value={editingForm.status}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      status: event.target.value as AmbulanceStatus,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="operativa">Operativa</option>
                  <option value="proxima_mantencion">Próxima a mantención</option>
                  <option value="mantencion_preventiva">Mantención requerida</option>
                  <option value="mantencion_correctiva">Correctiva reportada</option>
                  <option value="fuera_servicio">Fuera de servicio</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-inter text-blue-800">
                Estos tres datos de kilometraje son los mismos que se muestran en la tarjeta principal:
                kilometraje total, uso desde última mantención y kilómetros faltantes para la próxima mantención.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setEditingForm(null)}>
                Cancelar
              </Button>

              <Button className="font-inter" onClick={prepararConfirmacion}>
                <Save className="w-4 h-4 mr-2" />
                Revisar cambios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {pendingChange && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Confirmar cambio permanente
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Revisa los datos modificados antes de guardar la información de forma permanente en el prototipo.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setPendingChange(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <p className="text-sm font-inter text-amber-800">
                Se modificarán los datos de la ambulancia {pendingChange.original.id}. Confirma solo si la información ingresada es correcta.
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pendingChange.changes.map((change) => (
                <div key={change} className="p-3 rounded-lg bg-gray-50 border text-sm font-inter text-gray-700">
                  {change}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setPendingChange(null)}>
                Volver a editar
              </Button>

              <Button className="font-inter" onClick={confirmarCambioPermanente}>
                Confirmar y guardar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}