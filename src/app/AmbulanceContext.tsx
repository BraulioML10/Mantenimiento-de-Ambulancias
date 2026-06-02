import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { supabase } from "../lib/supabaseClient"

export type AmbulanceStatus =
  | "operativa"
  | "proxima_mantencion"
  | "mantencion_preventiva"
  | "mantencion_correctiva"
  | "fuera_servicio"

export type PreventiveAlertStatus =
  | "sin_alerta"
  | "proxima_mantencion"
  | "mantencion_preventiva_requerida"

export interface Ambulance {
  id: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometrajeActual: number
  kilometrajeUltimaMantencion: number
  usoDesdeUltimaMantencion: number
  pautaPreventivaKm: number
  lastUpdate: string
  isActive?: boolean
  archivedAt?: string | null
}

interface DbAmbulance {
  id?: string | null
  code: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometraje_actual: number
  kilometraje_ultima_mantencion: number
  uso_desde_ultima_mantencion: number | null
  pauta_preventiva_km: number
  last_update: string
  is_active: boolean | null
  archived_at: string | null
}

interface UpdateAmbulanceOptions {
  mileageSource?: "ajuste_admin" | "formulario_manual" | "gps" | "mantencion"
  mileageNotes?: string
}

interface AmbulanceContextValue {
  ambulances: Ambulance[]
  isLoading: boolean
  error: string
  refreshAmbulances: () => Promise<void>
  addAmbulance: (ambulance: Ambulance) => Promise<void>
  updateAmbulance: (
    originalId: string,
    updatedAmbulance: Ambulance,
    options?: UpdateAmbulanceOptions
  ) => Promise<boolean>
  deleteAmbulance: (id: string) => Promise<void>
  getUsoDesdeMantencion: (ambulance: Ambulance) => number
  getKmFaltantes: (ambulance: Ambulance) => number
  getProgressPercentage: (ambulance: Ambulance) => number
  getEstadoCalculado: (ambulance: Ambulance) => AmbulanceStatus
  getAlertaPreventiva: (ambulance: Ambulance) => PreventiveAlertStatus
  formatKm: (value: number) => string
  statusConfig: Record<
    AmbulanceStatus,
    {
      label: string
      shortLabel: string
      badgeClass: string
      progressClass: string
    }
  >
  preventiveAlertConfig: Record<
    PreventiveAlertStatus,
    {
      label: string
      shortLabel: string
      badgeClass: string
      progressClass: string
    }
  >
}

const statusConfig = {
  operativa: {
    label: "Operativa",
    shortLabel: "Operativa",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    progressClass: "bg-green-500",
  },
  proxima_mantencion: {
    label: "Operativa",
    shortLabel: "Operativa",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    progressClass: "bg-green-500",
  },
  mantencion_preventiva: {
    label: "En mantenimiento preventivo",
    shortLabel: "Preventiva",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    progressClass: "bg-blue-500",
  },
  mantencion_correctiva: {
    label: "En mantenimiento correctivo",
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
} satisfies AmbulanceContextValue["statusConfig"]

const preventiveAlertConfig = {
  sin_alerta: {
    label: "Sin alerta preventiva",
    shortLabel: "Sin alerta",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    progressClass: "bg-green-500",
  },
  proxima_mantencion: {
    label: "Próxima a mantención",
    shortLabel: "Próxima",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    progressClass: "bg-amber-500",
  },
  mantencion_preventiva_requerida: {
    label: "Mantención preventiva requerida",
    shortLabel: "Requiere mantención",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    progressClass: "bg-red-500",
  },
} satisfies AmbulanceContextValue["preventiveAlertConfig"]

const AmbulanceContext = createContext<AmbulanceContextValue | undefined>(undefined)

const formatKm = (value: number) => `${value.toLocaleString("es-CL")} km`

const getCurrentTime = () =>
  new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })

const sortAmbulances = (items: Ambulance[]) => {
  return [...items].sort((a, b) =>
    a.id.localeCompare(b.id, "es-CL", { numeric: true })
  )
}

const ambulanceSelect = `
  id,
  code,
  patente,
  base,
  modelo,
  status,
  kilometraje_actual,
  kilometraje_ultima_mantencion,
  uso_desde_ultima_mantencion,
  pauta_preventiva_km,
  last_update,
  is_active,
  archived_at
`

const normalizeStatusFromDatabase = (status: AmbulanceStatus): AmbulanceStatus => {
  if (status === "proxima_mantencion") return "operativa"

  return status
}

const mapFromDatabase = (row: DbAmbulance): Ambulance => {
  const usoDesdeUltimaMantencion =
    row.uso_desde_ultima_mantencion ??
    Math.max(0, row.kilometraje_actual - row.kilometraje_ultima_mantencion)

  return {
    id: row.code,
    patente: row.patente,
    base: row.base,
    modelo: row.modelo,
    status: normalizeStatusFromDatabase(row.status),
    kilometrajeActual: row.kilometraje_actual,
    kilometrajeUltimaMantencion: row.kilometraje_ultima_mantencion,
    usoDesdeUltimaMantencion,
    pautaPreventivaKm: row.pauta_preventiva_km,
    lastUpdate: row.last_update,
    isActive: row.is_active ?? true,
    archivedAt: row.archived_at,
  }
}

const mapToDatabase = (ambulance: Ambulance) => ({
  code: ambulance.id.trim().toUpperCase(),
  patente: ambulance.patente.trim().toUpperCase(),
  base: ambulance.base.trim(),
  modelo: ambulance.modelo.trim(),
  status:
    ambulance.status === "proxima_mantencion"
      ? "operativa"
      : ambulance.status,
  kilometraje_actual: ambulance.kilometrajeActual,
  kilometraje_ultima_mantencion: Math.max(
    0,
    ambulance.kilometrajeActual - ambulance.usoDesdeUltimaMantencion
  ),
  uso_desde_ultima_mantencion: ambulance.usoDesdeUltimaMantencion,
  pauta_preventiva_km: ambulance.pautaPreventivaKm,
  last_update: ambulance.lastUpdate || getCurrentTime(),
  is_active: ambulance.isActive ?? true,
  archived_at: ambulance.archivedAt ?? null,
})

const getUsoDesdeMantencion = (ambulance: Ambulance) =>
  Math.max(0, ambulance.usoDesdeUltimaMantencion)

const getKmFaltantes = (ambulance: Ambulance) =>
  Math.max(0, ambulance.pautaPreventivaKm - getUsoDesdeMantencion(ambulance))

const getProgressPercentage = (ambulance: Ambulance) => {
  if (ambulance.pautaPreventivaKm <= 0) return 0

  return Math.min(
    100,
    (getUsoDesdeMantencion(ambulance) / ambulance.pautaPreventivaKm) * 100
  )
}

const getEstadoCalculado = (ambulance: Ambulance): AmbulanceStatus => {
  if (ambulance.status === "proxima_mantencion") {
    return "operativa"
  }

  return ambulance.status
}

const getAlertaPreventiva = (ambulance: Ambulance): PreventiveAlertStatus => {
  const estadoOperativo = getEstadoCalculado(ambulance)

  if (
    estadoOperativo === "mantencion_correctiva" ||
    estadoOperativo === "fuera_servicio"
  ) {
    return "sin_alerta"
  }

  const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)

  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm) {
    return "mantencion_preventiva_requerida"
  }

  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm * 0.8) {
    return "proxima_mantencion"
  }

  return "sin_alerta"
}

export function AmbulanceProvider({ children }: { children: ReactNode }) {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const refreshAmbulances = useCallback(async () => {
    setIsLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("ambulances")
      .select(ambulanceSelect)
      .eq("is_active", true)
      .order("code", { ascending: true })

    if (error) {
      setError(error.message)
      setAmbulances([])
      setIsLoading(false)
      return
    }

    setAmbulances(sortAmbulances((data || []).map(mapFromDatabase)))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshAmbulances()
  }, [refreshAmbulances])

  const addAmbulance = async (ambulance: Ambulance) => {
    const ambulanceWithUpdate = {
      ...ambulance,
      id: ambulance.id.trim().toUpperCase(),
      patente: ambulance.patente.trim().toUpperCase(),
      lastUpdate: getCurrentTime(),
    }

    const { data, error } = await supabase
      .from("ambulances")
      .insert(mapToDatabase(ambulanceWithUpdate))
      .select(ambulanceSelect)
      .single()

    if (error) {
      window.alert(`No se pudo agregar la ambulancia: ${error.message}`)
      return
    }

    const newAmbulance = mapFromDatabase(data)

    setAmbulances((prev) =>
      sortAmbulances([
        ...prev.filter((item) => item.id !== newAmbulance.id),
        newAmbulance,
      ])
    )
  }

  const updateAmbulance = async (
    originalId: string,
    updatedAmbulance: Ambulance,
    options?: UpdateAmbulanceOptions
  ) => {
    const previousAmbulance = ambulances.find((item) => item.id === originalId)
    const ambulanceWithUpdate = {
      ...updatedAmbulance,
      id: updatedAmbulance.id.trim().toUpperCase(),
      patente: updatedAmbulance.patente.trim().toUpperCase(),
      lastUpdate: getCurrentTime(),
    }

    const { data, error } = await supabase
      .from("ambulances")
      .update(mapToDatabase(ambulanceWithUpdate))
      .eq("code", originalId)
      .select(ambulanceSelect)
      .single()

    if (error) {
      window.alert(`No se pudo actualizar la ambulancia: ${error.message}`)
      return false
    }

    const savedAmbulance = mapFromDatabase(data)
    const mileageChanged =
      previousAmbulance &&
      previousAmbulance.kilometrajeActual !== savedAmbulance.kilometrajeActual

    if (mileageChanged && previousAmbulance) {
      const { error: mileageError } = await supabase.from("mileage_logs").insert({
        ambulance_id: data.id || null,
        ambulance_code: savedAmbulance.id,
        previous_mileage: previousAmbulance.kilometrajeActual,
        new_mileage: savedAmbulance.kilometrajeActual,
        travelled_km: Math.max(
          0,
          savedAmbulance.kilometrajeActual - previousAmbulance.kilometrajeActual
        ),
        source_type: options?.mileageSource || "ajuste_admin",
        registered_by_name: null,
        notes: options?.mileageNotes || "Actualizacion de kilometraje desde la app",
        kilometraje_total: savedAmbulance.kilometrajeActual,
        uso_desde_mantencion: savedAmbulance.usoDesdeUltimaMantencion,
        km_faltantes: getKmFaltantes(savedAmbulance),
      })

      if (mileageError) {
        console.warn(
          "No se pudo registrar el historial de kilometraje:",
          mileageError.message
        )
      }
    }

    setAmbulances((prev) =>
      sortAmbulances([
        ...prev.filter(
          (item) => item.id !== originalId && item.id !== savedAmbulance.id
        ),
        savedAmbulance,
      ])
    )

    return true
  }

  const deleteAmbulance = async (id: string) => {
    const { error } = await supabase
      .from("ambulances")
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        status: "fuera_servicio",
        last_update: getCurrentTime(),
      })
      .eq("code", id)

    if (error) {
      window.alert(`No se pudo archivar la ambulancia: ${error.message}`)
      return
    }

    setAmbulances((prev) => prev.filter((ambulance) => ambulance.id !== id))
  }

  const value = useMemo(
    () => ({
      ambulances,
      isLoading,
      error,
      refreshAmbulances,
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
    }),
    [ambulances, isLoading, error, refreshAmbulances]
  )

  return (
    <AmbulanceContext.Provider value={value}>
      {children}
    </AmbulanceContext.Provider>
  )
}

export function useAmbulances() {
  const context = useContext(AmbulanceContext)

  if (!context) {
    throw new Error("useAmbulances debe usarse dentro de AmbulanceProvider")
  }

  return context
}
