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

export interface Ambulance {
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

interface DbAmbulance {
  code: string
  patente: string
  base: string
  modelo: string
  status: AmbulanceStatus
  kilometraje_actual: number
  kilometraje_ultima_mantencion: number
  pauta_preventiva_km: number
  last_update: string
}

interface AmbulanceContextValue {
  ambulances: Ambulance[]
  isLoading: boolean
  error: string
  refreshAmbulances: () => Promise<void>
  addAmbulance: (ambulance: Ambulance) => Promise<void>
  updateAmbulance: (originalId: string, updatedAmbulance: Ambulance) => Promise<void>
  deleteAmbulance: (id: string) => Promise<void>
  getUsoDesdeMantencion: (ambulance: Ambulance) => number
  getKmFaltantes: (ambulance: Ambulance) => number
  getProgressPercentage: (ambulance: Ambulance) => number
  getEstadoCalculado: (ambulance: Ambulance) => AmbulanceStatus
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
}

const statusConfig = {
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
} satisfies AmbulanceContextValue["statusConfig"]

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

const mapFromDatabase = (row: DbAmbulance): Ambulance => ({
  id: row.code,
  patente: row.patente,
  base: row.base,
  modelo: row.modelo,
  status: row.status,
  kilometrajeActual: row.kilometraje_actual,
  kilometrajeUltimaMantencion: row.kilometraje_ultima_mantencion,
  pautaPreventivaKm: row.pauta_preventiva_km,
  lastUpdate: row.last_update,
})

const mapToDatabase = (ambulance: Ambulance) => ({
  code: ambulance.id.trim().toUpperCase(),
  patente: ambulance.patente.trim().toUpperCase(),
  base: ambulance.base.trim(),
  modelo: ambulance.modelo.trim(),
  status: ambulance.status,
  kilometraje_actual: ambulance.kilometrajeActual,
  kilometraje_ultima_mantencion: ambulance.kilometrajeUltimaMantencion,
  pauta_preventiva_km: ambulance.pautaPreventivaKm,
  last_update: ambulance.lastUpdate || getCurrentTime(),
})

const ambulanceSelect = `
  code,
  patente,
  base,
  modelo,
  status,
  kilometraje_actual,
  kilometraje_ultima_mantencion,
  pauta_preventiva_km,
  last_update
`

const getUsoDesdeMantencion = (ambulance: Ambulance) =>
  ambulance.kilometrajeActual - ambulance.kilometrajeUltimaMantencion

const getKmFaltantes = (ambulance: Ambulance) =>
  Math.max(0, ambulance.pautaPreventivaKm - getUsoDesdeMantencion(ambulance))

const getProgressPercentage = (ambulance: Ambulance) =>
  Math.min(
    100,
    (getUsoDesdeMantencion(ambulance) / ambulance.pautaPreventivaKm) * 100
  )

const getEstadoCalculado = (ambulance: Ambulance): AmbulanceStatus => {
  if (
    ambulance.status === "mantencion_correctiva" ||
    ambulance.status === "fuera_servicio"
  ) {
    return ambulance.status
  }

  const usoDesdeMantencion = getUsoDesdeMantencion(ambulance)

  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm) {
    return "mantencion_preventiva"
  }

  if (usoDesdeMantencion >= ambulance.pautaPreventivaKm * 0.8) {
    return "proxima_mantencion"
  }

  return "operativa"
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
      sortAmbulances([...prev.filter((item) => item.id !== newAmbulance.id), newAmbulance])
    )
  }

  const updateAmbulance = async (
    originalId: string,
    updatedAmbulance: Ambulance
  ) => {
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
      return
    }

    const savedAmbulance = mapFromDatabase(data)

    setAmbulances((prev) =>
      sortAmbulances([
        ...prev.filter((item) => item.id !== originalId && item.id !== savedAmbulance.id),
        savedAmbulance,
      ])
    )
  }

  const deleteAmbulance = async (id: string) => {
    const { error } = await supabase.from("ambulances").delete().eq("code", id)

    if (error) {
      window.alert(`No se pudo eliminar la ambulancia: ${error.message}`)
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
      formatKm,
      statusConfig,
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