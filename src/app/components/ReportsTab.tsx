import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  AlertTriangle,
  Ambulance,
  BarChart3,
  ClipboardList,
  RefreshCw,
  Route,
  Wrench,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useAmbulances } from "../AmbulanceContext"

interface RouteFormStatsRow {
  id: string
  ambulance_code: string
  registered_by_name: string | null
  total_km: number | null
  damage_reports: unknown
  inspection_items: unknown
  form_date: string
}

interface MaintenanceStatsRow {
  id: string
  ambulance_code: string
  maintenance_type: "preventiva" | "correctiva"
  estimated_cost: number | null
  status: string
  scheduled_date: string | null
  created_at: string
}

const currentYear = new Date().getFullYear()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

export function ReportsTab() {
  const {
    ambulances,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getAlertaPreventiva,
    formatKm,
  } = useAmbulances()

  const [forms, setForms] = useState<RouteFormStatsRow[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceStatsRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [maintenanceNotice, setMaintenanceNotice] = useState("")

  const loadStats = async () => {
    setIsLoading(true)
    setError("")
    setMaintenanceNotice("")

    const { data: formsData, error: formsError } = await supabase
      .from("shift_route_forms")
      .select(
        `
        id,
        ambulance_code,
        registered_by_name,
        total_km,
        damage_reports,
        inspection_items,
        form_date
      `
      )
      .gte("form_date", `${currentYear}-01-01`)
      .lte("form_date", `${currentYear}-12-31`)

    if (formsError) {
      setError(formsError.message)
      setForms([])
      setMaintenances([])
      setIsLoading(false)
      return
    }

    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from("maintenance_records")
      .select(
        `
        id,
        ambulance_code,
        maintenance_type,
        estimated_cost,
        status,
        scheduled_date,
        created_at
      `
      )
      .gte("created_at", `${currentYear}-01-01`)
      .lte("created_at", `${currentYear}-12-31`)

    if (maintenanceError) {
      setMaintenanceNotice(
        "Las estadisticas de mantenimiento estaran disponibles cuando exista la tabla maintenance_records."
      )
    }

    setForms((formsData || []) as RouteFormStatsRow[])
    setMaintenances((maintenanceData || []) as MaintenanceStatsRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const stats = useMemo(() => {
    const totalKmForms = forms.reduce(
      (sum, form) => sum + Math.max(0, Number(form.total_km || 0)),
      0
    )

    const totalDamageReports = forms.reduce(
      (sum, form) => sum + asArray(form.damage_reports).length,
      0
    )

    const badInspectionItems = forms.reduce((sum, form) => {
      return (
        sum +
        asArray(form.inspection_items).filter(
          (item) => item?.status === "Malo"
        ).length
      )
    }, 0)

    const preventivas = maintenances.filter(
      (maintenance) => maintenance.maintenance_type === "preventiva"
    )

    const correctivas = maintenances.filter(
      (maintenance) => maintenance.maintenance_type === "correctiva"
    )

    const preventiveCost = preventivas.reduce(
      (sum, item) => sum + Number(item.estimated_cost || 0),
      0
    )

    const correctiveCost = correctivas.reduce(
      (sum, item) => sum + Number(item.estimated_cost || 0),
      0
    )

    const formsByAmbulance = forms.reduce<Record<string, number>>((acc, form) => {
      acc[form.ambulance_code] = (acc[form.ambulance_code] || 0) + 1
      return acc
    }, {})

    const kmByAmbulance = forms.reduce<Record<string, number>>((acc, form) => {
      acc[form.ambulance_code] =
        (acc[form.ambulance_code] || 0) + Number(form.total_km || 0)
      return acc
    }, {})

    const topForms = Object.entries(formsByAmbulance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topKm = Object.entries(kmByAmbulance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      totalKmForms,
      totalDamageReports,
      badInspectionItems,
      preventiveCount: preventivas.length,
      correctiveCount: correctivas.length,
      preventiveCost,
      correctiveCost,
      totalMaintenanceCost: preventiveCost + correctiveCost,
      topForms,
      topKm,
    }
  }, [forms, maintenances])

  const preventiveRequired = ambulances.filter(
    (ambulance) =>
      getAlertaPreventiva(ambulance) === "mantencion_preventiva_requerida"
  )

  const nextPreventive = ambulances.filter(
    (ambulance) => getAlertaPreventiva(ambulance) === "proxima_mantencion"
  )

  const highestUsage = [...ambulances]
    .sort((a, b) => getUsoDesdeMantencion(b) - getUsoDesdeMantencion(a))
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Estadisticas
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Indicadores operativos calculados desde ambulancias, formularios y mantenimientos registrados.
          </p>
        </div>

        <Button variant="outline" className="font-inter" onClick={loadStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar datos
        </Button>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="text-sm font-inter text-red-700">
            No fue posible cargar las estadisticas: {error}
          </p>
        </Card>
      )}

      {maintenanceNotice && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm font-inter text-amber-800">
            {maintenanceNotice}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Formularios del año</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {isLoading ? "..." : forms.length}
          </p>
          <p className="text-xs font-inter text-blue-700">
            Hojas de ruta registradas
          </p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Km registrados</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {isLoading ? "..." : stats.totalKmForms.toLocaleString("es-CL")}
          </p>
          <p className="text-xs font-inter text-green-700">
            Kilometros informados en formularios
          </p>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <p className="text-sm font-inter text-amber-700">Alertas preventivas</p>
          <p className="text-3xl font-inter font-bold text-amber-900">
            {preventiveRequired.length + nextPreventive.length}
          </p>
          <p className="text-xs font-inter text-amber-700">
            Proximas o requeridas por kilometraje
          </p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">Daños reportados</p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {isLoading ? "..." : stats.totalDamageReports}
          </p>
          <p className="text-xs font-inter text-red-700">
            Desde formularios registrados
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Gasto anual en mantenimiento
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-inter text-blue-700">Preventivo</p>
              <p className="text-2xl font-inter font-bold text-blue-900">
                {formatCurrency(stats.preventiveCost)}
              </p>
              <p className="text-xs font-inter text-blue-700">
                {stats.preventiveCount} registro(s)
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-inter text-orange-700">Correctivo</p>
              <p className="text-2xl font-inter font-bold text-orange-900">
                {formatCurrency(stats.correctiveCost)}
              </p>
              <p className="text-xs font-inter text-orange-700">
                {stats.correctiveCount} registro(s)
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-inter text-gray-700">Total anual</p>
              <p className="text-2xl font-inter font-bold text-gray-900">
                {formatCurrency(stats.totalMaintenanceCost)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Prioridad preventiva
            </h2>
          </div>

          <div className="space-y-3">
            {highestUsage.length === 0 ? (
              <p className="text-sm font-inter text-gray-500">
                No hay ambulancias registradas.
              </p>
            ) : (
              highestUsage.map((ambulance) => (
                <div
                  key={ambulance.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-inter font-semibold text-gray-900">
                        {ambulance.id} · {ambulance.patente}
                      </p>
                      <p className="text-xs font-inter text-gray-500">
                        Uso: {formatKm(getUsoDesdeMantencion(ambulance))}
                      </p>
                    </div>

                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-inter">
                      Faltan {formatKm(getKmFaltantes(ambulance))}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Calidad de formularios
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-inter text-gray-700">
                Items marcados como Malo
              </p>
              <p className="text-2xl font-inter font-bold text-gray-900">
                {stats.badInspectionItems}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-inter text-gray-700">
                Daños por formulario
              </p>
              <p className="text-2xl font-inter font-bold text-gray-900">
                {forms.length > 0
                  ? (stats.totalDamageReports / forms.length).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Ambulance className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Formularios por ambulancia
            </h2>
          </div>

          {stats.topForms.length === 0 ? (
            <p className="text-sm font-inter text-gray-500">
              No hay formularios registrados para este periodo.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topForms.map(([code, count]) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <span className="text-sm font-inter font-semibold text-gray-900">
                    {code}
                  </span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-inter">
                    {count} formulario(s)
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Km por ambulancia
            </h2>
          </div>

          {stats.topKm.length === 0 ? (
            <p className="text-sm font-inter text-gray-500">
              No hay kilometraje registrado para este periodo.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topKm.map(([code, km]) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <span className="text-sm font-inter font-semibold text-gray-900">
                    {code}
                  </span>
                  <Badge className="bg-green-100 text-green-700 border-green-200 font-inter">
                    {formatKm(km)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
          <p className="text-sm font-inter text-gray-600">
            Estas metricas se recalculan desde registros existentes. Para ampliar el analisis se pueden agregar costos reales, fechas de cierre y proveedores en los registros de mantenimiento.
          </p>
        </div>
      </Card>
    </div>
  )
}
