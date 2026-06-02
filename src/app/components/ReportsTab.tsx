import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  Ambulance,
  BarChart3,
  ClipboardList,
  DollarSign,
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
  final_cost: number | null
  status: string
  scheduled_date: string | null
  created_at: string
}

interface BudgetRow {
  id: string
  budget_year: number
  budget_month: number | null
  budget_type: string
  total_amount: number | null
  reserved_amount: number | null
  spent_amount: number | null
  notes: string | null
  is_active: boolean
}

interface BudgetMovementRow {
  id: string
  budget_id: string | null
  movement_type: string
  amount: number | null
  movement_date: string
  description: string | null
}

const currentYear = new Date().getFullYear()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

const formatIntegerInput = (value: number | string) => {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/\./g, "").replace(/[^\d]/g, ""))

  if (!numericValue || Number.isNaN(numericValue)) return ""

  return numericValue.toLocaleString("es-CL")
}

const parseIntegerInput = (value: string) => {
  const parsed = Number(value.replace(/\./g, "").replace(/[^\d]/g, ""))

  return Number.isNaN(parsed) ? 0 : parsed
}

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
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [budgetMovements, setBudgetMovements] = useState<BudgetMovementRow[]>([])
  const [annualBudgetInput, setAnnualBudgetInput] = useState(0)
  const [bonusInput, setBonusInput] = useState(0)
  const [bonusDescription, setBonusDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const [error, setError] = useState("")
  const [maintenanceNotice, setMaintenanceNotice] = useState("")
  const [budgetNotice, setBudgetNotice] = useState("")

  const loadStats = async () => {
    setIsLoading(true)
    setError("")
    setMaintenanceNotice("")
    setBudgetNotice("")

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
        final_cost,
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

    const { data: budgetData, error: budgetError } = await supabase
      .from("maintenance_budgets")
      .select(
        `
        id,
        budget_year,
        budget_month,
        budget_type,
        total_amount,
        reserved_amount,
        spent_amount,
        notes,
        is_active
      `
      )
      .eq("budget_year", currentYear)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    const { data: movementData, error: movementError } = await supabase
      .from("budget_movements")
      .select(
        `
        id,
        budget_id,
        movement_type,
        amount,
        movement_date,
        description
      `
      )
      .gte("movement_date", `${currentYear}-01-01`)
      .lte("movement_date", `${currentYear}-12-31`)
      .order("movement_date", { ascending: false })

    if (budgetError || movementError) {
      setBudgetNotice(
        "El presupuesto anual estara disponible cuando ejecutes la SQL core_rules_incremental.sql en Supabase."
      )
      setBudgets([])
      setBudgetMovements([])
    } else {
      const loadedBudgets = (budgetData || []) as BudgetRow[]
      setBudgets(loadedBudgets)
      setBudgetMovements((movementData || []) as BudgetMovementRow[])

      const annualBudget = loadedBudgets.find(
        (budget) =>
          budget.budget_type === "anual" &&
          (budget.budget_month === null || budget.budget_month === 0)
      )

      setAnnualBudgetInput(Number(annualBudget?.total_amount || 0))
    }

    setForms((formsData || []) as RouteFormStatsRow[])
    setMaintenances((maintenanceData || []) as MaintenanceStatsRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const annualBudget = budgets.find(
    (budget) =>
      budget.budget_type === "anual" &&
      (budget.budget_month === null || budget.budget_month === 0)
  )

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

    const billableMaintenances = maintenances.filter(
      (maintenance) => maintenance.status !== "cancelada"
    )

    const getMaintenanceCost = (maintenance: MaintenanceStatsRow) =>
      Number(maintenance.final_cost ?? maintenance.estimated_cost ?? 0)

    const preventivas = billableMaintenances.filter(
      (maintenance) => maintenance.maintenance_type === "preventiva"
    )

    const correctivas = billableMaintenances.filter(
      (maintenance) => maintenance.maintenance_type === "correctiva"
    )

    const preventiveCost = preventivas.reduce(
      (sum, item) => sum + getMaintenanceCost(item),
      0
    )

    const correctiveCost = correctivas.reduce(
      (sum, item) => sum + getMaintenanceCost(item),
      0
    )

    const bonusMovements = budgetMovements.filter((movement) =>
      ["bono", "refuerzo", "ajuste_positivo", "ingreso_extra"].includes(
        movement.movement_type
      )
    )

    const discountMovements = budgetMovements.filter((movement) =>
      ["descuento", "rebaja", "ajuste_negativo"].includes(movement.movement_type)
    )

    const bonusAmount = bonusMovements.reduce(
      (sum, movement) => sum + Number(movement.amount || 0),
      0
    )

    const discountAmount = discountMovements.reduce(
      (sum, movement) => sum + Number(movement.amount || 0),
      0
    )

    const baseBudget = Number(annualBudget?.total_amount || 0)
    const availableBudget = Math.max(0, baseBudget + bonusAmount - discountAmount)
    const totalMaintenanceCost = preventiveCost + correctiveCost
    const remainingBudget = availableBudget - totalMaintenanceCost
    const budgetUsagePercentage =
      availableBudget > 0
        ? Math.min(100, (totalMaintenanceCost / availableBudget) * 100)
        : 0

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
      totalMaintenanceCost,
      baseBudget,
      bonusAmount,
      discountAmount,
      availableBudget,
      remainingBudget,
      budgetUsagePercentage,
      topForms,
      topKm,
    }
  }, [annualBudget, budgetMovements, forms, maintenances])

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

  const saveAnnualBudget = async () => {
    setIsSavingBudget(true)

    const payload = {
      budget_year: currentYear,
      budget_month: null,
      budget_type: "anual",
      total_amount: Math.max(0, annualBudgetInput),
      is_active: true,
    }

    const request = annualBudget
      ? supabase
          .from("maintenance_budgets")
          .update(payload)
          .eq("id", annualBudget.id)
      : supabase.from("maintenance_budgets").insert(payload)

    const { error: saveError } = await request

    setIsSavingBudget(false)

    if (saveError) {
      window.alert(`No se pudo guardar el presupuesto: ${saveError.message}`)
      return
    }

    await loadStats()
  }

  const addBudgetBonus = async () => {
    if (bonusInput <= 0) {
      window.alert("Debes ingresar un monto de bono o refuerzo mayor a cero.")
      return
    }

    setIsSavingBudget(true)

    const { error: bonusError } = await supabase.from("budget_movements").insert({
      budget_id: annualBudget?.id || null,
      movement_type: "bono",
      amount: Math.max(0, bonusInput),
      movement_date: new Date().toISOString().slice(0, 10),
      description: bonusDescription.trim() || "Bono o refuerzo presupuestario",
    })

    setIsSavingBudget(false)

    if (bonusError) {
      window.alert(`No se pudo agregar el bono: ${bonusError.message}`)
      return
    }

    setBonusInput(0)
    setBonusDescription("")
    await loadStats()
  }

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

      {budgetNotice && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm font-inter text-amber-800">
            {budgetNotice}
          </p>
        </Card>
      )}

      <Card className="p-5 border border-gray-200">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-inter font-bold text-gray-900">
                Presupuesto anual de mantenimiento {currentYear}
              </h2>
              <p className="text-sm font-inter text-gray-600">
                Controla el presupuesto base, bonos o refuerzos y saldo restante contra el gasto registrado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:max-w-2xl">
            <div>
              <label className="text-xs font-inter text-gray-600">
                Presupuesto anual
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(annualBudgetInput)}
                  onChange={(event) =>
                    setAnnualBudgetInput(parseIntegerInput(event.target.value))
                  }
                  placeholder="Ej: 50.000.000"
                  className="font-inter"
                />
                <Button
                  className="font-inter whitespace-nowrap"
                  onClick={saveAnnualBudget}
                  disabled={isSavingBudget || Boolean(budgetNotice)}
                >
                  Guardar
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-inter text-gray-600">
                Bono o refuerzo
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(bonusInput)}
                  onChange={(event) =>
                    setBonusInput(parseIntegerInput(event.target.value))
                  }
                  placeholder="Ej: 5.000.000"
                  className="font-inter"
                />
                <Button
                  variant="outline"
                  className="font-inter whitespace-nowrap"
                  onClick={addBudgetBonus}
                  disabled={isSavingBudget || Boolean(budgetNotice)}
                >
                  Agregar
                </Button>
              </div>
              <Input
                value={bonusDescription}
                onChange={(event) => setBonusDescription(event.target.value)}
                placeholder="Detalle opcional del bono"
                className="font-inter mt-2"
                disabled={isSavingBudget || Boolean(budgetNotice)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-inter text-gray-700">Presupuesto base</p>
            <p className="text-2xl font-inter font-bold text-gray-900">
              {formatCurrency(stats.baseBudget)}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-inter text-emerald-700">
              Bonos/refuerzos
            </p>
            <p className="text-2xl font-inter font-bold text-emerald-900">
              {formatCurrency(stats.bonusAmount)}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-inter text-blue-700">Gasto anual</p>
            <p className="text-2xl font-inter font-bold text-blue-900">
              {formatCurrency(stats.totalMaintenanceCost)}
            </p>
            <p className="text-xs font-inter text-blue-700">
              {stats.budgetUsagePercentage.toFixed(1)}% del presupuesto disponible
            </p>
          </div>

          <div
            className={`rounded-lg border p-4 ${
              stats.remainingBudget < 0
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }`}
          >
            <p
              className={`text-sm font-inter ${
                stats.remainingBudget < 0 ? "text-red-700" : "text-green-700"
              }`}
            >
              Saldo restante
            </p>
            <p
              className={`text-2xl font-inter font-bold ${
                stats.remainingBudget < 0 ? "text-red-900" : "text-green-900"
              }`}
            >
              {formatCurrency(stats.remainingBudget)}
            </p>
          </div>
        </div>
      </Card>

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
