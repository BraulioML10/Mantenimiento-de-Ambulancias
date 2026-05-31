import { useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  Download,
  Edit,
  Eye,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react"
import {
  useAmbulances,
  type Ambulance,
  type AmbulanceStatus,
  type PreventiveAlertStatus,
} from "../AmbulanceContext"
type SortOption =
  | "codigo"
  | "estado"
  | "mayor_km_total"
  | "mayor_uso"
  | "mayor_necesidad"
  | "mayor_margen"
interface AmbulanceForm {
  originalId: string
  id: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometrajeActual: number
  usoDesdeUltimaMantencion: number
  pautaPreventivaKm: number
}

interface PendingAmbulanceChange {
  type: "crear" | "editar"
  original?: Ambulance
  updated: Ambulance
  changes: string[]
}

interface FleetTabProps {
  onRequestMaintenance?: (
    ambulanceCode: string,
    type: "preventiva" | "correctiva"
  ) => void
}

const emptyForm: AmbulanceForm = {
  originalId: "",
  id: "",
  patente: "",
  base: "",
  modelo: "",
  status: "operativa",
  kilometrajeActual: 0,
  usoDesdeUltimaMantencion: 0,
  pautaPreventivaKm: 10000,
}

export function FleetTab({ onRequestMaintenance }: FleetTabProps) {
  const {
    ambulances,
    addAmbulance,
    updateAmbulance,
    deleteAmbulance,
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
  const [sortOption, setSortOption] = useState<SortOption>("codigo")
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<AmbulanceForm | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ambulance | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingAmbulanceChange | null>(null)

  const selectedAmbulance = ambulances.find(
    (ambulance) => ambulance.id === selectedAmbulanceId
  )

  const totalFlota = ambulances.length

  const operativas = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "operativa"
  ).length

  const enPreventiva = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_preventiva"
  ).length

  const enCorrectiva = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_correctiva"
  ).length

  const fueraServicio = ambulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "fuera_servicio"
  ).length

  const proximas = ambulances.filter(
    (ambulance) => getAlertaPreventiva(ambulance) === "proxima_mantencion"
  ).length

  const preventivasRequeridas = ambulances.filter(
    (ambulance) =>
      getAlertaPreventiva(ambulance) === "mantencion_preventiva_requerida"
  ).length

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

    if (sortOption === "estado") {
      return statusConfig[getEstadoCalculado(a)].label.localeCompare(
        statusConfig[getEstadoCalculado(b)].label,
        "es-CL"
      )
    }

    if (sortOption === "mayor_km_total") {
      return b.kilometrajeActual - a.kilometrajeActual
    }

    if (sortOption === "mayor_uso") {
      return getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a)
    }

    if (sortOption === "mayor_margen") {
      return getKmFaltantes(b) - getKmFaltantes(a)
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
    setSortOption("codigo")
  }

  const formFromAmbulance = (
    ambulance: Ambulance,
    originalId: string
  ): AmbulanceForm => ({
    originalId,
    id: ambulance.id,
    patente: ambulance.patente,
    base: ambulance.base,
    modelo: ambulance.modelo,
    status: getEstadoCalculado(ambulance),
    kilometrajeActual: ambulance.kilometrajeActual,
    usoDesdeUltimaMantencion: getUsoDesdeMantencion(ambulance),
    pautaPreventivaKm: ambulance.pautaPreventivaKm,
  })

  const iniciarCreacion = () => {
    setPendingChange(null)
    setIsCreating(true)
    setEditingForm({ ...emptyForm })
  }

  const iniciarEdicion = (ambulance: Ambulance) => {
    setPendingChange(null)
    setIsCreating(false)
    setEditingForm(formFromAmbulance(ambulance, ambulance.id))
  }

  const crearAmbulanciaDesdeFormulario = (form: AmbulanceForm): Ambulance => {
    const kilometrajeActual = Math.max(0, Number(form.kilometrajeActual))
    const usoDesdeUltimaMantencion = Math.max(
      0,
      Number(form.usoDesdeUltimaMantencion)
    )
    const pautaPreventivaKm = Math.max(1, Number(form.pautaPreventivaKm))

    return {
      id: form.id.trim().toUpperCase(),
      patente: form.patente.trim().toUpperCase(),
      base: form.base.trim(),
      modelo: form.modelo.trim(),
      status: form.status,
      kilometrajeActual,
      kilometrajeUltimaMantencion: Math.max(
        0,
        kilometrajeActual - usoDesdeUltimaMantencion
      ),
      usoDesdeUltimaMantencion,
      pautaPreventivaKm,
      lastUpdate: "",
    }
  }

  const guardarFormulario = () => {
    if (!editingForm) return

    if (
      !editingForm.id.trim() ||
      !editingForm.patente.trim() ||
      !editingForm.base.trim() ||
      !editingForm.modelo.trim()
    ) {
      window.alert(
        "Debes completar código del móvil, patente, base y marca/modelo antes de guardar."
      )
      return
    }

    if (editingForm.kilometrajeActual < 0) {
      window.alert("El kilometraje total actual no puede ser negativo.")
      return
    }

    if (editingForm.usoDesdeUltimaMantencion < 0) {
      window.alert("El uso desde última mantención no puede ser negativo.")
      return
    }

    if (editingForm.pautaPreventivaKm <= 0) {
      window.alert("La pauta preventiva de mantención debe ser mayor a 0.")
      return
    }

    if (editingForm.usoDesdeUltimaMantencion > editingForm.kilometrajeActual) {
      window.alert(
        "Revisa los datos ingresados.\n\nEl uso desde la última mantención no puede ser mayor que el kilometraje total actual."
      )
      return
    }

    const updated = crearAmbulanciaDesdeFormulario(editingForm)

    const duplicatedCode = ambulances.some(
      (ambulance) =>
        ambulance.id.toLowerCase() === updated.id.toLowerCase() &&
        ambulance.id !== editingForm.originalId
    )

    if (duplicatedCode) {
      window.alert("Ya existe una ambulancia con ese código de móvil.")
      return
    }

    const duplicatedPatente = ambulances.some(
      (ambulance) =>
        ambulance.patente.toLowerCase() === updated.patente.toLowerCase() &&
        ambulance.id !== editingForm.originalId
    )

    if (duplicatedPatente) {
      window.alert("Ya existe una ambulancia con esa patente.")
      return
    }

    if (isCreating) {
      setPendingChange({
        type: "crear",
        updated,
        changes: [
          `Código del móvil: ${updated.id}`,
          `Patente: ${updated.patente}`,
          `Base / establecimiento: ${updated.base}`,
          `Marca / modelo: ${updated.modelo}`,
          `Estado operativo: ${statusConfig[updated.status].label}`,
          `Kilometraje total actual: ${formatKm(updated.kilometrajeActual)}`,
          `Uso desde última mantención: ${formatKm(
            updated.usoDesdeUltimaMantencion
          )}`,
          `Pauta preventiva de mantención: cada ${formatKm(
            updated.pautaPreventivaKm
          )}`,
          `Faltan para próxima mantención: ${formatKm(getKmFaltantes(updated))}`,
        ],
      })

      setEditingForm(null)
      return
    }

    const original = ambulances.find(
      (ambulance) => ambulance.id === editingForm.originalId
    )

    if (!original) return

    const changes: string[] = []

    const addChange = (label: string, before: string, after: string) => {
      if (before !== after) {
        changes.push(`${label}: ${before} → ${after}`)
      }
    }

    addChange("Código del móvil", original.id, updated.id)
    addChange("Patente", original.patente, updated.patente)
    addChange("Base / establecimiento", original.base, updated.base)
    addChange("Marca / modelo", original.modelo, updated.modelo)
    addChange(
      "Estado operativo",
      statusConfig[getEstadoCalculado(original)].label,
      statusConfig[updated.status].label
    )
    addChange(
      "Kilometraje total actual",
      formatKm(original.kilometrajeActual),
      formatKm(updated.kilometrajeActual)
    )
    addChange(
      "Uso desde última mantención",
      formatKm(getUsoDesdeMantencion(original)),
      formatKm(updated.usoDesdeUltimaMantencion)
    )
    addChange(
      "Pauta preventiva de mantención",
      `cada ${formatKm(original.pautaPreventivaKm)}`,
      `cada ${formatKm(updated.pautaPreventivaKm)}`
    )
    addChange(
      "Faltan para próxima mantención",
      formatKm(getKmFaltantes(original)),
      formatKm(getKmFaltantes(updated))
    )

    if (changes.length === 0) {
      setEditingForm(null)
      return
    }

    setPendingChange({
      type: "editar",
      original,
      updated,
      changes,
    })

    setEditingForm(null)
  }

  const confirmarCambioAmbulancia = async () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear") {
      await addAmbulance(pendingChange.updated)
    }

    if (pendingChange.type === "editar" && pendingChange.original) {
      await updateAmbulance(pendingChange.original.id, pendingChange.updated)
      setSelectedAmbulanceId(pendingChange.updated.id)
    }

    setPendingChange(null)
    setIsCreating(false)
  }

  const volverAEditarCambio = () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear") {
      setIsCreating(true)
      setEditingForm(formFromAmbulance(pendingChange.updated, ""))
    }

    if (pendingChange.type === "editar" && pendingChange.original) {
      setIsCreating(false)
      setEditingForm(
        formFromAmbulance(pendingChange.updated, pendingChange.original.id)
      )
    }

    setPendingChange(null)
  }

  const confirmarEliminacion = async () => {
    if (!deleteTarget) return

    await deleteAmbulance(deleteTarget.id)

    if (selectedAmbulanceId === deleteTarget.id) {
      setSelectedAmbulanceId(null)
    }

    setDeleteTarget(null)
  }

  const exportToCsv = () => {
    const headers = [
      "Código móvil",
      "Patente",
      "Base",
      "Marca/Modelo",
      "Estado operativo",
      "Alerta preventiva",
      "Kilometraje total actual",
      "Uso desde última mantención",
      "Pauta preventiva de mantención",
      "Faltan para próxima mantención",
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
    link.download = "flota_ambulancias_ssvq.csv"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
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

  const renderAlertButton = (
    value: PreventiveAlertStatus | "todos",
    label: string
  ) => (
    <Button
      variant={alertFilter === value ? "default" : "outline"}
      size="sm"
      className="font-inter"
      onClick={() => setAlertFilter(value)}
    >
      {label}
    </Button>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Gestión de Ambulancias
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Administración centralizada de móviles, identificación, estado operativo y control preventivo por kilometraje.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-inter" onClick={exportToCsv}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>

          <Button className="font-inter" onClick={iniciarCreacion}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar ambulancia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
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
          <p className="text-sm font-inter text-green-700">Operativas</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {operativas}
          </p>
          <p className="text-xs font-inter text-green-700">
            Disponibles para servicio
          </p>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">
            Mantención preventiva
          </p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {enPreventiva}
          </p>
          <p className="text-xs font-inter text-blue-700">
            En proceso preventivo
          </p>
        </Card>

        <Card className="p-5 bg-orange-50 border-orange-200">
          <p className="text-sm font-inter text-orange-700">
            Mantención correctiva
          </p>
          <p className="text-3xl font-inter font-bold text-orange-900">
            {enCorrectiva}
          </p>
          <p className="text-xs font-inter text-orange-700">
            Por falla o incidencia
          </p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">Fuera de servicio</p>
          <p className="text-3xl font-inter font-bold text-gray-900">
            {fueraServicio}
          </p>
          <p className="text-xs font-inter text-gray-700">No disponibles</p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">
            Alertas preventivas
          </p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {preventivasRequeridas}
          </p>
          <p className="text-xs font-inter text-red-700">
            Superan la pauta
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm font-inter text-amber-700">
            Próximas a mantención
          </p>
          <p className="text-3xl font-inter font-bold text-amber-900">
            {proximas}
          </p>
          <p className="text-xs font-inter text-amber-700">
            Cercanas a la pauta preventiva
          </p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">
            Mantención preventiva requerida
          </p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {preventivasRequeridas}
          </p>
          <p className="text-xs font-inter text-red-700">
            Requieren revisión preventiva
          </p>
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          <div className="relative lg:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por código, patente, base, modelo o estado..."
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
            <option value="codigo">Orden por código móvil</option>
            <option value="estado">Orden por estado operativo</option>
            <option value="mayor_km_total">Mayor kilometraje total</option>
            <option value="mayor_uso">Mayor uso desde última mantención</option>
            <option value="mayor_necesidad">Mayor necesidad preventiva</option>
            <option value="mayor_margen">Mayor margen disponible</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {renderStatusButton("todos", "Todos")}
          {renderStatusButton("operativa", "Operativas")}
          {renderStatusButton("mantencion_preventiva", "Preventiva")}
          {renderStatusButton("mantencion_correctiva", "Correctiva")}
          {renderStatusButton("fuera_servicio", "Fuera de servicio")}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {renderAlertButton("todos", "Todas las alertas")}
          {renderAlertButton("sin_alerta", "Sin alerta")}
          {renderAlertButton("proxima_mantencion", "Próximas")}
          {renderAlertButton(
            "mantencion_preventiva_requerida",
            "Requieren mantención"
          )}
        </div>

        {(searchTerm ||
          statusFilter !== "todos" ||
          alertFilter !== "todos" ||
          sortOption !== "codigo") && (
          <div className="mb-4">
            <Button variant="outline" size="sm" className="font-inter" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}

        <p className="text-sm font-inter text-gray-600 mb-4">
          Mostrando {filteredAmbulances.length} de {totalFlota} ambulancias
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Móvil
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Patente
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Base
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Modelo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Estado operativo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Alerta preventiva
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Km total
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Uso mantención
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Faltan
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAmbulances.map((ambulance) => {
                  const estadoOperativo = getEstadoCalculado(ambulance)
                  const alertaPreventiva = getAlertaPreventiva(ambulance)
                  const estadoConfig = statusConfig[estadoOperativo]
                  const alertaConfig = preventiveAlertConfig[alertaPreventiva]

                  return (
                    <tr key={ambulance.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {ambulance.id}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {ambulance.patente}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {ambulance.base}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {ambulance.modelo}
                      </td>

                      <td className="px-4 py-3">
                        <Badge className={`${estadoConfig.badgeClass} font-inter`}>
                          {estadoConfig.shortLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge className={`${alertaConfig.badgeClass} font-inter`}>
                          {alertaConfig.shortLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {formatKm(ambulance.kilometrajeActual)}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {formatKm(getUsoDesdeMantencion(ambulance))}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {formatKm(getKmFaltantes(ambulance))}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-inter"
                            onClick={() => setSelectedAmbulanceId(ambulance.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="font-inter"
                            onClick={() => iniciarEdicion(ambulance)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="font-inter"
                            onClick={() =>
                              onRequestMaintenance?.(ambulance.id, "preventiva")
                            }
                          >
                            <Wrench className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="font-inter text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(ambulance)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredAmbulances.length === 0 && (
              <div className="p-8 text-center text-sm font-inter text-gray-500">
                No se encontraron ambulancias con los filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </Card>

      {selectedAmbulance && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Detalle completo de ambulancia {selectedAmbulance.id}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Información operacional, identificación y control preventivo por kilometraje.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedAmbulanceId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">Código del móvil</p>
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
                <p className="text-xs font-inter text-gray-500">Estado operativo</p>
                <Badge
                  className={`mt-2 ${
                    statusConfig[getEstadoCalculado(selectedAmbulance)].badgeClass
                  } font-inter`}
                >
                  {statusConfig[getEstadoCalculado(selectedAmbulance)].label}
                </Badge>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">Alerta preventiva</p>
                <Badge
                  className={`mt-2 ${
                    preventiveAlertConfig[getAlertaPreventiva(selectedAmbulance)]
                      .badgeClass
                  } font-inter`}
                >
                  {preventiveAlertConfig[getAlertaPreventiva(selectedAmbulance)].label}
                </Badge>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">Base / establecimiento</p>
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
                <p className="text-xs font-inter text-gray-500">Kilometraje total actual</p>
                <p className="text-lg font-inter font-bold text-gray-900">
                  {formatKm(selectedAmbulance.kilometrajeActual)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">
                  Uso desde última mantención
                </p>
                <p className="text-lg font-inter font-bold text-gray-900">
                  {formatKm(getUsoDesdeMantencion(selectedAmbulance))}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">
                  Pauta preventiva de mantención
                </p>
                <p className="text-lg font-inter font-bold text-gray-900">
                  Cada {formatKm(selectedAmbulance.pautaPreventivaKm)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-inter text-gray-500">
                  Faltan para próxima mantención
                </p>
                <p className="text-lg font-inter font-bold text-gray-900">
                  {formatKm(getKmFaltantes(selectedAmbulance))}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                <p className="text-xs font-inter text-gray-500">Última actualización</p>
                <p className="text-lg font-inter font-bold text-gray-900">
                  {selectedAmbulance.lastUpdate} hrs
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-inter mb-2">
                <span className="text-gray-600">Avance preventivo por kilometraje</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(getProgressPercentage(selectedAmbulance))}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full ${
                    preventiveAlertConfig[getAlertaPreventiva(selectedAmbulance)]
                      .progressClass
                  }`}
                  style={{
                    width: `${Math.min(100, getProgressPercentage(selectedAmbulance))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="font-inter"
                onClick={() => setSelectedAmbulanceId(null)}
              >
                Cerrar
              </Button>

              <Button className="font-inter" onClick={() => iniciarEdicion(selectedAmbulance)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar características
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editingForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  {isCreating ? "Agregar nueva ambulancia" : "Editar ambulancia"}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Registra los datos principales de la unidad y su control preventivo por kilometraje.
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
                  placeholder="Ej: R-61"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Patente</label>
                <Input
                  value={editingForm.patente}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, patente: event.target.value })
                  }
                  placeholder="Ej: LVZP-22"
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
                <label className="text-sm text-gray-600">
                  Kilometraje total actual
                </label>
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
                <label className="text-sm text-gray-600">
                  Uso desde última mantención
                </label>
                <Input
                  type="number"
                  value={editingForm.usoDesdeUltimaMantencion}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      usoDesdeUltimaMantencion: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Pauta preventiva de mantención
                </label>
                <Input
                  type="number"
                  value={editingForm.pautaPreventivaKm}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      pautaPreventivaKm: Number(event.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Indica cada cuántos kilómetros corresponde la mantención.
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Faltan para próxima mantención
                </label>
                <Input
                  value={formatKm(
                    Math.max(
                      0,
                      editingForm.pautaPreventivaKm -
                        editingForm.usoDesdeUltimaMantencion
                    )
                  )}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este dato se calcula automáticamente.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Estado operativo</label>
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
                  <option value="mantencion_preventiva">
                    En mantenimiento preventivo
                  </option>
                  <option value="mantencion_correctiva">
                    En mantenimiento correctivo
                  </option>
                  <option value="fuera_servicio">Fuera de servicio</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setEditingForm(null)}>
                Cancelar
              </Button>

              <Button className="font-inter" onClick={guardarFormulario}>
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? "Revisar ambulancia" : "Revisar cambios"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {pendingChange && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-amber-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>

                <div>
                  <h2 className="text-xl font-inter font-bold text-amber-900">
                    {pendingChange.type === "crear"
                      ? "Confirmar nueva ambulancia"
                      : "Confirmar cambios de ambulancia"}
                  </h2>
                  <p className="text-sm font-inter text-amber-800 mt-1">
                    Revisa los datos antes de guardar la información en la base de datos.
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setPendingChange(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 mb-4">
              <p className="text-sm font-inter">
                Si confirmas, el cambio quedará guardado y se reflejará en Inicio, Kilometraje, Formularios y Estadísticas.
              </p>
            </div>

            <div className="space-y-2">
              {pendingChange.changes.map((change) => (
                <div
                  key={change}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-inter text-gray-800"
                >
                  {change}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={volverAEditarCambio}>
                Volver a editar
              </Button>

              <Button
                variant="outline"
                className="font-inter"
                onClick={() => setPendingChange(null)}
              >
                Cancelar
              </Button>

              <Button className="font-inter bg-amber-600 hover:bg-amber-700" onClick={confirmarCambioAmbulancia}>
                Confirmar cambios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-red-200 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div>
                <h2 className="text-xl font-inter font-bold text-red-900">
                  Confirmar eliminación permanente
                </h2>
                <p className="text-sm font-inter text-red-700 mt-1">
                  Estás por eliminar la ambulancia {deleteTarget.id} ({deleteTarget.patente}).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 mb-4">
              <p className="text-sm font-inter">
                Esta acción quitará la unidad de la base de datos. Confirma solo si corresponde eliminar esta ambulancia.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" className="font-inter" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>

              <Button className="font-inter bg-red-600 hover:bg-red-700" onClick={confirmarEliminacion}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar definitivamente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
