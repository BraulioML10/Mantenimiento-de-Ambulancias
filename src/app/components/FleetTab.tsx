import { useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  Edit,
  Eye,
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react"
import {
  useAmbulances,
  type Ambulance,
  type AmbulanceStatus,
} from "../AmbulanceContext"

interface AmbulanceForm {
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

interface PendingAmbulanceChange {
  type: "crear" | "editar"
  original?: Ambulance
  updated: Ambulance
  changes: string[]
}

const emptyForm: AmbulanceForm = {
  originalId: "",
  id: "",
  patente: "",
  base: "",
  modelo: "",
  status: "operativa",
  kilometrajeActual: 0,
  usoDesdeMantencion: 0,
  kmFaltantes: 100000,
}

export function FleetTab() {
  const {
    ambulances,
    addAmbulance,
    updateAmbulance,
    deleteAmbulance,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getProgressPercentage,
    getEstadoCalculado,
    formatKm,
    statusConfig,
  } = useAmbulances()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AmbulanceStatus | "todos">("todos")
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null)
  const [editingForm, setEditingForm] = useState<AmbulanceForm | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ambulance | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingAmbulanceChange | null>(null)

  const totalFlota = ambulances.length
  const operativas = ambulances.filter((a) => getEstadoCalculado(a) === "operativa").length
  const proximas = ambulances.filter((a) => getEstadoCalculado(a) === "proxima_mantencion").length
  const preventivas = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_preventiva").length
  const correctivas = ambulances.filter((a) => getEstadoCalculado(a) === "mantencion_correctiva").length
  const fueraServicio = ambulances.filter((a) => getEstadoCalculado(a) === "fuera_servicio").length

  const filteredAmbulances = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return ambulances.filter((ambulance) => {
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
  }, [ambulances, searchTerm, statusFilter, getEstadoCalculado, statusConfig])

  const limpiarFiltros = () => {
    setSearchTerm("")
    setStatusFilter("todos")
  }

  const formFromAmbulance = (ambulance: Ambulance, originalId: string): AmbulanceForm => ({
    originalId,
    id: ambulance.id,
    patente: ambulance.patente,
    base: ambulance.base,
    modelo: ambulance.modelo,
    status: ambulance.status,
    kilometrajeActual: ambulance.kilometrajeActual,
    usoDesdeMantencion: getUsoDesdeMantencion(ambulance),
    kmFaltantes: getKmFaltantes(ambulance),
  })

  const iniciarCreacion = () => {
    setPendingChange(null)
    setIsCreating(true)
    setEditingForm({
      ...emptyForm,
      originalId: "",
    })
  }

  const iniciarEdicion = (ambulance: Ambulance) => {
    setPendingChange(null)
    setIsCreating(false)
    setEditingForm(formFromAmbulance(ambulance, ambulance.id))
  }

  const crearAmbulanciaDesdeFormulario = (form: AmbulanceForm): Ambulance => {
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
      window.alert("Debes completar código, patente, base y marca/modelo antes de guardar.")
      return
    }

    if (editingForm.usoDesdeMantencion > editingForm.kilometrajeActual) {
      window.alert(
        "Revisa los datos ingresados.\n\nEl uso acumulado desde la última mantención no puede ser mayor que el kilometraje total de la ambulancia."
      )
      return
    }

    const updated = crearAmbulanciaDesdeFormulario(editingForm)

    if (isCreating) {
      const existeCodigo = ambulances.some(
        (a) => a.id.toLowerCase() === updated.id.toLowerCase()
      )

      if (existeCodigo) {
        window.alert("Ya existe una ambulancia con ese código. Usa otro código para crear una nueva unidad.")
        return
      }

      setPendingChange({
        type: "crear",
        updated,
        changes: [
          `Código del móvil: ${updated.id}`,
          `Patente: ${updated.patente}`,
          `Base / establecimiento: ${updated.base}`,
          `Marca / modelo: ${updated.modelo}`,
          `Kilometraje total: ${formatKm(updated.kilometrajeActual)}`,
          `Uso desde última mantención: ${formatKm(getUsoDesdeMantencion(updated))}`,
          `Faltan para próxima mantención: ${formatKm(getKmFaltantes(updated))}`,
          `Estado registrado: ${statusConfig[updated.status].label}`,
        ],
      })

      setEditingForm(null)
      return
    }

    const original = ambulances.find((a) => a.id === editingForm.originalId)
    if (!original) return

    const cambios: string[] = []

    const agregarCambio = (label: string, antes: string, despues: string) => {
      if (antes !== despues) {
        cambios.push(`${label}: ${antes} → ${despues}`)
      }
    }

    agregarCambio("Código", original.id, updated.id)
    agregarCambio("Patente", original.patente, updated.patente)
    agregarCambio("Base / establecimiento", original.base, updated.base)
    agregarCambio("Marca / modelo", original.modelo, updated.modelo)
    agregarCambio("Estado registrado", statusConfig[original.status].label, statusConfig[updated.status].label)
    agregarCambio("Kilometraje total", formatKm(original.kilometrajeActual), formatKm(updated.kilometrajeActual))
    agregarCambio("Uso desde última mantención", formatKm(getUsoDesdeMantencion(original)), formatKm(getUsoDesdeMantencion(updated)))
    agregarCambio("Faltan para próxima mantención", formatKm(getKmFaltantes(original)), formatKm(getKmFaltantes(updated)))

    if (cambios.length === 0) {
      setEditingForm(null)
      return
    }

    setPendingChange({
      type: "editar",
      original,
      updated,
      changes: cambios,
    })

    setEditingForm(null)
  }

  const confirmarCambioAmbulancia = () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear") {
      addAmbulance(pendingChange.updated)
    } else if (pendingChange.original) {
      updateAmbulance(pendingChange.original.id, pendingChange.updated)

      if (selectedAmbulance?.id === pendingChange.original.id) {
        setSelectedAmbulance(pendingChange.updated)
      }
    }

    setPendingChange(null)
    setIsCreating(false)
  }

  const volverAEditarCambio = () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear") {
      setIsCreating(true)
      setEditingForm(formFromAmbulance(pendingChange.updated, ""))
    } else if (pendingChange.original) {
      setIsCreating(false)
      setEditingForm(formFromAmbulance(pendingChange.updated, pendingChange.original.id))
    }

    setPendingChange(null)
  }

  const confirmarEliminacion = () => {
    if (!deleteTarget) return

    deleteAmbulance(deleteTarget.id)

    if (selectedAmbulance?.id === deleteTarget.id) {
      setSelectedAmbulance(null)
    }

    setDeleteTarget(null)
  }

  const exportToCsv = () => {
    const headers = [
      "Código",
      "Patente",
      "Base",
      "Marca/Modelo",
      "Kilometraje total",
      "Uso desde mantención",
      "Faltan para mantención",
      "Pauta preventiva",
      "Estado",
      "Última actualización",
    ]

    const rows = filteredAmbulances.map((ambulance) => {
      const estado = statusConfig[getEstadoCalculado(ambulance)].label

      return [
        ambulance.id,
        ambulance.patente,
        ambulance.base,
        ambulance.modelo,
        ambulance.kilometrajeActual,
        getUsoDesdeMantencion(ambulance),
        getKmFaltantes(ambulance),
        ambulance.pautaPreventivaKm,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">Gestión de Ambulancias</h1>
          <p className="text-sm font-inter text-gray-600">
            Administración centralizada de la flota SAMU utilizada por el prototipo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-inter" onClick={exportToCsv}>
            Exportar Excel
          </Button>

          <Button className="font-inter" onClick={iniciarCreacion}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar ambulancia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-inter text-blue-700">Flota total</p>
          <p className="text-2xl font-inter font-bold text-blue-900">{totalFlota}</p>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-xs font-inter text-green-700">Operativas</p>
          <p className="text-2xl font-inter font-bold text-green-900">{operativas}</p>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-inter text-amber-700">Próximas</p>
          <p className="text-2xl font-inter font-bold text-amber-900">{proximas}</p>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-inter text-red-700">Mantención requerida</p>
          <p className="text-2xl font-inter font-bold text-red-900">{preventivas}</p>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <p className="text-xs font-inter text-orange-700">Correctivas</p>
          <p className="text-2xl font-inter font-bold text-orange-900">{correctivas}</p>
        </Card>

        <Card className="p-4 bg-gray-50 border-gray-200">
          <p className="text-xs font-inter text-gray-700">Fuera de servicio</p>
          <p className="text-2xl font-inter font-bold text-gray-900">{fueraServicio}</p>
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            onChange={(event) => setStatusFilter(event.target.value as AmbulanceStatus | "todos")}
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
            Mostrando {filteredAmbulances.length} de {totalFlota} ambulancias
          </p>

          {(searchTerm || statusFilter !== "todos") && (
            <Button variant="outline" size="sm" className="font-inter" onClick={limpiarFiltros}>
              <Filter className="w-4 h-4 mr-2" />
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Modelo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Km total</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Uso mantención</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Faltan</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredAmbulances.map((ambulance) => {
                const estadoCalculado = getEstadoCalculado(ambulance)
                const config = statusConfig[estadoCalculado]
                const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)
                const kmFaltantes = getKmFaltantes(ambulance)

                return (
                  <tr key={ambulance.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="font-semibold text-gray-900">{ambulance.id}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{ambulance.patente}</td>
                    <td className="px-4 py-3 text-gray-700">{ambulance.base}</td>
                    <td className="px-4 py-3 text-gray-700">{ambulance.modelo}</td>

                    <td className="px-4 py-3">
                      <Badge className={`${config.badgeClass} font-inter`}>
                        {config.shortLabel}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right font-medium">{formatKm(ambulance.kilometrajeActual)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatKm(usoDesdeMantencion)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatKm(kmFaltantes)}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          onClick={() => setSelectedAmbulance(ambulance)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver más detalles
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
      </Card>

      {selectedAmbulance && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Detalle completo de ambulancia {selectedAmbulance.id}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Información operacional, identificación y control preventivo por kilometraje.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedAmbulance(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-inter">
              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Código del móvil</p>
                <p className="font-semibold text-lg">{selectedAmbulance.id}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Patente</p>
                <p className="font-semibold text-lg">{selectedAmbulance.patente}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Estado calculado</p>
                <Badge className={`${statusConfig[getEstadoCalculado(selectedAmbulance)].badgeClass} mt-2`}>
                  {statusConfig[getEstadoCalculado(selectedAmbulance)].label}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border md:col-span-2">
                <p className="text-gray-500">Base / establecimiento</p>
                <p className="font-semibold">{selectedAmbulance.base}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Marca / modelo</p>
                <p className="font-semibold">{selectedAmbulance.modelo}</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-blue-700">Kilometraje total</p>
                <p className="font-bold text-xl text-blue-900">{formatKm(selectedAmbulance.kilometrajeActual)}</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-amber-700">Uso desde última mantención</p>
                <p className="font-bold text-xl text-amber-900">{formatKm(getUsoDesdeMantencion(selectedAmbulance))}</p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-green-700">Faltan para próxima mantención</p>
                <p className="font-bold text-xl text-green-900">{formatKm(getKmFaltantes(selectedAmbulance))}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Pauta preventiva configurada</p>
                <p className="font-semibold">{formatKm(selectedAmbulance.pautaPreventivaKm)}</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Última actualización</p>
                <p className="font-semibold">{selectedAmbulance.lastUpdate} hrs</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-gray-500">Avance preventivo</p>
                <p className="font-semibold">{Math.round(getProgressPercentage(selectedAmbulance))}%</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-inter text-gray-600 mb-2">Avance hacia mantención preventiva</p>
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${statusConfig[getEstadoCalculado(selectedAmbulance)].progressClass}`}
                  style={{ width: `${getProgressPercentage(selectedAmbulance)}%` }}
                />
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
                  onChange={(e) => setEditingForm({ ...editingForm, id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Patente</label>
                <Input
                  value={editingForm.patente}
                  onChange={(e) => setEditingForm({ ...editingForm, patente: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Base / establecimiento</label>
                <Input
                  value={editingForm.base}
                  onChange={(e) => setEditingForm({ ...editingForm, base: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Marca / modelo</label>
                <Input
                  value={editingForm.modelo}
                  onChange={(e) => setEditingForm({ ...editingForm, modelo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilometraje total</label>
                <Input
                  type="number"
                  value={editingForm.kilometrajeActual}
                  onChange={(e) => setEditingForm({ ...editingForm, kilometrajeActual: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Uso desde última mantención</label>
                <Input
                  type="number"
                  value={editingForm.usoDesdeMantencion}
                  onChange={(e) => setEditingForm({ ...editingForm, usoDesdeMantencion: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Faltan para próxima mantención</label>
                <Input
                  type="number"
                  value={editingForm.kmFaltantes}
                  onChange={(e) => setEditingForm({ ...editingForm, kmFaltantes: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado registrado</label>
                <select
                  value={editingForm.status}
                  onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value as AmbulanceStatus })}
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
                    {pendingChange.type === "crear"
                      ? "Revisa los datos antes de agregar esta ambulancia a la flota."
                      : "Revisa los datos modificados antes de guardarlos en la flota del prototipo."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChange(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <p className="text-sm font-inter text-amber-900">
                Esta acción modificará los datos globales de la ambulancia dentro del prototipo.
                Si confirmas, el cambio se reflejará en las demás vistas que utilicen esta información.
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
              <Button
                variant="outline"
                className="font-inter"
                onClick={volverAEditarCambio}
              >
                Volver a editar
              </Button>

              <Button
                className="font-inter bg-amber-600 hover:bg-amber-700"
                onClick={confirmarCambioAmbulancia}
              >
                Confirmar cambios
              </Button>
            </div>
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-white border border-red-200 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div>
                <h2 className="text-xl font-inter font-bold text-red-900">
                  Confirmar eliminación permanente
                </h2>
                <p className="text-sm font-inter text-red-700 mt-1">
                  Estás por eliminar la ambulancia {deleteTarget.id} ({deleteTarget.patente}). Esta acción quitará la unidad de la flota del prototipo.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm font-inter text-red-800">
              Esta acción es permanente dentro de la sesión actual. Confirma solo si corresponde eliminar esta ambulancia.
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>

              <Button className="font-inter bg-red-600 hover:bg-red-700" onClick={confirmarEliminacion}>
                Eliminar definitivamente
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}