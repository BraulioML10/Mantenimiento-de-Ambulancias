import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  Ambulance,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useAmbulances, type Ambulance as AmbulanceType } from "../AmbulanceContext"
import { useAuth } from "../AuthContext"

type ShiftType =
  | "Turno 08:00 a 20:00 horas"
  | "Turno 20:00 a 08:00 horas"
  | "Otro"

type InspectionStatus = "" | "Bueno" | "Malo" | "No aplica"
type DocumentStatus = "" | "Sí" | "No"

interface InspectionItem {
  category: string
  item: string
}

interface InspectionAnswer {
  status: InspectionStatus
  observation: string
}

interface DocumentAnswer {
  status: DocumentStatus
  observation: string
}

interface DamageReport {
  localId: string
  damageType: string
  affectedArea: string
  description: string
}

interface RouteFormState {
  shiftType: ShiftType
  formDate: string
  startTime: string
  endTime: string
  startKm: number
  endKm: number
  destinationReason: string
  fuelLiters: string
  fuelValue: string
  fuelKm: string
  deliveryObservations: string
  receptionObservations: string
  fuelLevel: string
  manometer: DocumentStatus
  damageReports: DamageReport[]
}

interface SavedRouteForm {
  id: string
  ambulance_code: string
  ambulance_patente: string
  registered_by_name: string
  registered_by_role: string
  shift_type: string
  form_date: string
  start_km: number
  end_km: number
  total_km: number
  destination_reason: string
  status: string
  created_at: string
}

const today = new Date().toISOString().slice(0, 10)

const createEmptyDamageReport = (): DamageReport => ({
  localId: `${Date.now()}-${Math.random()}`,
  damageType: "",
  affectedArea: "",
  description: "",
})

const damageTypeOptions = [
  {
    value: "Q: Quebrado",
    label: "Q: Quebrado",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "A: Abollado",
    label: "A: Abollado",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    value: "F: Falla",
    label: "F: Falla",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  {
    value: "R: Raspón",
    label: "R: Raspón",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
]

const affectedAreaOptions = [
  "Frontal",
  "Posterior",
  "Lateral izquierdo",
  "Lateral derecho",
  "Techo",
  "Cabina conductor",
  "Cabina sanitaria",
  "Puertas",
  "Vidrios",
  "Luces",
  "Parachoques",
  "Otro",
]

const emptyRouteForm: RouteFormState = {
  shiftType: "Turno 08:00 a 20:00 horas",
  formDate: today,
  startTime: "",
  endTime: "",
  startKm: 0,
  endKm: 0,
  destinationReason: "",
  fuelLiters: "",
  fuelValue: "",
  fuelKm: "",
  deliveryObservations: "",
  receptionObservations: "",
  fuelLevel: "",
  manometer: "",
  damageReports: [],
}

const inspectionItems: InspectionItem[] = [
  { category: "Niveles y fluidos", item: "Control nivel aceite motor" },
  { category: "Niveles y fluidos", item: "Control nivel aceite hidráulico dirección" },
  { category: "Niveles y fluidos", item: "Control nivel líquido refrigerante" },
  { category: "Niveles y fluidos", item: "Control nivel líquido de freno y embrague" },
  { category: "Niveles y fluidos", item: "Control nivel líquido limpia parabrisas" },

  { category: "Tren, frenos y neumáticos", item: "Control estado tren delantero" },
  { category: "Tren, frenos y neumáticos", item: "Control estado freno trasero" },
  { category: "Tren, frenos y neumáticos", item: "Control estado presión de neumático delantero izquierdo" },
  { category: "Tren, frenos y neumáticos", item: "Control estado presión de neumático delantero derecho" },
  { category: "Tren, frenos y neumáticos", item: "Control estado presión de neumático trasero izquierdo" },
  { category: "Tren, frenos y neumáticos", item: "Control estado presión de neumático trasero derecho" },
  { category: "Tren, frenos y neumáticos", item: "Estado de neumático auxiliar" },

  { category: "Funcionamiento mecánico", item: "Control de arranque o partida motor ambulancia" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento limpia parabrisas, plumillas y eyector de agua" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento calefacción y A/C cabina conductor" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento bocina vehículo y cambio tono sirena" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento embrague en cabina conductor" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento caja de cambios en cabina conductor" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento freno auxiliar o de mano" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento cortacorriente" },
  { category: "Funcionamiento mecánico", item: "Control funcionamiento puenteador de batería" },

  { category: "Cabina, comunicaciones y electricidad", item: "Control luces alerta, testigo, cuadro instrumento panel cabina conductor" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento radio musical" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento radio UHF comunicaciones" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento radio VHF comunicaciones" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento portátil de comunicación del conductor" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento alzavidrios manual o eléctrico" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento luces sobre conductor y copiloto" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control funcionamiento inversor corriente detrás asiento conductor" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control estado extintor cabina conductor" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control permanencia alargador 220 V cabina conductor" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control estado ventana o puerta divide cabina conductor y cabina sanitaria" },
  { category: "Cabina, comunicaciones y electricidad", item: "Revisión y estado de asiento conductor y copiloto" },
  { category: "Cabina, comunicaciones y electricidad", item: "Estado de parabrisas" },
  { category: "Cabina, comunicaciones y electricidad", item: "Control estado enchufe 220 V puerta acceso conductor" },

  { category: "Luces y señalización", item: "Control funcionamiento luces focos principales altas y bajas" },
  { category: "Luces y señalización", item: "Control funcionamiento luces intermitentes derecha e izquierda estacionado" },
  { category: "Luces y señalización", item: "Control funcionamiento neblineros" },
  { category: "Luces y señalización", item: "Control funcionamiento luces estroboscópicas máscara y focos principales" },
  { category: "Luces y señalización", item: "Control funcionamiento barra superior de luces" },
  { category: "Luces y señalización", item: "Control funcionamiento luces de trocha y luces faeneras" },
  { category: "Luces y señalización", item: "Control luces laterales emergencia lado izquierdo azul, blanco y rojo" },
  { category: "Luces y señalización", item: "Control luces laterales emergencia lado derecho azul y rojo" },
  { category: "Luces y señalización", item: "Control luces estroboscópicas superiores traseras balizas" },
  { category: "Luces y señalización", item: "Control tercera luz de freno superior trasera" },
  { category: "Luces y señalización", item: "Control foco faenero trasero" },
  { category: "Luces y señalización", item: "Luces de freno, estacionamiento, intermitentes y focos traseros" },
  { category: "Luces y señalización", item: "Control luces estroboscópicas puerta trasera interna" },
  { category: "Luces y señalización", item: "Control funcionamiento escalón adicional acceso puertas traseras" },
  { category: "Luces y señalización", item: "Control estado puerta lateral" },
]

const documentItems = [
  "Permiso de circulación",
  "Revisión técnica",
  "Seguro obligatorio",
  "Tarjeta de combustible",
]

const buildInspectionAnswers = () => {
  return inspectionItems.reduce<Record<string, InspectionAnswer>>((acc, item) => {
    acc[item.item] = {
      status: "",
      observation: "",
    }

    return acc
  }, {})
}

const buildDocumentAnswers = () => {
  return documentItems.reduce<Record<string, DocumentAnswer>>((acc, item) => {
    acc[item] = {
      status: "",
      observation: "",
    }

    return acc
  }, {})
}

export function QRFormsTab() {
  const { currentUser } = useAuth()
  const { ambulances, formatKm } = useAmbulances()

  const [savedForms, setSavedForms] = useState<SavedRouteForm[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [mobileCode, setMobileCode] = useState("")
  const [pendingAmbulance, setPendingAmbulance] = useState<AmbulanceType | null>(null)
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceType | null>(null)
  const [lookupError, setLookupError] = useState("")

  const [form, setForm] = useState<RouteFormState>(emptyRouteForm)
  const [inspectionAnswers, setInspectionAnswers] = useState(buildInspectionAnswers)
  const [documentAnswers, setDocumentAnswers] = useState(buildDocumentAnswers)
  const [selectedSavedForm, setSelectedSavedForm] = useState<SavedRouteForm | null>(null)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  const totalKm = Math.max(0, Number(form.endKm) - Number(form.startKm))

  const groupedInspectionItems = useMemo(() => {
    return inspectionItems.reduce<Record<string, InspectionItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [])

  const loadSavedForms = async () => {
    setIsLoadingHistory(true)

    const { data, error } = await supabase
      .from("shift_route_forms")
      .select(
        `
        id,
        ambulance_code,
        ambulance_patente,
        registered_by_name,
        registered_by_role,
        shift_type,
        form_date,
        start_km,
        end_km,
        total_km,
        destination_reason,
        status,
        created_at
      `
      )
      .order("created_at", { ascending: false })

    if (!error) {
      setSavedForms((data || []) as SavedRouteForm[])
    }

    setIsLoadingHistory(false)
  }

  useEffect(() => {
    loadSavedForms()
  }, [])

  const resetCreation = () => {
    setIsCreating(false)
    setMobileCode("")
    setPendingAmbulance(null)
    setSelectedAmbulance(null)
    setLookupError("")
    setForm(emptyRouteForm)
    setInspectionAnswers(buildInspectionAnswers())
    setDocumentAnswers(buildDocumentAnswers())
    setHasTriedSubmit(false)
  }

  const buscarAmbulancia = () => {
    const code = mobileCode.trim().toUpperCase()

    setLookupError("")
    setPendingAmbulance(null)

    if (!code) {
      setLookupError("Debes ingresar el código del móvil antes de continuar.")
      return
    }

    const found = ambulances.find((ambulance) => ambulance.id.toUpperCase() === code)

    if (!found) {
      setLookupError("No existe una ambulancia registrada con ese código móvil.")
      return
    }

    setPendingAmbulance(found)
  }

  const confirmarAmbulancia = () => {
    if (!pendingAmbulance) return

    setSelectedAmbulance(pendingAmbulance)
    setForm({
      ...emptyRouteForm,
      startKm: pendingAmbulance.kilometrajeActual,
      endKm: pendingAmbulance.kilometrajeActual,
    })
  }

  const updateInspectionAnswer = (
    item: string,
    field: keyof InspectionAnswer,
    value: string
  ) => {
    setInspectionAnswers((prev) => ({
      ...prev,
      [item]: {
        ...prev[item],
        [field]: value,
      },
    }))
  }

  const updateDocumentAnswer = (
    item: string,
    field: keyof DocumentAnswer,
    value: string
  ) => {
    setDocumentAnswers((prev) => ({
      ...prev,
      [item]: {
        ...prev[item],
        [field]: value,
      },
    }))
  }

  const addDamageReport = () => {
    setForm((prev) => ({
      ...prev,
      damageReports: [...prev.damageReports, createEmptyDamageReport()],
    }))
  }

  const updateDamageReport = (
    localId: string,
    field: keyof Omit<DamageReport, "localId">,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      damageReports: prev.damageReports.map((damage) =>
        damage.localId === localId
          ? {
              ...damage,
              [field]: value,
            }
          : damage
      ),
    }))
  }

  const removeDamageReport = (localId: string) => {
    setForm((prev) => ({
      ...prev,
      damageReports: prev.damageReports.filter(
        (damage) => damage.localId !== localId
      ),
    }))
  }

  const validateForm = () => {
    if (!selectedAmbulance) {
      return "Debes seleccionar y confirmar una ambulancia registrada."
    }

    if (!form.shiftType || !form.formDate) {
      return "Debes completar el turno y la fecha."
    }

    if (!form.destinationReason.trim()) {
      return "El campo motivo y destino es obligatorio."
    }

    if (Number(form.startKm) < 0 || Number(form.endKm) < 0) {
      return "Los kilometrajes no pueden ser negativos."
    }

    if (Number(form.endKm) < Number(form.startKm)) {
      return "El kilometraje de llegada no puede ser menor que el kilometraje de salida."
    }

    const unansweredInspection = inspectionItems.find(
      (item) => !inspectionAnswers[item.item]?.status
    )

    if (unansweredInspection) {
      return `Falta responder el ítem de inspección: ${unansweredInspection.item}`
    }

    const missingObservation = inspectionItems.find((item) => {
      const answer = inspectionAnswers[item.item]

      return (
        (answer.status === "Malo" || answer.status === "No aplica") &&
        !answer.observation.trim()
      )
    })

    if (false && missingObservation) {
      return `Debes agregar observación en el ítem: ${missingObservation.item}`
    }

    const unansweredDocument = documentItems.find(
      (item) => !documentAnswers[item]?.status
    )

    if (unansweredDocument) {
      return `Falta responder el documento original: ${unansweredDocument}`
    }

    if (!form.fuelLevel) {
      return "Debes indicar el nivel de combustible."
    }

    if (!form.manometer) {
      return "Debes indicar si permanece el manómetro en la ambulancia."
    }

    const incompleteDamage = form.damageReports.find(
      (damage) =>
        !damage.damageType ||
        !damage.affectedArea ||
        !damage.description.trim()
    )

    if (incompleteDamage) {
      return "Si agregas un daño, debes completar tipo de daño, zona afectada y descripción."
    }

    return ""
  }

  const guardarFormulario = async () => {
    if (!currentUser || !selectedAmbulance) return

    setHasTriedSubmit(true)

    const validationError = validateForm()

    if (validationError) {
      window.alert(validationError)
      return
    }

    setIsSaving(true)

    const inspectionItemsPayload = inspectionItems.map((item) => ({
      category: item.category,
      item_name: item.item,
      status: inspectionAnswers[item.item].status,
      observation: inspectionAnswers[item.item].observation.trim() || null,
    }))

    const documentChecksPayload = [
      ...documentItems.map((item) => ({
        item_name: item,
        status: documentAnswers[item].status,
        observation: documentAnswers[item].observation.trim() || null,
      })),
      {
        item_name: "Nivel de combustible",
        status: form.fuelLevel,
        observation: null,
      },
      {
        item_name: "Permanencia de manómetro para toma de presión",
        status: form.manometer,
        observation: null,
      },
    ]

    const damageReportsPayload = form.damageReports.map((damage) => ({
      damage_type: damage.damageType,
      affected_area: damage.affectedArea,
      description: damage.description.trim(),
    }))

    const { error } = await supabase.from("shift_route_forms").insert({
      ambulance_code: selectedAmbulance.id,
      ambulance_patente: selectedAmbulance.patente,
      ambulance_base: selectedAmbulance.base,
      ambulance_modelo: selectedAmbulance.modelo,

      registered_by_user_id: currentUser.id,
      registered_by_name: currentUser.name,
      registered_by_role: currentUser.role,

      shift_type: form.shiftType,
      form_date: form.formDate,

      start_time: form.startTime || null,
      end_time: form.endTime || null,

      start_km: Number(form.startKm),
      end_km: Number(form.endKm),

      destination_reason: form.destinationReason.trim(),

      fuel_liters: form.fuelLiters ? Number(form.fuelLiters) : null,
      fuel_value: form.fuelValue ? Number(form.fuelValue) : null,
      fuel_km: form.fuelKm ? Number(form.fuelKm) : null,

      delivery_observations: form.deliveryObservations.trim() || null,
      reception_observations: form.receptionObservations.trim() || null,

      inspection_items: inspectionItemsPayload,
      document_checks: documentChecksPayload,
      damage_reports: damageReportsPayload,

      status: "Enviado",
    })

    setIsSaving(false)

    if (error) {
      window.alert(`No se pudo guardar el formulario: ${error.message}`)
      return
    }

    window.alert("Formulario guardado correctamente.")
    resetCreation()
    loadSavedForms()
  }

  const requiredInputClass = (isMissing: boolean) =>
    hasTriedSubmit && isMissing
      ? "border-red-400 bg-red-50 focus-visible:ring-red-200"
      : ""

  const requiredSelectClass = (isMissing: boolean, extraClass = "") =>
    `${extraClass} h-10 rounded-md border bg-white px-3 text-sm ${
      hasTriedSubmit && isMissing
        ? "border-red-400 bg-red-50"
        : "border-gray-300"
    }`

  const missingText = (isMissing: boolean) =>
    hasTriedSubmit && isMissing ? (
      <p className="text-xs font-inter text-red-600 mt-1">
        Campo obligatorio pendiente.
      </p>
    ) : null

  if (!isCreating) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-inter font-bold text-gray-900">
              Formularios
            </h1>
            <p className="text-sm font-inter text-gray-600">
              Registro de hoja de ruta por turno, inspección del conductor,
              documentos, combustible y daños asociados a una ambulancia registrada.
            </p>
          </div>

          <Button className="font-inter" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear hoja de ruta
          </Button>
        </div>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Historial de formularios
            </h2>
          </div>

          {isLoadingHistory ? (
            <p className="text-sm font-inter text-gray-500">
              Cargando formularios registrados...
            </p>
          ) : savedForms.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm font-inter text-gray-500">
              Aún no hay formularios registrados.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm font-inter">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Móvil
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Patente
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Turno
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Registrado por
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Recorrido
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {savedForms.map((savedForm) => (
                    <tr
                      key={savedForm.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-700">
                        {savedForm.form_date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {savedForm.ambulance_code}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {savedForm.ambulance_patente}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {savedForm.shift_type}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {savedForm.registered_by_name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatKm(savedForm.total_km)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-inter">
                          {savedForm.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          onClick={() => setSelectedSavedForm(savedForm)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selectedSavedForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 bg-white border border-gray-200 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-inter font-bold text-gray-900">
                    Hoja de ruta registrada
                  </h2>
                  <p className="text-sm font-inter text-gray-600">
                    {selectedSavedForm.ambulance_code} ·{" "}
                    {selectedSavedForm.ambulance_patente}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSavedForm(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSavedForm.form_date}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Turno</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSavedForm.shift_type}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Registrado por</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSavedForm.registered_by_name}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Rol</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSavedForm.registered_by_role}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Kilometraje salida</p>
                  <p className="font-semibold text-gray-900">
                    {formatKm(selectedSavedForm.start_km)}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Kilometraje llegada</p>
                  <p className="font-semibold text-gray-900">
                    {formatKm(selectedSavedForm.end_km)}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 md:col-span-2">
                  <p className="text-gray-500">Motivo y destino</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSavedForm.destination_reason}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Hoja de Ruta por Turno
          </h1>
          <p className="text-sm font-inter text-gray-600">
            El formulario quedará asociado al móvil, patente y usuario que inició sesión.
          </p>
        </div>

        <Button variant="outline" className="font-inter" onClick={resetCreation}>
          Cancelar
        </Button>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Validación de móvil
          </h2>
        </div>

        {!selectedAmbulance ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
              <Input
                value={mobileCode}
                onChange={(event) => setMobileCode(event.target.value.toUpperCase())}
                placeholder="Ingrese código móvil, ej: R-61"
                className="font-inter"
              />

              <Button className="font-inter" onClick={buscarAmbulancia}>
                Buscar móvil
              </Button>
            </div>

            {lookupError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-inter text-red-700">
                {lookupError}
              </div>
            )}

            {pendingAmbulance && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />

                  <div className="flex-1">
                    <h3 className="text-sm font-inter font-bold text-amber-900">
                      Confirmar ambulancia
                    </h3>
                    <p className="text-sm font-inter text-amber-800 mt-1">
                      ¿Confirmas que este formulario corresponde a esta unidad?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-sm font-inter">
                      <div>
                        <p className="text-amber-700">Móvil</p>
                        <p className="font-bold text-amber-950">
                          {pendingAmbulance.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-amber-700">Patente</p>
                        <p className="font-bold text-amber-950">
                          {pendingAmbulance.patente}
                        </p>
                      </div>

                      <div>
                        <p className="text-amber-700">Base</p>
                        <p className="font-bold text-amber-950">
                          {pendingAmbulance.base}
                        </p>
                      </div>

                      <div>
                        <p className="text-amber-700">Modelo</p>
                        <p className="font-bold text-amber-950">
                          {pendingAmbulance.modelo}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="font-inter bg-white"
                        onClick={() => setPendingAmbulance(null)}
                      >
                        No, buscar otro
                      </Button>

                      <Button className="font-inter" onClick={confirmarAmbulancia}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar móvil
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />

              <div>
                <h3 className="text-sm font-inter font-bold text-green-900">
                  Móvil confirmado
                </h3>
                <p className="text-sm font-inter text-green-800 mt-1">
                  {selectedAmbulance.id} · {selectedAmbulance.patente} ·{" "}
                  {selectedAmbulance.base}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {selectedAmbulance && currentUser && (
        <>
          <Card className="p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Ambulance className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-inter font-bold text-gray-900">
                Datos del turno
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Registrado por</label>
                <Input value={`${currentUser.name} · ${currentUser.role}`} disabled />
              </div>

              <div>
                <label className="text-sm text-gray-600">Turno (obligatorio)</label>
                <select
                  value={form.shiftType}
                  onChange={(event) =>
                    setForm({ ...form, shiftType: event.target.value as ShiftType })
                  }
                  className={requiredSelectClass(!form.shiftType, "w-full")}
                >
                  <option value="Turno 08:00 a 20:00 horas">
                    Turno 08:00 a 20:00 horas
                  </option>
                  <option value="Turno 20:00 a 08:00 horas">
                    Turno 20:00 a 08:00 horas
                  </option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Fecha (obligatorio)</label>
                <Input
                  type="date"
                  value={form.formDate}
                  onChange={(event) =>
                    setForm({ ...form, formDate: event.target.value })
                  }
                  className={requiredInputClass(!form.formDate)}
                />
                {missingText(!form.formDate)}
              </div>

              <div>
                <label className="text-sm text-gray-600">Hora salida</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm({ ...form, startTime: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Hora llegada</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm({ ...form, endTime: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Motivo y destino (obligatorio)</label>
                <Input
                  value={form.destinationReason}
                  onChange={(event) =>
                    setForm({ ...form, destinationReason: event.target.value })
                  }
                  placeholder="Ej: traslado, retorno a base, procedimiento..."
                  className={requiredInputClass(!form.destinationReason.trim())}
                />
                {missingText(!form.destinationReason.trim())}
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilometraje salida (obligatorio)</label>
                <Input
                  type="number"
                  value={form.startKm}
                  onChange={(event) =>
                    setForm({ ...form, startKm: Number(event.target.value) })
                  }
                  className={requiredInputClass(Number(form.startKm) < 0)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilometraje llegada (obligatorio)</label>
                <Input
                  type="number"
                  value={form.endKm}
                  onChange={(event) =>
                    setForm({ ...form, endKm: Number(event.target.value) })
                  }
                  className={requiredInputClass(
                    Number(form.endKm) < Number(form.startKm)
                  )}
                />
                {missingText(Number(form.endKm) < Number(form.startKm))}
              </div>

              <div>
                <label className="text-sm text-gray-600">Recorrido calculado</label>
                <Input value={formatKm(totalKm)} disabled />
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-inter font-bold text-gray-900">
                Combustible y observaciones
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Carga combustible litros</label>
                <Input
                  type="number"
                  value={form.fuelLiters}
                  onChange={(event) =>
                    setForm({ ...form, fuelLiters: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Valor combustible</label>
                <Input
                  type="number"
                  value={form.fuelValue}
                  onChange={(event) =>
                    setForm({ ...form, fuelValue: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Kilometraje asociado a carga</label>
                <Input
                  type="number"
                  value={form.fuelKm}
                  onChange={(event) =>
                    setForm({ ...form, fuelKm: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Nivel de combustible (obligatorio)</label>
                <select
                  value={form.fuelLevel}
                  onChange={(event) =>
                    setForm({ ...form, fuelLevel: event.target.value })
                  }
                  className={requiredSelectClass(!form.fuelLevel, "w-full")}
                >
                  <option value="">Seleccionar</option>
                  <option value="1/4">1/4</option>
                  <option value="1/2">1/2</option>
                  <option value="3/4">3/4</option>
                  <option value="Lleno">Lleno</option>
                </select>
                {missingText(!form.fuelLevel)}
              </div>

              <div>
                <label className="text-sm text-gray-600">Manómetro (obligatorio)</label>
                <select
                  value={form.manometer}
                  onChange={(event) =>
                    setForm({ ...form, manometer: event.target.value as DocumentStatus })
                  }
                  className={requiredSelectClass(!form.manometer, "w-full")}
                >
                  <option value="">Seleccionar</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
                {missingText(!form.manometer)}
              </div>

              <div className="md:col-span-3">
                <label className="text-sm text-gray-600">Observaciones de entrega</label>
                <Input
                  value={form.deliveryObservations}
                  onChange={(event) =>
                    setForm({ ...form, deliveryObservations: event.target.value })
                  }
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm text-gray-600">Observaciones de recepción</label>
                <Input
                  value={form.receptionObservations}
                  onChange={(event) =>
                    setForm({ ...form, receptionObservations: event.target.value })
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-inter font-bold text-gray-900">
                Control de inspección del conductor
              </h2>
            </div>

            <p className="text-sm font-inter text-gray-600 mb-4">
              Todos los ítems deben quedar respondidos. La observación queda disponible para detallar novedades cuando corresponda.
            </p>

            <div className="space-y-6">
              {Object.entries(groupedInspectionItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-inter font-bold text-gray-900 mb-3">
                    {category}
                  </h3>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const answer = inspectionAnswers[item.item]

                      return (
                        <div
                          key={item.item}
                          className={`grid grid-cols-1 lg:grid-cols-[1.4fr_180px_1fr] gap-3 rounded-lg border p-3 ${
                            hasTriedSubmit && !answer.status
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <p className="text-sm font-inter text-gray-800">
                            {item.item}
                          </p>

                          <select
                            value={answer.status}
                            onChange={(event) =>
                              updateInspectionAnswer(
                                item.item,
                                "status",
                                event.target.value
                              )
                            }
                            className={requiredSelectClass(
                              !answer.status,
                              "font-inter"
                            )}
                          >
                            <option value="">Seleccionar</option>
                            <option value="Bueno">Bueno</option>
                            <option value="Malo">Malo</option>
                            <option value="No aplica">No aplica</option>
                          </select>

                          <Input
                            value={answer.observation}
                            onChange={(event) =>
                              updateInspectionAnswer(
                                item.item,
                                "observation",
                                event.target.value
                              )
                            }
                            placeholder="Observación"
                            className="font-inter"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-inter font-bold text-gray-900">
                Documentos originales
              </h2>
            </div>

            <div className="space-y-3">
              {documentItems.map((item) => {
                const answer = documentAnswers[item]

                return (
                  <div
                    key={item}
                    className={`grid grid-cols-1 lg:grid-cols-[1fr_180px_1fr] gap-3 rounded-lg border p-3 ${
                      hasTriedSubmit && !answer.status
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-inter text-gray-800">{item}</p>

                    <select
                      value={answer.status}
                      onChange={(event) =>
                        updateDocumentAnswer(
                          item,
                          "status",
                          event.target.value
                        )
                      }
                      className={requiredSelectClass(!answer.status, "font-inter")}
                    >
                      <option value="">Seleccionar</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>

                    <Input
                      value={answer.observation}
                      onChange={(event) =>
                        updateDocumentAnswer(
                          item,
                          "observation",
                          event.target.value
                        )
                      }
                      placeholder="Observación"
                      className="font-inter"
                    />
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gray-700" />
                <div>
                  <h2 className="text-lg font-inter font-bold text-gray-900">
                    Registro de daños
                  </h2>
                  <p className="text-sm font-inter text-gray-600">
                    Agrega uno o más daños si la ambulancia presenta novedades visibles.
                  </p>
                </div>
              </div>

              <Button className="font-inter" onClick={addDamageReport}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar daño
              </Button>
            </div>

            {form.damageReports.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-inter font-semibold text-green-800">
                  Sin daños registrados en este formulario.
                </p>
                <p className="text-sm font-inter text-green-700 mt-1">
                  Si la unidad presenta daños, presiona “Agregar daño” para detallar la novedad.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.damageReports.map((damage, index) => {
                  const selectedDamageType = damageTypeOptions.find(
                    (option) => option.value === damage.damageType
                  )

                  return (
                    <div
                      key={damage.localId}
                      className={`rounded-xl border p-4 ${
                        hasTriedSubmit &&
                        (!damage.damageType ||
                          !damage.affectedArea ||
                          !damage.description.trim())
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-inter font-bold text-gray-900">
                            Daño {index + 1}
                          </h3>

                          {selectedDamageType && (
                            <Badge
                              className={`${selectedDamageType.badgeClass} font-inter`}
                            >
                              {selectedDamageType.label}
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter text-red-600 hover:text-red-700"
                          onClick={() => removeDamageReport(damage.localId)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-inter">
                        <div>
                          <label className="text-sm text-gray-600">
                            Tipo de daño
                          </label>
                          <select
                            value={damage.damageType}
                            onChange={(event) =>
                              updateDamageReport(
                                damage.localId,
                                "damageType",
                                event.target.value
                              )
                            }
                            className={requiredSelectClass(
                              !damage.damageType,
                              "w-full"
                            )}
                          >
                            <option value="">Seleccionar</option>
                            {damageTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-gray-600">
                            Zona afectada
                          </label>
                          <select
                            value={damage.affectedArea}
                            onChange={(event) =>
                              updateDamageReport(
                                damage.localId,
                                "affectedArea",
                                event.target.value
                              )
                            }
                            className={requiredSelectClass(
                              !damage.affectedArea,
                              "w-full"
                            )}
                          >
                            <option value="">Seleccionar</option>
                            {affectedAreaOptions.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-gray-600">
                            Descripción
                          </label>
                          <Input
                            value={damage.description}
                            onChange={(event) =>
                              updateDamageReport(
                                damage.localId,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Detalle del daño"
                            className={requiredInputClass(
                              !damage.description.trim()
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="font-inter" onClick={resetCreation}>
              Cancelar
            </Button>

            <Button className="font-inter" onClick={guardarFormulario} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar formulario"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
