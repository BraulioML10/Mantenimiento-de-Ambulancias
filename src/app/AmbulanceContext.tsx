import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

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

interface AmbulanceContextValue {
  ambulances: Ambulance[]
  addAmbulance: (ambulance: Ambulance) => void
  updateAmbulance: (originalId: string, updatedAmbulance: Ambulance) => void
  deleteAmbulance: (id: string) => void
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

const getCurrentTime = () =>
  new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })

export function AmbulanceProvider({ children }: { children: ReactNode }) {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances)

  const addAmbulance = (ambulance: Ambulance) => {
    setAmbulances((prev) => [
      ...prev,
      {
        ...ambulance,
        lastUpdate: getCurrentTime(),
      },
    ])
  }

  const updateAmbulance = (originalId: string, updatedAmbulance: Ambulance) => {
    setAmbulances((prev) =>
      prev.map((ambulance) =>
        ambulance.id === originalId
          ? {
              ...updatedAmbulance,
              lastUpdate: getCurrentTime(),
            }
          : ambulance
      )
    )
  }

  const deleteAmbulance = (id: string) => {
    setAmbulances((prev) => prev.filter((ambulance) => ambulance.id !== id))
  }

  const value = useMemo(
    () => ({
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
    }),
    [ambulances]
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