import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Building2,
  CalendarClock,
  CheckCircle,
  Edit,
  Plus,
  RefreshCw,
  Save,
  Wrench,
  X,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import {
  useAmbulances,
  type Ambulance,
  type AmbulanceStatus,
} from "../AmbulanceContext"
import { useAuth } from "../AuthContext"

type MaintenanceType = "preventiva" | "correctiva"
type MaintenanceStatus =
  | "programada"
  | "en_taller"
  | "esperando_repuesto"
  | "finalizada"
  | "cancelada"

interface Workshop {
  id: string
  name: string
  contact_name: string | null
  contact_phone: string | null
  address: string | null
  status: "activo" | "pausado" | "inactivo"
  notes: string | null
}

interface MaintenanceRecord {
  id: string
  ambulance_code: string
  ambulance_patente: string | null
  maintenance_type: MaintenanceType
  reason: string
  workshop_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  estimated_days: number | null
  estimated_cost: number | null
  status: MaintenanceStatus
  notes: string | null
  archived_at: string | null
  created_at: string
}

interface MaintenanceForm {
  ambulanceCode: string
  maintenanceType: MaintenanceType
  reason: string
  workshopId: string
  scheduledDate: string
  scheduledTime: string
  estimatedDays: number
  estimatedCost: number
  status: MaintenanceStatus
  notes: string
}

interface WorkshopForm {
  id: string
  name: string
  contactName: string
  contactPhone: string
  address: string
  status: "activo" | "pausado" | "inactivo"
  notes: string
}

interface MaintenanceTabProps {
  initialRequest?: {
    ambulanceCode: string
    type: MaintenanceType
    nonce: number
  } | null
}

const emptyMaintenanceForm: MaintenanceForm = {
  ambulanceCode: "",
  maintenanceType: "preventiva",
  reason: "",
  workshopId: "",
  scheduledDate: "",
  scheduledTime: "",
  estimatedDays: 1,
  estimatedCost: 0,
  status: "programada",
  notes: "",
}

const emptyWorkshopForm: WorkshopForm = {
  id: "",
  name: "",
  contactName: "",
  contactPhone: "",
  address: "",
  status: "activo",
  notes: "",
}

const statusLabels: Record<MaintenanceStatus, string> = {
  programada: "Programada",
  en_taller: "En taller",
  esperando_repuesto: "Esperando repuesto",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

const statusBadgeClass: Record<MaintenanceStatus, string> = {
  programada: "bg-blue-100 text-blue-700 border-blue-200",
  en_taller: "bg-amber-100 text-amber-700 border-amber-200",
  esperando_repuesto: "bg-orange-100 text-orange-700 border-orange-200",
  finalizada: "bg-green-100 text-green-700 border-green-200",
  cancelada: "bg-gray-100 text-gray-700 border-gray-200",
}

const formatCurrency = (value: number | null) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const todayDate = new Date().toISOString().slice(0, 10)

const formatInteger = (value: number) =>
  Number(value || 0).toLocaleString("es-CL")

const parseIntegerInput = (value: string) => {
  const parsed = Number(value.replace(/\./g, "").replace(/[^\d]/g, ""))

  return Number.isNaN(parsed) ? 0 : parsed
}

const formatDate = (value: string | null) => {
  if (!value) return "Sin fecha"
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CL")
}

const ambulanceStatusForMaintenance = (
  type: MaintenanceType,
  status: MaintenanceStatus
): AmbulanceStatus => {
  if (status === "finalizada" || status === "cancelada") return "operativa"
  return type === "preventiva"
    ? "mantencion_preventiva"
    : "mantencion_correctiva"
}

export function MaintenanceTab({ initialRequest }: MaintenanceTabProps) {
  const { currentUser } = useAuth()
  const {
    ambulances,
    updateAmbulance,
    getAlertaPreventiva,
    getKmFaltantes,
    formatKm,
  } = useAmbulances()

  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [maintenanceForm, setMaintenanceForm] =
    useState<MaintenanceForm | null>(null)
  const [workshopForm, setWorkshopForm] = useState<WorkshopForm | null>(null)
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError("")

    const [recordsResponse, workshopsResponse] = await Promise.all([
      supabase
        .from("maintenance_records")
        .select(
          `
          id,
          ambulance_code,
          ambulance_patente,
          maintenance_type,
          reason,
          workshop_id,
          scheduled_date,
          scheduled_time,
          estimated_days,
          estimated_cost,
          status,
          notes,
          archived_at,
          created_at
        `
      )
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("maintenance_workshops")
        .select(
          `
          id,
          name,
          contact_name,
          contact_phone,
          address,
          status,
          notes
        `
        )
        .order("name", { ascending: true }),
    ])

    if (recordsResponse.error || workshopsResponse.error) {
      setError(
        recordsResponse.error?.message ||
          workshopsResponse.error?.message ||
          "No fue posible cargar la informacion de mantenimientos."
      )
      setRecords([])
      setWorkshops([])
      setIsLoading(false)
      return
    }

    setRecords((recordsResponse.data || []) as MaintenanceRecord[])
    setWorkshops((workshopsResponse.data || []) as Workshop[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeRecords = records.filter(
    (record) => record.status !== "finalizada" && record.status !== "cancelada"
  )

  const activeMaintenanceCodes = useMemo(() => {
    return new Set(activeRecords.map((record) => record.ambulance_code))
  }, [activeRecords])

  const activeMaintenanceByCode = useMemo(() => {
    return activeRecords.reduce<Record<string, MaintenanceRecord>>(
      (acc, record) => {
        acc[record.ambulance_code] = record
        return acc
      },
      {}
    )
  }, [activeRecords])

  const priorityAmbulances = useMemo(() => {
    return ambulances
      .filter(
        (ambulance) =>
          !activeMaintenanceCodes.has(ambulance.id) &&
          (getAlertaPreventiva(ambulance) ===
            "mantencion_preventiva_requerida" ||
            getAlertaPreventiva(ambulance) === "proxima_mantencion")
      )
      .sort((a, b) => getKmFaltantes(a) - getKmFaltantes(b))
  }, [activeMaintenanceCodes, ambulances, getAlertaPreventiva, getKmFaltantes])

  const startMaintenanceForAmbulance = (
    ambulance: Ambulance,
    type: MaintenanceType
  ) => {
    const activeRecord = activeMaintenanceByCode[ambulance.id]

    if (activeRecord) {
      window.alert(
        `${ambulance.id} ya tiene un mantenimiento activo (${statusLabels[activeRecord.status]}). Puedes ajustar ese registro en la agenda de mantenimientos.`
      )
      return
    }

    setMaintenanceForm({
      ...emptyMaintenanceForm,
      ambulanceCode: ambulance.id,
      maintenanceType: type,
      reason:
        type === "preventiva"
          ? "Mantencion preventiva por pauta de kilometraje"
          : "",
      status: "programada",
    })
  }

  useEffect(() => {
    if (!initialRequest) return

    const ambulance = ambulances.find(
      (item) => item.id === initialRequest.ambulanceCode
    )

    if (ambulance) {
      startMaintenanceForAmbulance(ambulance, initialRequest.type)
    }
  }, [initialRequest?.nonce])

  const saveMaintenance = async () => {
    if (!maintenanceForm) return

    const ambulance = ambulances.find(
      (item) => item.id === maintenanceForm.ambulanceCode
    )

    if (!ambulance) {
      window.alert("Debes seleccionar una ambulancia registrada.")
      return
    }

    if (!maintenanceForm.reason.trim()) {
      window.alert("Debes indicar el motivo del mantenimiento.")
      return
    }

    if (
      maintenanceForm.scheduledDate &&
      maintenanceForm.scheduledDate < todayDate
    ) {
      window.alert("La fecha agendada no puede ser anterior a la fecha actual.")
      return
    }

    const activeRecord = activeMaintenanceByCode[ambulance.id]

    if (activeRecord) {
      window.alert(
        `${ambulance.id} ya tiene un mantenimiento activo (${statusLabels[activeRecord.status]}). Finaliza o ajusta ese registro antes de crear otro.`
      )
      return
    }

    setIsSaving(true)

    const { error: insertError } = await supabase
      .from("maintenance_records")
      .insert({
        ambulance_code: ambulance.id,
        ambulance_patente: ambulance.patente,
        requested_by_user_id: currentUser?.id || null,
        requested_by_name: currentUser?.name || null,
        requested_by_role: currentUser?.role || null,
        maintenance_type: maintenanceForm.maintenanceType,
        reason: maintenanceForm.reason.trim(),
        source:
          maintenanceForm.maintenanceType === "preventiva"
            ? "kilometraje"
            : "manual",
        workshop_id: maintenanceForm.workshopId || null,
        scheduled_date: maintenanceForm.scheduledDate || null,
        scheduled_time: maintenanceForm.scheduledTime || null,
        estimated_days: Math.max(0, Number(maintenanceForm.estimatedDays || 0)),
        estimated_cost: Math.max(0, Number(maintenanceForm.estimatedCost || 0)),
        status: maintenanceForm.status,
        notes: maintenanceForm.notes.trim() || null,
      })

    if (insertError) {
      setIsSaving(false)
      window.alert(`No se pudo guardar el mantenimiento: ${insertError.message}`)
      return
    }

    await updateAmbulance(ambulance.id, {
      ...ambulance,
      status: ambulanceStatusForMaintenance(
        maintenanceForm.maintenanceType,
        maintenanceForm.status
      ),
    })

    setIsSaving(false)
    setMaintenanceForm(null)
    await loadData()
  }

  const updateMaintenanceStatus = async (
    record: MaintenanceRecord,
    nextStatus: MaintenanceStatus
  ) => {
    setIsSaving(true)

    const payload: Record<string, string | null> = {
      status: nextStatus,
    }

    if (nextStatus === "en_taller") {
      payload.started_at = new Date().toISOString()
    }

    if (nextStatus === "finalizada") {
      payload.finished_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from("maintenance_records")
      .update(payload)
      .eq("id", record.id)

    if (updateError) {
      setIsSaving(false)
      window.alert(`No se pudo actualizar el mantenimiento: ${updateError.message}`)
      return
    }

    const ambulance = ambulances.find(
      (item) => item.id === record.ambulance_code
    )

    if (ambulance) {
      await updateAmbulance(ambulance.id, {
        ...ambulance,
        status: ambulanceStatusForMaintenance(
          record.maintenance_type,
          nextStatus
        ),
      })
    }

    setIsSaving(false)
    await loadData()
  }

  const archiveMaintenanceRecord = async (record: MaintenanceRecord) => {
    if (record.status !== "finalizada" && record.status !== "cancelada") {
      window.alert("Solo puedes sacar de la lista mantenimientos finalizados o cancelados.")
      return
    }

    const confirmed = window.confirm(
      `¿Sacar de la lista el mantenimiento de ${record.ambulance_code}? El registro quedará guardado para estadísticas.`
    )

    if (!confirmed) return

    setIsSaving(true)

    const { error: archiveError } = await supabase
      .from("maintenance_records")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", record.id)

    setIsSaving(false)

    if (archiveError) {
      window.alert(`No se pudo sacar de la lista: ${archiveError.message}`)
      return
    }

    await loadData()
  }

  const saveWorkshop = async () => {
    if (!workshopForm) return

    if (!workshopForm.name.trim()) {
      window.alert("Debes indicar el nombre del taller.")
      return
    }

    setIsSaving(true)

    const payload = {
      name: workshopForm.name.trim(),
      contact_name: workshopForm.contactName.trim() || null,
      contact_phone: workshopForm.contactPhone.trim() || null,
      address: workshopForm.address.trim() || null,
      status: workshopForm.status,
      notes: workshopForm.notes.trim() || null,
    }

    const response = editingWorkshopId
      ? await supabase
          .from("maintenance_workshops")
          .update(payload)
          .eq("id", editingWorkshopId)
      : await supabase.from("maintenance_workshops").insert(payload)

    setIsSaving(false)

    if (response.error) {
      window.alert(`No se pudo guardar el taller: ${response.error.message}`)
      return
    }

    setWorkshopForm(null)
    setEditingWorkshopId(null)
    await loadData()
  }

  const editWorkshop = (workshop: Workshop) => {
    setEditingWorkshopId(workshop.id)
    setWorkshopForm({
      id: workshop.id,
      name: workshop.name,
      contactName: workshop.contact_name || "",
      contactPhone: workshop.contact_phone || "",
      address: workshop.address || "",
      status: workshop.status,
      notes: workshop.notes || "",
    })
  }

  const getWorkshopName = (id: string | null) => {
    if (!id) return "Sin taller asignado"
    return workshops.find((workshop) => workshop.id === id)?.name || "Taller no encontrado"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Mantenimientos
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Gestion de mantenimientos preventivos, correctivos, talleres y agenda de ingreso.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-inter" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button
            variant="outline"
            className="font-inter"
            onClick={() => {
              setEditingWorkshopId(null)
              setWorkshopForm({ ...emptyWorkshopForm })
            }}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Agregar taller
          </Button>

          <Button
            className="font-inter"
            onClick={() => setMaintenanceForm({ ...emptyMaintenanceForm })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Programar mantenimiento
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-5 border border-amber-200 bg-amber-50">
          <p className="text-sm font-inter font-semibold text-amber-900">
            La pestaña requiere las tablas de mantenimiento en Supabase.
          </p>
          <p className="text-sm font-inter text-amber-800 mt-1">
            {error}
          </p>
          <p className="text-sm font-inter text-amber-800 mt-2">
            Deje creado el SQL incluido en este cambio antes de usar esta seccion.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Activos</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {isLoading ? "..." : activeRecords.length}
          </p>
          <p className="text-xs font-inter text-blue-700">
            Programados o en proceso
          </p>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm font-inter text-amber-700">
            Prioridad preventiva
          </p>
          <p className="text-3xl font-inter font-bold text-amber-900">
            {priorityAmbulances.length}
          </p>
          <p className="text-xs font-inter text-amber-700">
            Por pauta de kilometraje
          </p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Talleres activos</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {workshops.filter((workshop) => workshop.status === "activo").length}
          </p>
          <p className="text-xs font-inter text-green-700">
            Disponibles para asignacion
          </p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">Registros</p>
          <p className="text-3xl font-inter font-bold text-gray-900">
            {isLoading ? "..." : records.length}
          </p>
          <p className="text-xs font-inter text-gray-700">
            Historial de mantenimiento
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 border border-gray-200 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Agenda y estado de mantenimientos
            </h2>
          </div>

          {isLoading ? (
            <p className="text-sm font-inter text-gray-500">
              Cargando mantenimientos...
            </p>
          ) : records.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-inter font-semibold text-gray-700">
                No hay mantenimientos registrados.
              </p>
              <p className="text-sm font-inter text-gray-500 mt-1">
                Puede programar mantenimientos preventivos o correctivos desde esta pestaña.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4">Movil</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Taller</th>
                    <th className="py-3 pr-4">Agenda</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Costo</th>
                    <th className="py-3 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900">
                          {record.ambulance_code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.ambulance_patente || "Sin patente"}
                        </p>
                      </td>
                      <td className="py-3 pr-4 capitalize">
                        {record.maintenance_type}
                      </td>
                      <td className="py-3 pr-4">
                        {getWorkshopName(record.workshop_id)}
                      </td>
                      <td className="py-3 pr-4">
                        <p>{formatDate(record.scheduled_date)}</p>
                        <p className="text-xs text-gray-500">
                          {record.scheduled_time || "Sin hora"} · {record.estimated_days || 0} dia(s)
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`${statusBadgeClass[record.status]} font-inter`}
                        >
                          {statusLabels[record.status]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(record.estimated_cost)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          {record.status === "programada" && (
                            <Button
                              size="sm"
                              className="font-inter"
                              disabled={isSaving}
                              onClick={() =>
                                updateMaintenanceStatus(record, "en_taller")
                              }
                            >
                              Confirmar llegada
                            </Button>
                          )}

                          {(record.status === "programada" ||
                            record.status === "en_taller" ||
                            record.status === "esperando_repuesto") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-inter"
                              disabled={isSaving}
                              onClick={() =>
                                updateMaintenanceStatus(record, "finalizada")
                              }
                            >
                              Finalizar
                            </Button>
                          )}

                          {(record.status === "finalizada" ||
                            record.status === "cancelada") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-inter"
                              disabled={isSaving}
                              onClick={() => archiveMaintenanceRecord(record)}
                            >
                              Sacar de lista
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Sugerencias preventivas
            </h2>
          </div>

          {priorityAmbulances.length === 0 ? (
            <p className="text-sm font-inter text-gray-500">
              No hay ambulancias cercanas a la pauta preventiva.
            </p>
          ) : (
            <div className="space-y-3">
              {priorityAmbulances.map((ambulance) => (
                <div
                  key={ambulance.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-inter font-bold text-gray-900">
                        {ambulance.id} · {ambulance.patente}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        Faltan {formatKm(getKmFaltantes(ambulance))}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="font-inter"
                      onClick={() =>
                        startMaintenanceForAmbulance(ambulance, "preventiva")
                      }
                    >
                      MP
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Talleres
          </h2>
        </div>

        {workshops.length === 0 ? (
          <p className="text-sm font-inter text-gray-500">
            No hay talleres registrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workshops.map((workshop) => (
              <div
                key={workshop.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-inter font-bold text-gray-900">
                      {workshop.name}
                    </p>
                    <p className="text-xs font-inter text-gray-500">
                      {workshop.contact_phone || "Sin telefono registrado"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="font-inter"
                    onClick={() => editWorkshop(workshop)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200 font-inter">
                    {workshop.status}
                  </Badge>
                  {workshop.contact_name && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-inter">
                      {workshop.contact_name}
                    </Badge>
                  )}
                </div>

                {workshop.address && (
                  <p className="text-xs font-inter text-gray-500 mt-3">
                    {workshop.address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {maintenanceForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  Programar mantenimiento
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Al guardar, el estado operativo de la ambulancia se actualiza segun el tipo de mantenimiento.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaintenanceForm(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Ambulancia</label>
                <select
                  value={maintenanceForm.ambulanceCode}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      ambulanceCode: event.target.value,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">Seleccionar</option>
                  {ambulances.map((ambulance) => (
                    <option key={ambulance.id} value={ambulance.id}>
                      {ambulance.id} · {ambulance.patente}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tipo</label>
                <select
                  value={maintenanceForm.maintenanceType}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      maintenanceType: event.target.value as MaintenanceType,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="preventiva">Preventiva</option>
                  <option value="correctiva">Correctiva</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Motivo</label>
                <Input
                  value={maintenanceForm.reason}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      reason: event.target.value,
                    })
                  }
                  placeholder="Ej: pauta por kilometraje, colision, falla mecanica"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Taller</label>
                <select
                  value={maintenanceForm.workshopId}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      workshopId: event.target.value,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">Sin taller asignado</option>
                  {workshops.map((workshop) => (
                    <option key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  value={maintenanceForm.status}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      status: event.target.value as MaintenanceStatus,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Fecha agendada</label>
                <Input
                  type="date"
                  min={todayDate}
                  value={maintenanceForm.scheduledDate}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      scheduledDate: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Hora agendada</label>
                <Input
                  type="time"
                  value={maintenanceForm.scheduledTime}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      scheduledTime: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Dias estimados</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatInteger(maintenanceForm.estimatedDays)}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      estimatedDays: parseIntegerInput(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Costo estimado</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatInteger(maintenanceForm.estimatedCost)}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      estimatedCost: parseIntegerInput(event.target.value),
                    })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Observaciones</label>
                <Input
                  value={maintenanceForm.notes}
                  onChange={(event) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      notes: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="font-inter"
                onClick={() => setMaintenanceForm(null)}
              >
                Cancelar
              </Button>

              <Button
                className="font-inter"
                onClick={saveMaintenance}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar mantenimiento"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {workshopForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  {editingWorkshopId ? "Editar taller" : "Agregar taller"}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Registra datos de contacto y disponibilidad del taller.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkshopForm(null)
                  setEditingWorkshopId(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Nombre del taller</label>
                <Input
                  value={workshopForm.name}
                  onChange={(event) =>
                    setWorkshopForm({ ...workshopForm, name: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Contacto</label>
                <Input
                  value={workshopForm.contactName}
                  onChange={(event) =>
                    setWorkshopForm({
                      ...workshopForm,
                      contactName: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Telefono</label>
                <Input
                  value={workshopForm.contactPhone}
                  onChange={(event) =>
                    setWorkshopForm({
                      ...workshopForm,
                      contactPhone: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  value={workshopForm.status}
                  onChange={(event) =>
                    setWorkshopForm({
                      ...workshopForm,
                      status: event.target.value as WorkshopForm["status"],
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Direccion</label>
                <Input
                  value={workshopForm.address}
                  onChange={(event) =>
                    setWorkshopForm({
                      ...workshopForm,
                      address: event.target.value,
                    })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Notas</label>
                <Input
                  value={workshopForm.notes}
                  onChange={(event) =>
                    setWorkshopForm({ ...workshopForm, notes: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="font-inter"
                onClick={() => {
                  setWorkshopForm(null)
                  setEditingWorkshopId(null)
                }}
              >
                Cancelar
              </Button>

              <Button className="font-inter" onClick={saveWorkshop} disabled={isSaving}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar taller"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
