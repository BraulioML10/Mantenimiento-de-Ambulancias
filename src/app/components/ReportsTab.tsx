import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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
  Download,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import {
  useAmbulances,
  type AmbulanceStatus,
  type PreventiveAlertStatus,
} from "../AmbulanceContext"
import { useAuth } from "../AuthContext"

type PeriodMode = "month" | "range" | "last6" | "last12" | "last24" | "last36"
type MaintenanceFilter = "todos" | "preventiva" | "correctiva"
type GpsFilter = "todos" | "gps" | "sin_gps"
type MovementType =
  | "asignacion_inicial"
  | "abono"
  | "reduccion"
  | "correccion"
  | "anulacion"
  | "limpieza_datos_prueba"

interface RouteFormStatsRow {
  id: string
  ambulance_code: string
  registered_by_name: string | null
  total_km: number | null
  damage_reports: unknown
  inspection_items: unknown
  form_date: string
  created_at: string
}

interface MaintenanceStatsRow {
  id: string
  ambulance_code: string
  ambulance_patente: string | null
  maintenance_type: "preventiva" | "correctiva"
  reason: string | null
  workshop_id: string | null
  workshop_name: string | null
  source: string | null
  estimated_days: number | null
  estimated_cost: number | null
  final_cost: number | null
  parts_cost: number | null
  labor_cost: number | null
  other_cost: number | null
  status: string
  current_stage: string | null
  scheduled_date: string | null
  started_at: string | null
  finished_at: string | null
  archived_at: string | null
  created_at: string
}

interface MileageLogRow {
  id: string
  ambulance_code: string | null
  previous_mileage: number | null
  new_mileage: number | null
  travelled_km: number | null
  source_type: string | null
  registered_by_name: string | null
  notes: string | null
  created_at: string
}

interface GpsMileageLogRow {
  id: string
  ambulance_code: string | null
  gps_mileage: number | null
  travelled_km: number | null
  recorded_at: string
}

interface BudgetRow {
  id: string
  budget_year: number | null
  budget_month: number | null
  budget_type: string | null
  total_amount: number | null
  reserved_amount: number | null
  spent_amount: number | null
  year: number | null
  month: number | null
  initial_budget: number | null
  preventive_budget: number | null
  corrective_budget: number | null
  total_budget: number | null
  notes: string | null
  is_active: boolean | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

interface BudgetMovementRow {
  id: string
  budget_id: string | null
  maintenance_record_id: string | null
  year: number | null
  month: number | null
  movement_type: string
  amount: number | null
  movement_date: string
  reason: string | null
  description: string | null
  status: string | null
  created_by_user_id: string | null
  created_by_name: string | null
  created_at: string
  cancelled_at: string | null
  cancelled_by_user_id: string | null
  cancelled_by_name: string | null
  cancellation_reason: string | null
}

interface WorkshopRow {
  id: string
  name: string
}

const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1
const VERY_HIGH_AMOUNT = 1_000_000_000
const chartColors = ["#2563eb", "#f97316", "#16a34a", "#dc2626", "#64748b"]

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  )

const formatKmValue = (value: number) => `${formatNumber(value)} km`

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

const toDateInput = (date: Date) => date.toISOString().slice(0, 10)

const parseDate = (value: string | null | undefined) => {
  if (!value) return null
  return new Date(value.includes("T") ? value : `${value}T00:00:00`)
}

const startOfMonth = (year: number, month: number) =>
  new Date(year, month - 1, 1)

const endOfMonth = (year: number, month: number) =>
  new Date(year, month, 0, 23, 59, 59)

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`

const dateMonthKey = (value: string | null | undefined) => {
  const date = parseDate(value)
  if (!date) return ""
  return monthKey(date.getFullYear(), date.getMonth() + 1)
}

const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number)
  return `${monthNames[month - 1]?.slice(0, 3) || ""} ${year}`
}

const buildMonthKeys = (start: Date, end: Date) => {
  const keys: string[] = []
  let cursor = startOfMonth(start.getFullYear(), start.getMonth() + 1)
  const endCursor = startOfMonth(end.getFullYear(), end.getMonth() + 1)

  while (cursor <= endCursor) {
    keys.push(monthKey(cursor.getFullYear(), cursor.getMonth() + 1))
    cursor = addMonths(cursor, 1)
  }

  return keys
}

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

const getBudgetYear = (budget: BudgetRow) => budget.year ?? budget.budget_year ?? 0
const getBudgetMonth = (budget: BudgetRow) =>
  budget.month ?? budget.budget_month ?? null
const getBudgetInitial = (budget: BudgetRow) =>
  Number(
    budget.initial_budget ??
      budget.total_budget ??
      budget.total_amount ??
      0
  )
const getBudgetTotal = (budget: BudgetRow) =>
  Number(
    budget.total_budget ??
      budget.total_amount ??
      budget.initial_budget ??
      0
  )

const getMovementYear = (movement: BudgetMovementRow) =>
  movement.year ?? parseDate(movement.movement_date)?.getFullYear() ?? 0

const getMovementMonth = (movement: BudgetMovementRow) =>
  movement.month ?? ((parseDate(movement.movement_date)?.getMonth() ?? -1) + 1)

const isMovementActive = (movement: BudgetMovementRow) =>
  (movement.status || "activo") === "activo"

const isSuspiciousAmount = (value: number | null | undefined) =>
  Number(value || 0) >= VERY_HIGH_AMOUNT || Number(value || 0) < 0

const getMaintenanceDate = (record: MaintenanceStatsRow) =>
  record.finished_at || record.scheduled_date || record.started_at || record.created_at

const getMaintenanceCost = (record: MaintenanceStatsRow) => {
  if (record.status === "cancelada") return 0
  return Number(record.final_cost ?? record.estimated_cost ?? 0)
}

const getTravelledKm = (row: MileageLogRow) =>
  Number(
    row.travelled_km ??
      ((row.new_mileage || 0) - (row.previous_mileage || 0)) ??
      0
  )

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")
    )
    .join("\n")

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-inter text-gray-600">{text}</p>
    </div>
  )
}

function KpiCard({
  title,
  value,
  caption,
  className,
}: {
  title: string
  value: string | number
  caption?: string
  className?: string
}) {
  return (
    <Card className={`p-4 border ${className || "border-gray-200 bg-white"}`}>
      <p className="text-sm font-inter text-gray-600">{title}</p>
      <p className="text-2xl font-inter font-bold text-gray-900 mt-1">{value}</p>
      {caption && <p className="text-xs font-inter text-gray-500 mt-1">{caption}</p>}
    </Card>
  )
}

export function ReportsTab() {
  const { currentUser } = useAuth()
  const {
    ambulances,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getProgressPercentage,
    getEstadoCalculado,
    getAlertaPreventiva,
    formatKm,
    statusConfig,
    preventiveAlertConfig,
  } = useAmbulances()

  const isAdmin = currentUser?.role === "Administrador"

  const [forms, setForms] = useState<RouteFormStatsRow[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceStatsRow[]>([])
  const [mileageLogs, setMileageLogs] = useState<MileageLogRow[]>([])
  const [gpsMileageLogs, setGpsMileageLogs] = useState<GpsMileageLogRow[]>([])
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [budgetMovements, setBudgetMovements] = useState<BudgetMovementRow[]>([])
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([])

  const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [dateFrom, setDateFrom] = useState(toDateInput(startOfMonth(currentYear, currentMonth)))
  const [dateTo, setDateTo] = useState(toDateInput(currentDate))
  const [ambulanceFilter, setAmbulanceFilter] = useState("todos")
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] =
    useState<MaintenanceFilter>("todos")
  const [ambulanceStatusFilter, setAmbulanceStatusFilter] =
    useState<AmbulanceStatus | "todos">("todos")
  const [gpsFilter, setGpsFilter] = useState<GpsFilter>("todos")
  const [workshopFilter, setWorkshopFilter] = useState("todos")
  const [selectedAmbulanceCode, setSelectedAmbulanceCode] = useState("")

  const [budgetInitialInput, setBudgetInitialInput] = useState(0)
  const [preventiveBudgetInput, setPreventiveBudgetInput] = useState(0)
  const [correctiveBudgetInput, setCorrectiveBudgetInput] = useState(0)
  const [budgetNotes, setBudgetNotes] = useState("")
  const [movementType, setMovementType] = useState<MovementType>("abono")
  const [movementAmount, setMovementAmount] = useState(0)
  const [movementReason, setMovementReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const [notice, setNotice] = useState("")

  const selectedPeriod = useMemo(() => {
    if (periodMode === "month") {
      return {
        start: startOfMonth(selectedYear, selectedMonth),
        end: endOfMonth(selectedYear, selectedMonth),
      }
    }

    if (periodMode === "range") {
      return {
        start: parseDate(dateFrom) || startOfMonth(selectedYear, selectedMonth),
        end: parseDate(dateTo) || currentDate,
      }
    }

    const months = Number(periodMode.replace("last", ""))
    const start = addMonths(startOfMonth(currentYear, currentMonth), -(months - 1))
    return { start, end: currentDate }
  }, [dateFrom, dateTo, periodMode, selectedMonth, selectedYear])

  const periodMonthKeys = useMemo(
    () => buildMonthKeys(selectedPeriod.start, selectedPeriod.end),
    [selectedPeriod]
  )

  const selectedBudget = useMemo(
    () =>
      budgets.find(
        (budget) =>
          Boolean(budget.is_active ?? true) &&
          getBudgetYear(budget) === selectedYear &&
          getBudgetMonth(budget) === selectedMonth
      ),
    [budgets, selectedMonth, selectedYear]
  )

  useEffect(() => {
    if (!selectedBudget) {
      setBudgetInitialInput(0)
      setPreventiveBudgetInput(0)
      setCorrectiveBudgetInput(0)
      setBudgetNotes("")
      return
    }

    setBudgetInitialInput(Number(selectedBudget.initial_budget ?? getBudgetInitial(selectedBudget)))
    setPreventiveBudgetInput(Number(selectedBudget.preventive_budget || 0))
    setCorrectiveBudgetInput(Number(selectedBudget.corrective_budget || 0))
    setBudgetNotes(selectedBudget.notes || "")
  }, [selectedBudget])

  const loadStats = async () => {
    setIsLoading(true)
    setNotice("")

    const [
      formsResponse,
      maintenanceResponse,
      mileageResponse,
      gpsMileageResponse,
      budgetsResponse,
      movementsResponse,
      workshopsResponse,
    ] = await Promise.all([
      supabase
        .from("shift_route_forms")
        .select("id, ambulance_code, registered_by_name, total_km, damage_reports, inspection_items, form_date, created_at")
        .order("form_date", { ascending: false }),
      supabase
        .from("maintenance_records")
        .select("id, ambulance_code, ambulance_patente, maintenance_type, reason, source, workshop_id, workshop_name, estimated_days, estimated_cost, final_cost, parts_cost, labor_cost, other_cost, status, current_stage, scheduled_date, started_at, finished_at, archived_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("mileage_logs")
        .select("id, ambulance_code, previous_mileage, new_mileage, travelled_km, source_type, registered_by_name, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("gps_mileage_logs")
        .select("id, ambulance_code, gps_mileage, travelled_km, recorded_at")
        .order("recorded_at", { ascending: false }),
      supabase
        .from("maintenance_budgets")
        .select("id, budget_year, budget_month, budget_type, total_amount, reserved_amount, spent_amount, year, month, initial_budget, preventive_budget, corrective_budget, total_budget, notes, is_active, created_by_name, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("budget_movements")
        .select("id, budget_id, maintenance_record_id, year, month, movement_type, amount, movement_date, reason, description, status, created_by_user_id, created_by_name, created_at, cancelled_at, cancelled_by_user_id, cancelled_by_name, cancellation_reason")
        .order("created_at", { ascending: false }),
      supabase.from("maintenance_workshops").select("id, name").order("name"),
    ])

    const notices = [
      formsResponse.error ? "Formularios no disponibles." : "",
      maintenanceResponse.error ? "Mantenimientos no disponibles." : "",
      mileageResponse.error ? "Historial de kilometraje manual no disponible." : "",
      gpsMileageResponse.error ? "Historial GPS no disponible." : "",
      budgetsResponse.error ? "Presupuesto no disponible: ejecuta core_rules_incremental.sql." : "",
      movementsResponse.error ? "Movimientos de presupuesto no disponibles: ejecuta core_rules_incremental.sql." : "",
      workshopsResponse.error ? "Talleres no disponibles." : "",
    ].filter(Boolean)

    setNotice(notices.join(" "))
    setForms((formsResponse.data || []) as RouteFormStatsRow[])
    setMaintenances((maintenanceResponse.data || []) as MaintenanceStatsRow[])
    setMileageLogs((mileageResponse.data || []) as MileageLogRow[])
    setGpsMileageLogs((gpsMileageResponse.data || []) as GpsMileageLogRow[])
    setBudgets((budgetsResponse.data || []) as BudgetRow[])
    setBudgetMovements((movementsResponse.data || []) as BudgetMovementRow[])
    setWorkshops((workshopsResponse.data || []) as WorkshopRow[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const isInsidePeriod = (value: string | null | undefined) => {
    const date = parseDate(value)
    if (!date) return false
    return date >= selectedPeriod.start && date <= selectedPeriod.end
  }

  const filteredAmbulances = useMemo(() => {
    return ambulances.filter((ambulance) => {
      const estado = getEstadoCalculado(ambulance)
      const matchesAmbulance =
        ambulanceFilter === "todos" || ambulance.id === ambulanceFilter
      const matchesStatus =
        ambulanceStatusFilter === "todos" || estado === ambulanceStatusFilter
      const matchesGps =
        gpsFilter === "todos" ||
        (gpsFilter === "gps" && Boolean((ambulance as any).hasGps)) ||
        (gpsFilter === "sin_gps" && !Boolean((ambulance as any).hasGps))

      return matchesAmbulance && matchesStatus && matchesGps
    })
  }, [ambulanceFilter, ambulanceStatusFilter, ambulances, getEstadoCalculado, gpsFilter])

  const filteredCodes = useMemo(
    () => new Set(filteredAmbulances.map((ambulance) => ambulance.id)),
    [filteredAmbulances]
  )

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((record) => {
      const matchesPeriod = isInsidePeriod(getMaintenanceDate(record))
      const matchesAmbulance = filteredCodes.has(record.ambulance_code)
      const matchesType =
        maintenanceTypeFilter === "todos" ||
        record.maintenance_type === maintenanceTypeFilter
      const matchesWorkshop =
        workshopFilter === "todos" || record.workshop_id === workshopFilter

      return matchesPeriod && matchesAmbulance && matchesType && matchesWorkshop
    })
  }, [filteredCodes, maintenanceTypeFilter, maintenances, selectedPeriod, workshopFilter])

  const filteredForms = useMemo(
    () =>
      forms.filter(
        (form) => isInsidePeriod(form.form_date) && filteredCodes.has(form.ambulance_code)
      ),
    [filteredCodes, forms, selectedPeriod]
  )

  const filteredMileageLogs = useMemo(
    () =>
      mileageLogs.filter(
        (log) =>
          isInsidePeriod(log.created_at) &&
          Boolean(log.ambulance_code && filteredCodes.has(log.ambulance_code))
      ),
    [filteredCodes, mileageLogs, selectedPeriod]
  )

  const filteredGpsMileageLogs = useMemo(
    () =>
      gpsMileageLogs.filter(
        (log) =>
          isInsidePeriod(log.recorded_at) &&
          Boolean(log.ambulance_code && filteredCodes.has(log.ambulance_code))
      ),
    [filteredCodes, gpsMileageLogs, selectedPeriod]
  )

  const periodBudgets = useMemo(
    () =>
      budgets.filter((budget) => {
        if (!(budget.is_active ?? true)) return false
        const key = monthKey(getBudgetYear(budget), getBudgetMonth(budget) || 1)
        return periodMonthKeys.includes(key)
      }),
    [budgets, periodMonthKeys]
  )

  const periodMovements = useMemo(
    () =>
      budgetMovements.filter((movement) => {
        const key = monthKey(getMovementYear(movement), getMovementMonth(movement))
        return periodMonthKeys.includes(key)
      }),
    [budgetMovements, periodMonthKeys]
  )

  const selectedMonthMovements = useMemo(
    () =>
      budgetMovements.filter(
        (movement) =>
          getMovementYear(movement) === selectedYear &&
          getMovementMonth(movement) === selectedMonth
      ),
    [budgetMovements, selectedMonth, selectedYear]
  )

  const financialStats = useMemo(() => {
    const activeMovements = periodMovements.filter(isMovementActive)
    const initialBudget = periodBudgets.reduce(
      (sum, budget) => sum + getBudgetInitial(budget),
      0
    )

    const movementSum = (types: string[]) =>
      activeMovements
        .filter((movement) => types.includes(movement.movement_type))
        .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)

    const initialAssignments = movementSum(["asignacion_inicial"])
    const deposits = movementSum(["abono", "bono", "refuerzo", "ingreso_extra"])
    const reductions = movementSum(["reduccion", "descuento", "rebaja"])
    const corrections = movementSum(["correccion", "ajuste_positivo"])

    const preventiveExpense = filteredMaintenances
      .filter((record) => record.maintenance_type === "preventiva")
      .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
    const correctiveExpense = filteredMaintenances
      .filter((record) => record.maintenance_type === "correctiva")
      .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
    const totalExpense = preventiveExpense + correctiveExpense
    const finalBudget =
      initialBudget + initialAssignments + deposits + corrections - reductions
    const balance = finalBudget - totalExpense
    const usagePercentage =
      finalBudget > 0 ? Math.min(100, (totalExpense / finalBudget) * 100) : 0

    return {
      initialBudget,
      deposits,
      reductions,
      corrections,
      finalBudget,
      preventiveExpense,
      correctiveExpense,
      totalExpense,
      balance,
      overspend: Math.max(0, -balance),
      usagePercentage,
    }
  }, [filteredMaintenances, periodBudgets, periodMovements])

  const monthlyData = useMemo(() => {
    const last36Start = addMonths(startOfMonth(currentYear, currentMonth), -35)
    const keys = buildMonthKeys(last36Start, currentDate)

    return keys.map((key) => {
      const [year, month] = key.split("-").map(Number)
      const monthlyBudgets = budgets.filter(
        (budget) =>
          (budget.is_active ?? true) &&
          getBudgetYear(budget) === year &&
          getBudgetMonth(budget) === month
      )
      const monthlyMovements = budgetMovements.filter(
        (movement) =>
          isMovementActive(movement) &&
          getMovementYear(movement) === year &&
          getMovementMonth(movement) === month
      )
      const monthMaintenances = maintenances.filter(
        (record) => dateMonthKey(getMaintenanceDate(record)) === key
      )
      const preventive = monthMaintenances
        .filter((record) => record.maintenance_type === "preventiva")
        .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
      const corrective = monthMaintenances
        .filter((record) => record.maintenance_type === "correctiva")
        .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
      const monthBudget = monthlyBudgets.reduce(
        (sum, budget) => sum + getBudgetTotal(budget),
        0
      )
      const deposits = monthlyMovements
        .filter((movement) =>
          ["abono", "bono", "refuerzo", "asignacion_inicial", "correccion"].includes(
            movement.movement_type
          )
        )
        .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)
      const reductions = monthlyMovements
        .filter((movement) => movement.movement_type === "reduccion")
        .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)
      const budget = monthBudget + deposits - reductions

      const manualKm = mileageLogs
        .filter((log) => dateMonthKey(log.created_at) === key)
        .reduce((sum, log) => sum + getTravelledKm(log), 0)
      const gpsKm = gpsMileageLogs
        .filter((log) => dateMonthKey(log.recorded_at) === key)
        .reduce((sum, log) => sum + Number(log.travelled_km || 0), 0)

      return {
        key,
        name: monthLabel(key),
        budget,
        preventive,
        corrective,
        expense: preventive + corrective,
        balance: budget - preventive - corrective,
        manualKm,
        gpsKm,
        totalKm: manualKm + gpsKm,
        maintenancePreventiveCount: monthMaintenances.filter(
          (record) => record.maintenance_type === "preventiva"
        ).length,
        maintenanceCorrectiveCount: monthMaintenances.filter(
          (record) => record.maintenance_type === "correctiva"
        ).length,
      }
    })
  }, [budgetMovements, budgets, gpsMileageLogs, maintenances, mileageLogs])

  const dashboardStats = useMemo(() => {
    const activeMaintenances = filteredMaintenances.filter((record) =>
      ["programada", "en_taller", "esperando_repuesto"].includes(record.status)
    )
    const totalKm =
      filteredMileageLogs.reduce((sum, log) => sum + getTravelledKm(log), 0) +
      filteredGpsMileageLogs.reduce((sum, log) => sum + Number(log.travelled_km || 0), 0)
    const manualKm = filteredMileageLogs.reduce(
      (sum, log) => sum + getTravelledKm(log),
      0
    )
    const gpsKm = filteredGpsMileageLogs.reduce(
      (sum, log) => sum + Number(log.travelled_km || 0),
      0
    )
    const damages = filteredForms.flatMap((form) => asArray(form.damage_reports))
    const badItems = filteredForms.reduce(
      (sum, form) =>
        sum +
        asArray(form.inspection_items).filter((item) => item?.status === "Malo").length,
      0
    )
    const workshopDays = filteredMaintenances
      .map((record) => {
        const start = parseDate(record.started_at || record.scheduled_date)
        const end = parseDate(record.finished_at)
        if (!start || !end) return null
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
      })
      .filter((value): value is number => value !== null)

    return {
      activeMaintenances,
      totalKm,
      manualKm,
      gpsKm,
      totalMileageRecords: filteredMileageLogs.length + filteredGpsMileageLogs.length,
      damagesCount: damages.length,
      badItems,
      averageWorkshopDays:
        workshopDays.length > 0
          ? workshopDays.reduce((sum, value) => sum + value, 0) / workshopDays.length
          : 0,
      mostExpensive: [...filteredMaintenances].sort(
        (a, b) => getMaintenanceCost(b) - getMaintenanceCost(a)
      )[0],
    }
  }, [filteredForms, filteredGpsMileageLogs, filteredMaintenances, filteredMileageLogs])

  const rankingExpenseByAmbulance = useMemo(() => {
    const rows = filteredMaintenances.reduce<
      Record<
        string,
        {
          code: string
          patent: string
          count: number
          preventive: number
          corrective: number
        }
      >
    >((acc, record) => {
      const ambulance = ambulances.find((item) => item.id === record.ambulance_code)
      if (!acc[record.ambulance_code]) {
        acc[record.ambulance_code] = {
          code: record.ambulance_code,
          patent: ambulance?.patente || record.ambulance_patente || "Sin patente",
          count: 0,
          preventive: 0,
          corrective: 0,
        }
      }

      acc[record.ambulance_code].count += 1
      if (record.maintenance_type === "preventiva") {
        acc[record.ambulance_code].preventive += getMaintenanceCost(record)
      } else {
        acc[record.ambulance_code].corrective += getMaintenanceCost(record)
      }

      return acc
    }, {})

    return Object.values(rows)
      .map((row) => ({
        ...row,
        total: row.preventive + row.corrective,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [ambulances, filteredMaintenances])

  const kmByAmbulance = useMemo(() => {
    const rows = new Map<string, { code: string; patent: string; manual: number; gps: number }>()

    filteredMileageLogs.forEach((log) => {
      if (!log.ambulance_code) return
      const ambulance = ambulances.find((item) => item.id === log.ambulance_code)
      const existing =
        rows.get(log.ambulance_code) ||
        {
          code: log.ambulance_code,
          patent: ambulance?.patente || "Sin patente",
          manual: 0,
          gps: 0,
        }
      existing.manual += getTravelledKm(log)
      rows.set(log.ambulance_code, existing)
    })

    filteredGpsMileageLogs.forEach((log) => {
      if (!log.ambulance_code) return
      const ambulance = ambulances.find((item) => item.id === log.ambulance_code)
      const existing =
        rows.get(log.ambulance_code) ||
        {
          code: log.ambulance_code,
          patent: ambulance?.patente || "Sin patente",
          manual: 0,
          gps: 0,
        }
      existing.gps += Number(log.travelled_km || 0)
      rows.set(log.ambulance_code, existing)
    })

    return [...rows.values()]
      .map((row) => ({
        ...row,
        total: row.manual + row.gps,
        mainSource: row.gps > row.manual ? "GPS" : "Manual",
      }))
      .sort((a, b) => b.total - a.total)
  }, [ambulances, filteredGpsMileageLogs, filteredMileageLogs])

  const maintenanceStageData = useMemo(() => {
    const rows = filteredMaintenances.reduce<Record<string, number>>((acc, record) => {
      const stage = record.current_stage || record.status || "Sin etapa"
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {})

    return Object.entries(rows).map(([name, value]) => ({ name, value }))
  }, [filteredMaintenances])

  const selectedAmbulance = useMemo(
    () =>
      ambulances.find(
        (ambulance) =>
          ambulance.id === selectedAmbulanceCode ||
          ambulance.patente === selectedAmbulanceCode
      ) || null,
    [ambulances, selectedAmbulanceCode]
  )

  const selectedAmbulanceHistory = useMemo(() => {
    if (!selectedAmbulance) {
      return {
        mileages: [] as MileageLogRow[],
        maintenances: [] as MaintenanceStatsRow[],
        forms: [] as RouteFormStatsRow[],
      }
    }

    return {
      mileages: mileageLogs.filter(
        (log) => log.ambulance_code === selectedAmbulance.id
      ),
      maintenances: maintenances.filter(
        (record) => record.ambulance_code === selectedAmbulance.id
      ),
      forms: forms.filter((form) => form.ambulance_code === selectedAmbulance.id),
    }
  }, [forms, maintenances, mileageLogs, selectedAmbulance])

  const suspiciousRows = useMemo(() => {
    const budgetRows = budgetMovements
      .filter((movement) => isSuspiciousAmount(movement.amount))
      .map((movement) => ({
        source: "Movimiento presupuesto",
        id: movement.id,
        detail: `${movement.movement_type} · ${monthNames[getMovementMonth(movement) - 1]} ${getMovementYear(movement)}`,
        value: Number(movement.amount || 0),
      }))

    const maintenanceRows = maintenances
      .filter((record) =>
        isSuspiciousAmount(record.estimated_cost) || isSuspiciousAmount(record.final_cost)
      )
      .map((record) => ({
        source: "Mantención",
        id: record.id,
        detail: `${record.ambulance_code} · ${record.maintenance_type}`,
        value: Number(record.final_cost ?? record.estimated_cost ?? 0),
      }))

    return [...budgetRows, ...maintenanceRows]
  }, [budgetMovements, maintenances])

  const testMovementsForSelectedMonth = selectedMonthMovements.filter((movement) => {
    const text = `${movement.reason || ""} ${movement.description || ""}`.toLowerCase()
    return (
      movement.status === "anulado" ||
      text.includes("prueba") ||
      text.includes("test") ||
      isSuspiciousAmount(movement.amount)
    )
  })

  const clearFilters = () => {
    setPeriodMode("month")
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)
    setDateFrom(toDateInput(startOfMonth(currentYear, currentMonth)))
    setDateTo(toDateInput(currentDate))
    setAmbulanceFilter("todos")
    setMaintenanceTypeFilter("todos")
    setAmbulanceStatusFilter("todos")
    setGpsFilter("todos")
    setWorkshopFilter("todos")
  }

  const saveMonthlyBudget = async () => {
    if (!isAdmin || !currentUser) return

    const values = [budgetInitialInput, preventiveBudgetInput, correctiveBudgetInput]
    if (values.some((value) => value < 0)) {
      window.alert("El presupuesto no puede tener montos negativos.")
      return
    }

    const totalBudget =
      budgetInitialInput || preventiveBudgetInput + correctiveBudgetInput

    if (
      totalBudget >= VERY_HIGH_AMOUNT &&
      !window.confirm(
        `El presupuesto ingresado es ${formatCurrency(totalBudget)}. Revisa si corresponde antes de guardarlo.`
      )
    ) {
      return
    }

    setIsSavingBudget(true)

    const payload = {
      budget_year: selectedYear,
      budget_month: selectedMonth,
      budget_type: "mensual",
      total_amount: totalBudget,
      reserved_amount: 0,
      spent_amount: 0,
      year: selectedYear,
      month: selectedMonth,
      initial_budget: budgetInitialInput,
      preventive_budget: preventiveBudgetInput,
      corrective_budget: correctiveBudgetInput,
      total_budget: totalBudget,
      notes: budgetNotes.trim() || null,
      is_active: true,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.name,
      updated_at: new Date().toISOString(),
    }

    const request = selectedBudget
      ? supabase.from("maintenance_budgets").update(payload).eq("id", selectedBudget.id)
      : supabase.from("maintenance_budgets").insert(payload)

    const { error } = await request
    setIsSavingBudget(false)

    if (error) {
      window.alert(`No se pudo guardar el presupuesto: ${error.message}`)
      return
    }

    await loadStats()
  }

  const addBudgetMovement = async () => {
    if (!isAdmin || !currentUser) return

    if (movementAmount <= 0) {
      window.alert("El movimiento debe tener un monto mayor a cero.")
      return
    }

    if (!movementReason.trim()) {
      window.alert("Debes indicar el motivo del movimiento.")
      return
    }

    if (
      movementAmount >= VERY_HIGH_AMOUNT &&
      !window.confirm(
        `El movimiento ingresado es ${formatCurrency(movementAmount)}. Confirma solo si el monto es correcto.`
      )
    ) {
      return
    }

    setIsSavingBudget(true)

    const { error } = await supabase.from("budget_movements").insert({
      budget_id: selectedBudget?.id || null,
      year: selectedYear,
      month: selectedMonth,
      movement_type: movementType,
      amount: movementAmount,
      movement_date: toDateInput(currentDate),
      reason: movementReason.trim(),
      description: movementReason.trim(),
      status: "activo",
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.name,
    })

    setIsSavingBudget(false)

    if (error) {
      window.alert(`No se pudo guardar el movimiento: ${error.message}`)
      return
    }

    setMovementAmount(0)
    setMovementReason("")
    await loadStats()
  }

  const cancelMovement = async (movement: BudgetMovementRow) => {
    if (!isAdmin || !currentUser) return

    const reason = window.prompt("Motivo de anulación del movimiento:")
    if (!reason?.trim()) return

    const { error } = await supabase
      .from("budget_movements")
      .update({
        status: "anulado",
        cancelled_at: new Date().toISOString(),
        cancelled_by_user_id: currentUser.id,
        cancelled_by_name: currentUser.name,
        cancellation_reason: reason.trim(),
      })
      .eq("id", movement.id)

    if (error) {
      window.alert(`No se pudo anular el movimiento: ${error.message}`)
      return
    }

    await loadStats()
  }

  const deleteMovement = async (movement: BudgetMovementRow) => {
    if (!isAdmin) return

    if (
      !window.confirm(
        "Esta acción eliminará solo este movimiento presupuestario. No afectará ambulancias, mantenciones ni formularios."
      )
    ) {
      return
    }

    const { error } = await supabase
      .from("budget_movements")
      .delete()
      .eq("id", movement.id)

    if (error) {
      window.alert(`No se pudo eliminar el movimiento: ${error.message}`)
      return
    }

    await loadStats()
  }

  const resetSelectedMonthBudget = async () => {
    if (!isAdmin || !currentUser) return

    if (
      !window.confirm(
        `Esta acción reiniciará el presupuesto de ${monthNames[selectedMonth - 1]} ${selectedYear} y anulará sus movimientos activos. No afectará mantenciones reales.`
      )
    ) {
      return
    }

    setIsSavingBudget(true)

    const activeIds = selectedMonthMovements
      .filter(isMovementActive)
      .map((movement) => movement.id)

    if (selectedBudget) {
      await supabase
        .from("maintenance_budgets")
        .update({
          total_amount: 0,
          initial_budget: 0,
          preventive_budget: 0,
          corrective_budget: 0,
          total_budget: 0,
          notes: "Presupuesto reiniciado desde Estadísticas.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedBudget.id)
    }

    if (activeIds.length > 0) {
      await supabase
        .from("budget_movements")
        .update({
          status: "anulado",
          cancelled_at: new Date().toISOString(),
          cancelled_by_user_id: currentUser.id,
          cancelled_by_name: currentUser.name,
          cancellation_reason: "Reinicio de presupuesto del mes seleccionado.",
        })
        .in("id", activeIds)
    }

    setIsSavingBudget(false)
    await loadStats()
  }

  const cleanTestBudgetData = async () => {
    if (!isAdmin) return

    const ids = testMovementsForSelectedMonth.map((movement) => movement.id)
    if (ids.length === 0) {
      window.alert("No hay movimientos marcados como prueba, anulados o sospechosos para este mes.")
      return
    }

    if (
      !window.confirm(
        `Se eliminarán ${ids.length} movimiento(s) de presupuesto del mes seleccionado. No se tocarán ambulancias, formularios ni mantenciones.`
      )
    ) {
      return
    }

    const { error } = await supabase.from("budget_movements").delete().in("id", ids)

    if (error) {
      window.alert(`No se pudieron limpiar los datos de prueba: ${error.message}`)
      return
    }

    await loadStats()
  }

  const exportGeneral = () => {
    downloadCsv(
      "estadisticas_generales.csv",
      ["Indicador", "Valor"],
      [
        ["Ambulancias", filteredAmbulances.length],
        ["Mantenimientos", filteredMaintenances.length],
        ["Gasto total", financialStats.totalExpense],
        ["Saldo", financialStats.balance],
        ["Km periodo", dashboardStats.totalKm],
        ["Daños reportados", dashboardStats.damagesCount],
      ]
    )
  }

  const exportExpenses = () => {
    downloadCsv(
      "gastos_mantenimiento.csv",
      ["Fecha", "Ambulancia", "Tipo", "Estado", "Costo"],
      filteredMaintenances.map((record) => [
        getMaintenanceDate(record),
        record.ambulance_code,
        record.maintenance_type,
        record.status,
        getMaintenanceCost(record),
      ])
    )
  }

  const exportBudget = () => {
    downloadCsv(
      "presupuesto_vs_gasto.csv",
      ["Mes", "Presupuesto", "Gasto preventivo", "Gasto correctivo", "Gasto total", "Saldo"],
      monthlyData.map((row) => [
        row.name,
        row.budget,
        row.preventive,
        row.corrective,
        row.expense,
        row.balance,
      ])
    )
  }

  const exportMileage = () => {
    downloadCsv(
      "kilometraje.csv",
      ["Ambulancia", "Patente", "Km manual", "Km GPS", "Km total", "Origen principal"],
      kmByAmbulance.map((row) => [
        row.code,
        row.patent,
        row.manual,
        row.gps,
        row.total,
        row.mainSource,
      ])
    )
  }

  const exportMaintenance = () => {
    downloadCsv(
      "mantenimientos.csv",
      ["Fecha", "Ambulancia", "Tipo", "Estado", "Etapa", "Taller", "Costo"],
      filteredMaintenances.map((record) => [
        getMaintenanceDate(record),
        record.ambulance_code,
        record.maintenance_type,
        record.status,
        record.current_stage || record.status,
        record.workshop_name || "",
        getMaintenanceCost(record),
      ])
    )
  }

  if (currentUser?.role === "Chofer") {
    return (
      <div className="p-6">
        <Card className="p-5 border border-amber-200 bg-amber-50">
          <p className="text-sm font-inter font-semibold text-amber-900">
            Estadísticas no disponibles para Chofer.
          </p>
          <p className="text-sm font-inter text-amber-800 mt-1">
            Este rol solo accede al módulo de formularios operativos.
          </p>
        </Card>
      </div>
    )
  }

  const operativas = filteredAmbulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "operativa"
  ).length
  const enPreventiva = filteredAmbulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_preventiva"
  ).length
  const enCorrectiva = filteredAmbulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "mantencion_correctiva"
  ).length
  const fueraServicio = filteredAmbulances.filter(
    (ambulance) => getEstadoCalculado(ambulance) === "fuera_servicio"
  ).length
  const proximas = filteredAmbulances.filter(
    (ambulance) => getAlertaPreventiva(ambulance) === "proxima_mantencion"
  ).length
  const requeridas = filteredAmbulances.filter(
    (ambulance) =>
      getAlertaPreventiva(ambulance) === "mantencion_preventiva_requerida"
  ).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Estadísticas
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Dashboard operativo y financiero calculado desde Supabase, sin datos simulados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="font-inter" onClick={loadStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" className="font-inter" onClick={exportGeneral}>
            <Download className="w-4 h-4 mr-2" />
            Exportar reporte general
          </Button>
        </div>
      </div>

      {notice && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm font-inter text-amber-800">{notice}</p>
        </Card>
      )}

      {suspiciousRows.length > 0 && (
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-inter font-bold text-red-900">
                Montos sospechosos detectados
              </p>
              <div className="mt-2 space-y-1">
                {suspiciousRows.slice(0, 5).map((row) => (
                  <p key={`${row.source}-${row.id}`} className="text-sm font-inter text-red-800">
                    {row.source}: {row.detail} · {formatCurrency(row.value)} · ID {row.id}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Filtros globales
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-inter text-gray-600">Periodo</label>
            <select
              value={periodMode}
              onChange={(event) => setPeriodMode(event.target.value as PeriodMode)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="month">Mes</option>
              <option value="range">Rango de fechas</option>
              <option value="last6">Últimos 6 meses</option>
              <option value="last12">Últimos 12 meses</option>
              <option value="last24">Últimos 24 meses</option>
              <option value="last36">Últimos 36 meses</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">Mes</label>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">Año</label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            />
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">Ambulancia</label>
            <select
              value={ambulanceFilter}
              onChange={(event) => setAmbulanceFilter(event.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="todos">Todas</option>
              {ambulances.map((ambulance) => (
                <option key={ambulance.id} value={ambulance.id}>
                  {ambulance.id} · {ambulance.patente}
                </option>
              ))}
            </select>
          </div>

          {periodMode === "range" && (
            <>
              <div>
                <label className="text-xs font-inter text-gray-600">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-inter text-gray-600">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-inter text-gray-600">Tipo mantención</label>
            <select
              value={maintenanceTypeFilter}
              onChange={(event) =>
                setMaintenanceTypeFilter(event.target.value as MaintenanceFilter)
              }
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="preventiva">Preventiva</option>
              <option value="correctiva">Correctiva</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">Estado ambulancia</label>
            <select
              value={ambulanceStatusFilter}
              onChange={(event) =>
                setAmbulanceStatusFilter(event.target.value as AmbulanceStatus | "todos")
              }
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="operativa">Operativa</option>
              <option value="mantencion_preventiva">Mantenimiento preventivo</option>
              <option value="mantencion_correctiva">Mantenimiento correctivo</option>
              <option value="fuera_servicio">Fuera de servicio</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">GPS</label>
            <select
              value={gpsFilter}
              onChange={(event) => setGpsFilter(event.target.value as GpsFilter)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="todos">GPS y sin GPS</option>
              <option value="gps">Con GPS</option>
              <option value="sin_gps">Sin GPS</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-inter text-gray-600">Taller</label>
            <select
              value={workshopFilter}
              onChange={(event) => setWorkshopFilter(event.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="todos">Todos</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" className="font-inter" onClick={clearFilters}>
            Limpiar filtros
          </Button>
          <Button variant="outline" className="font-inter" onClick={exportBudget}>
            Exportar presupuesto versus gasto
          </Button>
          <Button variant="outline" className="font-inter" onClick={exportExpenses}>
            Exportar gastos
          </Button>
          <Button variant="outline" className="font-inter" onClick={exportMileage}>
            Exportar kilometraje
          </Button>
          <Button variant="outline" className="font-inter" onClick={exportMaintenance}>
            Exportar mantenimientos
          </Button>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-inter font-bold text-gray-900">Resumen general</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Total ambulancias" value={filteredAmbulances.length} />
          <KpiCard title="Operativas" value={operativas} className="border-green-200 bg-green-50" />
          <KpiCard title="En taller/preventiva" value={enPreventiva} className="border-blue-200 bg-blue-50" />
          <KpiCard title="Correctivas" value={enCorrectiva} className="border-orange-200 bg-orange-50" />
          <KpiCard title="Fuera de servicio" value={fueraServicio} />
          <KpiCard title="Próximas a mantención" value={proximas} className="border-amber-200 bg-amber-50" />
          <KpiCard title="Mantención requerida" value={requeridas} className="border-red-200 bg-red-50" />
          <KpiCard title="Mantenimientos activos" value={dashboardStats.activeMaintenances.length} />
          <KpiCard title="Gasto del periodo" value={formatCurrency(financialStats.totalExpense)} />
          <KpiCard title="Presupuesto disponible" value={formatCurrency(financialStats.balance)} />
          <KpiCard title="% presupuesto usado" value={`${financialStats.usagePercentage.toFixed(1)}%`} />
          <KpiCard title="Sobregasto" value={formatCurrency(financialStats.overspend)} className={financialStats.overspend > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Presupuesto y gastos
          </h2>
        </div>

        {currentUser?.role === "Chofer" ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <KpiCard title="Presupuesto inicial" value={formatCurrency(financialStats.initialBudget)} />
            <KpiCard title="Abonos" value={formatCurrency(financialStats.deposits)} className="border-green-200 bg-green-50" />
            <KpiCard title="Reducciones" value={formatCurrency(financialStats.reductions)} className="border-amber-200 bg-amber-50" />
            <KpiCard title="Correcciones" value={formatCurrency(financialStats.corrections)} />
            <KpiCard title="Presupuesto final" value={formatCurrency(financialStats.finalBudget)} />
            <KpiCard title="Gasto preventivo" value={formatCurrency(financialStats.preventiveExpense)} className="border-blue-200 bg-blue-50" />
            <KpiCard title="Gasto correctivo" value={formatCurrency(financialStats.correctiveExpense)} className="border-orange-200 bg-orange-50" />
            <KpiCard title="Gasto total" value={formatCurrency(financialStats.totalExpense)} />
            <KpiCard title="Saldo disponible" value={formatCurrency(financialStats.balance)} className={financialStats.balance < 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} />
            <KpiCard title="Porcentaje usado" value={`${financialStats.usagePercentage.toFixed(1)}%`} />
          </div>
        )}

        {isAdmin && (
          <Card className="p-5 border border-gray-200">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h3 className="text-base font-inter font-bold text-gray-900">
                  Administración de presupuesto mensual
                </h3>
                <p className="text-sm font-inter text-gray-600 mt-1">
                  Solo Administrador puede editar, abonar, reducir, anular o limpiar datos de prueba.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="font-inter" disabled={isSavingBudget} onClick={resetSelectedMonthBudget}>
                  Reiniciar mes
                </Button>
                <Button variant="outline" className="font-inter text-red-600 hover:text-red-700" disabled={isSavingBudget} onClick={cleanTestBudgetData}>
                  Limpiar datos de prueba del mes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
              <div>
                <label className="text-xs font-inter text-gray-600">Presupuesto inicial</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(budgetInitialInput)}
                  onChange={(event) => setBudgetInitialInput(parseIntegerInput(event.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-inter text-gray-600">Bolsa preventivo</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(preventiveBudgetInput)}
                  onChange={(event) => setPreventiveBudgetInput(parseIntegerInput(event.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-inter text-gray-600">Bolsa correctivo</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(correctiveBudgetInput)}
                  onChange={(event) => setCorrectiveBudgetInput(parseIntegerInput(event.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-inter text-gray-600">Notas</label>
                <Input value={budgetNotes} onChange={(event) => setBudgetNotes(event.target.value)} />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button className="font-inter" disabled={isSavingBudget} onClick={saveMonthlyBudget}>
                Guardar presupuesto del mes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div>
                <label className="text-xs font-inter text-gray-600">Tipo de movimiento</label>
                <select
                  value={movementType}
                  onChange={(event) => setMovementType(event.target.value as MovementType)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="asignacion_inicial">Asignación inicial</option>
                  <option value="abono">Abono</option>
                  <option value="reduccion">Reducción</option>
                  <option value="correccion">Corrección</option>
                  <option value="limpieza_datos_prueba">Limpieza datos prueba</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-inter text-gray-600">Monto</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(movementAmount)}
                  onChange={(event) => setMovementAmount(parseIntegerInput(event.target.value))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-inter text-gray-600">Motivo</label>
                <div className="flex gap-2">
                  <Input value={movementReason} onChange={(event) => setMovementReason(event.target.value)} />
                  <Button className="font-inter whitespace-nowrap" disabled={isSavingBudget} onClick={addBudgetMovement}>
                    Agregar movimiento
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              {selectedMonthMovements.length === 0 ? (
                <EmptyState text="No hay movimientos para el mes seleccionado." />
              ) : (
                <table className="w-full text-sm font-inter">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-3 pr-4">Fecha</th>
                      <th className="py-3 pr-4">Tipo</th>
                      <th className="py-3 pr-4">Monto</th>
                      <th className="py-3 pr-4">Estado</th>
                      <th className="py-3 pr-4">Motivo</th>
                      <th className="py-3 pr-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonthMovements.map((movement) => (
                      <tr key={movement.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4">{movement.movement_date}</td>
                        <td className="py-3 pr-4">{movement.movement_type}</td>
                        <td className="py-3 pr-4">
                          <span className={isSuspiciousAmount(movement.amount) ? "text-red-700 font-semibold" : ""}>
                            {formatCurrency(Number(movement.amount || 0))}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={(movement.status || "activo") === "activo" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
                            {movement.status || "activo"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{movement.reason || movement.description || "Sin motivo"}</td>
                        <td className="py-3 pr-4">
                          <div className="flex justify-end gap-2">
                            {(movement.status || "activo") === "activo" && (
                              <Button variant="outline" size="sm" className="font-inter" onClick={() => cancelMovement(movement)}>
                                Anular
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="font-inter text-red-600 hover:text-red-700" onClick={() => deleteMovement(movement)}>
                              Eliminar prueba
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Presupuesto versus gasto real
            </h3>
            {monthlyData.every((row) => row.budget === 0 && row.expense === 0) ? (
              <EmptyState text="No hay registros financieros para el periodo seleccionado." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => `$${formatNumber(Number(value))}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="budget" name="Presupuesto" fill="#16a34a" />
                    <Bar dataKey="expense" name="Gasto real" fill="#dc2626" />
                    <Line dataKey="balance" name="Saldo" stroke="#2563eb" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Preventivo versus correctivo
            </h3>
            {financialStats.totalExpense === 0 ? (
              <EmptyState text="No hay gasto registrado para el periodo seleccionado." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Preventivo", value: financialStats.preventiveExpense },
                        { name: "Correctivo", value: financialStats.correctiveExpense },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Kilometraje y uso de ambulancias
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Km recorridos" value={formatKmValue(dashboardStats.totalKm)} />
          <KpiCard title="Promedio por ambulancia" value={formatKmValue(filteredAmbulances.length ? dashboardStats.totalKm / filteredAmbulances.length : 0)} />
          <KpiCard title="Km GPS" value={formatKmValue(dashboardStats.gpsKm)} />
          <KpiCard title="Km manual" value={formatKmValue(dashboardStats.manualKm)} />
          <KpiCard title="Registros kilometraje" value={dashboardStats.totalMileageRecords} />
          <KpiCard title="Mayor recorrido" value={kmByAmbulance[0]?.code || "Sin datos"} caption={kmByAmbulance[0] ? formatKmValue(kmByAmbulance[0].total) : "No hay registros"} />
          <KpiCard title="Más cercana a mantención" value={filteredAmbulances.sort((a, b) => getKmFaltantes(a) - getKmFaltantes(b))[0]?.id || "Sin datos"} />
          <KpiCard title="Alertas por km" value={proximas + requeridas} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Evolución mensual de kilómetros
            </h3>
            {monthlyData.every((row) => row.totalKm === 0) ? (
              <EmptyState text="No hay registros de kilometraje para el periodo seleccionado." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => formatNumber(Number(value))} />
                    <Tooltip formatter={(value: number) => formatKmValue(Number(value))} />
                    <Legend />
                    <Line dataKey="gpsKm" name="GPS" stroke="#16a34a" strokeWidth={2} />
                    <Line dataKey="manualKm" name="Manual" stroke="#2563eb" strokeWidth={2} />
                    <Line dataKey="totalKm" name="Total" stroke="#111827" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Kilometraje por ambulancia
            </h3>
            {kmByAmbulance.length === 0 ? (
              <EmptyState text="No hay registros para el periodo seleccionado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-inter">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-3 pr-4">Móvil</th>
                      <th className="py-3 pr-4">Patente</th>
                      <th className="py-3 pr-4">Km</th>
                      <th className="py-3 pr-4">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kmByAmbulance.slice(0, 8).map((row) => (
                      <tr key={row.code} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-semibold">{row.code}</td>
                        <td className="py-3 pr-4">{row.patent}</td>
                        <td className="py-3 pr-4">{formatKmValue(row.total)}</td>
                        <td className="py-3 pr-4">{row.mainSource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 border border-gray-200">
          <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
            Estado de mantención por kilometraje
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-3 pr-4">Móvil</th>
                  <th className="py-3 pr-4">Patente</th>
                  <th className="py-3 pr-4">Uso</th>
                  <th className="py-3 pr-4">Pauta</th>
                  <th className="py-3 pr-4">% usado</th>
                  <th className="py-3 pr-4">Faltan</th>
                  <th className="py-3 pr-4">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {filteredAmbulances.map((ambulance) => {
                  const alert = getAlertaPreventiva(ambulance)
                  return (
                    <tr key={ambulance.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold">{ambulance.id}</td>
                      <td className="py-3 pr-4">{ambulance.patente}</td>
                      <td className="py-3 pr-4">{formatKm(getUsoDesdeMantencion(ambulance))}</td>
                      <td className="py-3 pr-4">{formatKm(ambulance.pautaPreventivaKm)}</td>
                      <td className="py-3 pr-4">{getProgressPercentage(ambulance).toFixed(1)}%</td>
                      <td className="py-3 pr-4">{formatKm(getKmFaltantes(ambulance))}</td>
                      <td className="py-3 pr-4">
                        <Badge className={`${preventiveAlertConfig[alert].badgeClass} font-inter`}>
                          {preventiveAlertConfig[alert].shortLabel}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">Mantenimientos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Totales" value={filteredMaintenances.length} />
          <KpiCard title="Preventivos" value={filteredMaintenances.filter((item) => item.maintenance_type === "preventiva").length} className="border-blue-200 bg-blue-50" />
          <KpiCard title="Correctivos" value={filteredMaintenances.filter((item) => item.maintenance_type === "correctiva").length} className="border-orange-200 bg-orange-50" />
          <KpiCard title="Activos" value={dashboardStats.activeMaintenances.length} />
          <KpiCard title="Finalizados" value={filteredMaintenances.filter((item) => item.status === "finalizada").length} />
          <KpiCard title="Cancelados" value={filteredMaintenances.filter((item) => item.status === "cancelada").length} />
          <KpiCard title="Esperando repuestos" value={filteredMaintenances.filter((item) => item.status === "esperando_repuesto").length} />
          <KpiCard title="Promedio días taller" value={dashboardStats.averageWorkshopDays.toFixed(1)} />
          <KpiCard title="Más costoso" value={dashboardStats.mostExpensive?.ambulance_code || "Sin datos"} caption={dashboardStats.mostExpensive ? formatCurrency(getMaintenanceCost(dashboardStats.mostExpensive)) : ""} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Mantenimientos por mes
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="maintenancePreventiveCount" name="Preventivos" fill="#2563eb" />
                  <Bar dataKey="maintenanceCorrectiveCount" name="Correctivos" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 border border-gray-200">
            <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
              Mantenimientos por etapa
            </h3>
            {maintenanceStageData.length === 0 ? (
              <EmptyState text="No hay etapas registradas en el periodo." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={maintenanceStageData} dataKey="value" nameKey="name" outerRadius={100}>
                      {maintenanceStageData.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 border border-gray-200">
          <h3 className="text-base font-inter font-bold text-gray-900 mb-4">
            Ambulancias con mayor gasto
          </h3>
          {rankingExpenseByAmbulance.length === 0 ? (
            <EmptyState text="No hay gastos para el periodo seleccionado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4">Móvil</th>
                    <th className="py-3 pr-4">Patente</th>
                    <th className="py-3 pr-4">Cantidad</th>
                    <th className="py-3 pr-4">Preventivo</th>
                    <th className="py-3 pr-4">Correctivo</th>
                    <th className="py-3 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingExpenseByAmbulance.map((row) => (
                    <tr key={row.code} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold">{row.code}</td>
                      <td className="py-3 pr-4">{row.patent}</td>
                      <td className="py-3 pr-4">{row.count}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.preventive)}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.corrective)}</td>
                      <td className="py-3 pr-4 font-semibold">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Incidencias y daños reportados
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Daños reportados" value={dashboardStats.damagesCount} />
          <KpiCard title="Ítems malos" value={dashboardStats.badItems} />
          <KpiCard title="Daños pendientes" value="0" caption="Pendiente de clasificar por flujo de daños." />
          <KpiCard title="Convertidos en mantención" value={filteredMaintenances.filter((record) => record.source === "formulario").length} />
        </div>

        <Card className="p-5 border border-gray-200">
          {dashboardStats.damagesCount === 0 ? (
            <EmptyState text="No hay daños reportados para el periodo seleccionado." />
          ) : (
            <p className="text-sm font-inter text-gray-600">
              Hay daños registrados en formularios. La clasificación por severidad y área quedará más precisa cuando se normalicen en form_damage_reports.
            </p>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Ambulance className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Historial detallado por ambulancia
          </h2>
        </div>

        <Card className="p-5 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-inter text-gray-600">
                Buscar por código R o patente
              </label>
              <select
                value={selectedAmbulanceCode}
                onChange={(event) => setSelectedAmbulanceCode(event.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Seleccionar ambulancia</option>
                {ambulances.map((ambulance) => (
                  <option key={ambulance.id} value={ambulance.id}>
                    {ambulance.id} · {ambulance.patente}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedAmbulance ? (
            <EmptyState text="Selecciona una ambulancia para ver su historial completo." />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard title="Código R" value={selectedAmbulance.id} />
                <KpiCard title="Patente" value={selectedAmbulance.patente} />
                <KpiCard title="Modelo" value={selectedAmbulance.modelo} />
                <KpiCard title="Base" value={selectedAmbulance.base} />
                <KpiCard title="Estado actual" value={statusConfig[getEstadoCalculado(selectedAmbulance)].label} />
                <KpiCard title="Kilometraje actual" value={formatKm(selectedAmbulance.kilometrajeActual)} />
                <KpiCard title="Última mantención" value={formatKm(selectedAmbulance.kilometrajeUltimaMantencion)} />
                <KpiCard title="Próxima mantención" value={formatKm(getKmFaltantes(selectedAmbulance))} />
                <KpiCard title="Gasto histórico" value={formatCurrency(selectedAmbulanceHistory.maintenances.reduce((sum, record) => sum + getMaintenanceCost(record), 0))} />
                <KpiCard title="Mantenimientos" value={selectedAmbulanceHistory.maintenances.length} />
                <KpiCard title="Daños reportados" value={selectedAmbulanceHistory.forms.reduce((sum, form) => sum + asArray(form.damage_reports).length, 0)} />
                <KpiCard title="GPS" value={Boolean((selectedAmbulance as any).hasGps) ? "Sí" : "No"} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-inter font-bold text-gray-900 mb-3">
                    Historial de kilometraje
                  </h3>
                  {selectedAmbulanceHistory.mileages.length === 0 ? (
                    <EmptyState text="Sin registros de kilometraje." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-inter">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Origen</th>
                            <th className="py-2 pr-3">Anterior</th>
                            <th className="py-2 pr-3">Nuevo</th>
                            <th className="py-2 pr-3">Km</th>
                            <th className="py-2 pr-3">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAmbulanceHistory.mileages.slice(0, 10).map((row) => (
                            <tr key={row.id} className="border-b border-gray-100">
                              <td className="py-2 pr-3">{row.created_at.slice(0, 10)}</td>
                              <td className="py-2 pr-3">{row.source_type || "Sin origen"}</td>
                              <td className="py-2 pr-3">{formatNumber(Number(row.previous_mileage || 0))}</td>
                              <td className="py-2 pr-3">{formatNumber(Number(row.new_mileage || 0))}</td>
                              <td className="py-2 pr-3">{formatKmValue(getTravelledKm(row))}</td>
                              <td className="py-2 pr-3">{row.registered_by_name || "Sin usuario"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                <Card className="p-4 border border-gray-200">
                  <h3 className="text-sm font-inter font-bold text-gray-900 mb-3">
                    Historial de mantenimiento
                  </h3>
                  {selectedAmbulanceHistory.maintenances.length === 0 ? (
                    <EmptyState text="Sin mantenimientos registrados." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-inter">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Tipo</th>
                            <th className="py-2 pr-3">Estado</th>
                            <th className="py-2 pr-3">Etapa</th>
                            <th className="py-2 pr-3">Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAmbulanceHistory.maintenances.slice(0, 10).map((row) => (
                            <tr key={row.id} className="border-b border-gray-100">
                              <td className="py-2 pr-3">{getMaintenanceDate(row).slice(0, 10)}</td>
                              <td className="py-2 pr-3">{row.maintenance_type}</td>
                              <td className="py-2 pr-3">{row.status}</td>
                              <td className="py-2 pr-3">{row.current_stage || row.status}</td>
                              <td className="py-2 pr-3">{formatCurrency(getMaintenanceCost(row))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Card className="p-5 border border-gray-200">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
          <p className="text-sm font-inter text-gray-600">
            Estas métricas se recalculan desde registros existentes. Si un filtro no tiene datos, se muestran estados vacíos en vez de valores inventados.
          </p>
        </div>
      </Card>
    </div>
  )
}
