import { useEffect, useMemo, useState, type ReactNode } from "react"
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
import {
  Ambulance,
  BarChart3,
  CalendarDays,
  Download,
  RefreshCw,
  Route,
  WalletCards,
  Warehouse,
  Wrench,
} from "lucide-react"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { supabase } from "../../lib/supabaseClient"
import { useAmbulances } from "../AmbulanceContext"
import { useAuth } from "../AuthContext"

type StatsSection = "kilometraje" | "presupuesto" | "mantenimientos" | "talleres" | "ambulancia"
type RangeMode = "last6" | "last12" | "last36"
type SplitMode = "cantidad" | "gasto"

interface RouteFormStatsRow {
  id: string
  ambulance_code: string
  ambulance_patente: string | null
  registered_by_name: string | null
  total_km: number | null
  start_km: number | null
  end_km: number | null
  damage_reports: unknown
  form_date: string | null
  created_at: string | null
  status: string | null
}

interface MaintenanceStatsRow {
  id: string
  ambulance_code: string
  ambulance_patente: string | null
  maintenance_type: "preventiva" | "correctiva"
  reason: string | null
  workshop_id: string | null
  workshop_name: string | null
  estimated_cost: number | null
  final_cost: number | null
  status: string
  current_stage: string | null
  scheduled_date: string | null
  started_at: string | null
  finished_at: string | null
  archived_at: string | null
  created_at: string | null
}

interface MileageLogRow {
  id: string
  ambulance_code: string | null
  previous_mileage: number | null
  new_mileage: number | null
  travelled_km: number | null
  source_type: string | null
  created_at: string | null
}

interface GpsMileageLogRow {
  id: string
  ambulance_code: string | null
  travelled_km: number | null
  recorded_at: string | null
}

interface BudgetRow {
  id: string
  budget_year: number | null
  budget_month: number | null
  budget_type: string | null
  total_amount: number | null
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
  created_at: string | null
  updated_at: string | null
}

interface BudgetMovementRow {
  id: string
  budget_id: string | null
  year: number | null
  month: number | null
  movement_type: string | null
  amount: number | null
  movement_date: string | null
  reason: string | null
  status: string | null
}

interface WorkshopRow {
  id: string
  name: string
}

const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth() + 1
const VERY_HIGH_AMOUNT = 1_000_000_000
const MONEY_BLUE = "#2563eb"
const MONEY_ORANGE = "#f97316"
const MONEY_GREEN = "#16a34a"
const MONEY_RED = "#dc2626"
const MONEY_PURPLE = "#7c3aed"

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

const sectionConfig: Array<{
  id: StatsSection
  label: string
  icon: typeof Route
}> = [
  { id: "kilometraje", label: "Kilometraje", icon: Route },
  { id: "presupuesto", label: "Presupuesto y gastos", icon: WalletCards },
  { id: "mantenimientos", label: "Mantenimientos", icon: Wrench },
  { id: "talleres", label: "Talleres", icon: Warehouse },
  { id: "ambulancia", label: "Ambulancia individual", icon: Ambulance },
]

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  )

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const formatKm = (value: number) => `${formatNumber(Math.max(0, value))} km`

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0
  )}%`

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

const parseDate = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

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

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const buildRecentMonthKeys = (months: number) => {
  const start = addMonths(startOfMonth(today), -(months - 1))
  const keys: string[] = []
  let cursor = new Date(start)

  while (cursor <= today) {
    keys.push(monthKey(cursor.getFullYear(), cursor.getMonth() + 1))
    cursor = addMonths(cursor, 1)
  }

  return keys
}

const safeAmount = (value: number | null | undefined) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount < 0 || amount >= VERY_HIGH_AMOUNT) return 0
  return amount
}

const isSuspiciousAmount = (value: number | null | undefined) => {
  const amount = Number(value || 0)
  return amount < 0 || amount >= VERY_HIGH_AMOUNT
}

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

const getBudgetYear = (budget: BudgetRow) => budget.year ?? budget.budget_year ?? 0
const getBudgetMonth = (budget: BudgetRow) => budget.month ?? budget.budget_month ?? 0
const getBudgetTotal = (budget: BudgetRow) =>
  safeAmount(budget.total_budget ?? budget.total_amount ?? budget.initial_budget)

const getPreventiveBudget = (budget: BudgetRow) => {
  const direct = safeAmount(budget.preventive_budget)
  if (direct > 0) return direct
  const type = (budget.budget_type || "").toLowerCase()
  return type.includes("prevent") ? getBudgetTotal(budget) : 0
}

const getCorrectiveBudget = (budget: BudgetRow) => {
  const direct = safeAmount(budget.corrective_budget)
  if (direct > 0) return direct
  const type = (budget.budget_type || "").toLowerCase()
  return type.includes("correct") ? getBudgetTotal(budget) : 0
}

const getMaintenanceDate = (record: MaintenanceStatsRow) =>
  record.finished_at || record.started_at || record.scheduled_date || record.created_at

const getMaintenanceCost = (record: MaintenanceStatsRow, finalOnly = false) => {
  if (record.status === "cancelada") return 0
  if (finalOnly && !record.final_cost) return 0
  return safeAmount(record.final_cost ?? record.estimated_cost)
}

const getRouteKm = (form: RouteFormStatsRow) => {
  const total = Number(form.total_km || 0)
  if (Number.isFinite(total) && total > 0) return total
  const start = Number(form.start_km || 0)
  const end = Number(form.end_km || 0)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, end - start)
}

const getTravelledKm = (log: MileageLogRow) => {
  const direct = Number(log.travelled_km || 0)
  if (Number.isFinite(direct) && direct > 0) return direct
  const start = Number(log.previous_mileage || 0)
  const end = Number(log.new_mileage || 0)
  return Math.max(0, end - start)
}

const isActiveMaintenance = (status: string) =>
  ["programada", "en_taller", "esperando_repuesto", "atrasado", "atrasada"].includes(status)

const isFinishedMaintenance = (status: string) =>
  ["finalizada", "finalizado"].includes(status)

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    operativa: "Operativa",
    mantencion_preventiva: "Mantenimiento preventivo",
    mantencion_correctiva: "Mantenimiento correctivo",
    fuera_servicio: "Fuera de servicio",
    proxima_mantencion: "Próxima a mantención",
  }
  return labels[status] || status || "Sin estado"
}

const badgeClassForStatus = (status: string) => {
  if (status.includes("requerida") || status.includes("fuera") || status.includes("atras")) {
    return "bg-red-50 text-red-700 border-red-200"
  }
  if (status.includes("preventiva")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (status.includes("correctiva")) return "bg-orange-50 text-orange-700 border-orange-200"
  if (status.includes("taller") || status.includes("mantenimiento")) {
    return "bg-purple-50 text-purple-700 border-purple-200"
  }
  if (status.includes("próxima") || status.includes("proxima")) {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }
  if (status.includes("final")) return "bg-green-50 text-green-700 border-green-200"
  return "bg-slate-50 text-slate-700 border-slate-200"
}

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  )
}

function SummaryCard({
  title,
  value,
  rows,
  color,
  icon: Icon,
  progress,
}: {
  title: string
  value: string
  rows: Array<{ label: string; value: string; tone?: string }>
  color: "green" | "red" | "blue" | "purple"
  icon: typeof Route
  progress?: number
}) {
  const iconClasses = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  }
  const progressClasses = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  }

  return (
    <Card className="min-h-[148px] border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${iconClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{row.label}</span>
            <span className={`font-semibold ${row.tone || "text-slate-900"}`}>{row.value}</span>
          </div>
        ))}
      </div>
      {typeof progress === "number" && (
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full ${progressClasses[color]}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </Card>
  )
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </Card>
  )
}

export function ReportsTab() {
  const { currentUser } = useAuth()
  const {
    ambulances,
    getEstadoCalculado,
    getAlertaPreventiva,
    getUsoDesdeMantencion,
    getProgressPercentage,
  } = useAmbulances()
  const isAdmin = currentUser?.role === "Administrador"

  const [forms, setForms] = useState<RouteFormStatsRow[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceStatsRow[]>([])
  const [mileageLogs, setMileageLogs] = useState<MileageLogRow[]>([])
  const [gpsMileageLogs, setGpsMileageLogs] = useState<GpsMileageLogRow[]>([])
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [budgetMovements, setBudgetMovements] = useState<BudgetMovementRow[]>([])
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([])
  const [activeSection, setActiveSection] = useState<StatsSection>("kilometraje")
  const [rangeMode, setRangeMode] = useState<RangeMode>("last12")
  const [baseFilter, setBaseFilter] = useState("todos")
  const [ambulanceFilter, setAmbulanceFilter] = useState("todos")
  const [workshopFilter, setWorkshopFilter] = useState("todos")
  const [splitMode, setSplitMode] = useState<SplitMode>("gasto")
  const [selectedAmbulanceCode, setSelectedAmbulanceCode] = useState("")
  const [budgetYear, setBudgetYear] = useState(currentYear)
  const [budgetMonth, setBudgetMonth] = useState(currentMonth)
  const [preventiveBudgetInput, setPreventiveBudgetInput] = useState(0)
  const [correctiveBudgetInput, setCorrectiveBudgetInput] = useState(0)
  const [budgetNotes, setBudgetNotes] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const [notice, setNotice] = useState("")

  const selectedBudget = useMemo(
    () =>
      budgets.find(
        (budget) =>
          (budget.is_active ?? true) &&
          getBudgetYear(budget) === budgetYear &&
          getBudgetMonth(budget) === budgetMonth
      ) || null,
    [budgetMonth, budgetYear, budgets]
  )

  useEffect(() => {
    setPreventiveBudgetInput(selectedBudget ? getPreventiveBudget(selectedBudget) : 0)
    setCorrectiveBudgetInput(selectedBudget ? getCorrectiveBudget(selectedBudget) : 0)
    setBudgetNotes(selectedBudget?.notes || "")
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
        .select("id, ambulance_code, ambulance_patente, registered_by_name, total_km, start_km, end_km, damage_reports, form_date, created_at, status")
        .order("form_date", { ascending: false }),
      supabase
        .from("maintenance_records")
        .select("id, ambulance_code, ambulance_patente, maintenance_type, reason, workshop_id, workshop_name, estimated_cost, final_cost, status, current_stage, scheduled_date, started_at, finished_at, archived_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("mileage_logs")
        .select("id, ambulance_code, previous_mileage, new_mileage, travelled_km, source_type, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("gps_mileage_logs")
        .select("id, ambulance_code, travelled_km, recorded_at")
        .order("recorded_at", { ascending: false }),
      supabase
        .from("maintenance_budgets")
        .select("id, budget_year, budget_month, budget_type, total_amount, spent_amount, year, month, initial_budget, preventive_budget, corrective_budget, total_budget, notes, is_active, created_by_name, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("budget_movements")
        .select("id, budget_id, year, month, movement_type, amount, movement_date, reason, status")
        .order("created_at", { ascending: false }),
      supabase.from("maintenance_workshops").select("id, name").order("name"),
    ])

    const notices = [
      formsResponse.error ? "Formularios no disponibles." : "",
      maintenanceResponse.error ? "Mantenimientos no disponibles." : "",
      mileageResponse.error ? "Historial de kilometraje no disponible." : "",
      gpsMileageResponse.error ? "Historial GPS no disponible." : "",
      budgetsResponse.error ? "Presupuesto no disponible." : "",
      movementsResponse.error ? "Movimientos de presupuesto no disponibles." : "",
      workshopsResponse.error ? "Talleres no disponibles." : "",
    ].filter(Boolean)

    setForms((formsResponse.data || []) as RouteFormStatsRow[])
    setMaintenances((maintenanceResponse.data || []) as MaintenanceStatsRow[])
    setMileageLogs((mileageResponse.data || []) as MileageLogRow[])
    setGpsMileageLogs((gpsMileageResponse.data || []) as GpsMileageLogRow[])
    setBudgets((budgetsResponse.data || []) as BudgetRow[])
    setBudgetMovements((movementsResponse.data || []) as BudgetMovementRow[])
    setWorkshops((workshopsResponse.data || []) as WorkshopRow[])
    setNotice(notices.join(" "))
    setIsLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const rangeMonths = rangeMode === "last6" ? 6 : rangeMode === "last36" ? 36 : 12
  const periodKeys = useMemo(() => buildRecentMonthKeys(rangeMonths), [rangeMonths])
  const periodSet = useMemo(() => new Set(periodKeys), [periodKeys])

  const baseOptions = useMemo(
    () =>
      Array.from(new Set(ambulances.map((ambulance) => ambulance.base).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "es-CL")
      ),
    [ambulances]
  )

  const allowedAmbulances = useMemo(
    () =>
      ambulances.filter((ambulance) => {
        const matchesBase = baseFilter === "todos" || ambulance.base === baseFilter
        const matchesAmbulance = ambulanceFilter === "todos" || ambulance.id === ambulanceFilter
        return matchesBase && matchesAmbulance
      }),
    [ambulanceFilter, ambulances, baseFilter]
  )

  const allowedCodes = useMemo(
    () => new Set(allowedAmbulances.map((ambulance) => ambulance.id)),
    [allowedAmbulances]
  )

  const filteredForms = useMemo(
    () =>
      forms.filter((form) => periodSet.has(dateMonthKey(form.form_date || form.created_at)) && allowedCodes.has(form.ambulance_code)),
    [allowedCodes, forms, periodSet]
  )

  const filteredMileageLogs = useMemo(
    () =>
      mileageLogs.filter(
        (log) =>
          log.ambulance_code &&
          allowedCodes.has(log.ambulance_code) &&
          periodSet.has(dateMonthKey(log.created_at))
      ),
    [allowedCodes, mileageLogs, periodSet]
  )

  const filteredGpsMileageLogs = useMemo(
    () =>
      gpsMileageLogs.filter(
        (log) =>
          log.ambulance_code &&
          allowedCodes.has(log.ambulance_code) &&
          periodSet.has(dateMonthKey(log.recorded_at))
      ),
    [allowedCodes, gpsMileageLogs, periodSet]
  )

  const filteredMaintenances = useMemo(
    () =>
      maintenances.filter((record) => {
        const key = dateMonthKey(getMaintenanceDate(record))
        const matchesPeriod = periodSet.has(key)
        const matchesCode = allowedCodes.has(record.ambulance_code)
        const matchesWorkshop = workshopFilter === "todos" || record.workshop_id === workshopFilter
        return matchesPeriod && matchesCode && matchesWorkshop
      }),
    [allowedCodes, maintenances, periodSet, workshopFilter]
  )

  const kmForMonth = (key: string) => {
    const formRows = forms.filter(
      (form) => dateMonthKey(form.form_date || form.created_at) === key && allowedCodes.has(form.ambulance_code)
    )
    const formKm = formRows.reduce((sum, form) => sum + getRouteKm(form), 0)
    if (formKm > 0) return formKm

    const manual = mileageLogs
      .filter((log) => dateMonthKey(log.created_at) === key && log.ambulance_code && allowedCodes.has(log.ambulance_code))
      .reduce((sum, log) => sum + getTravelledKm(log), 0)
    const gps = gpsMileageLogs
      .filter((log) => dateMonthKey(log.recorded_at) === key && log.ambulance_code && allowedCodes.has(log.ambulance_code))
      .reduce((sum, log) => sum + safeAmount(log.travelled_km), 0)

    return manual + gps
  }

  const annualBudgetStats = useMemo(() => {
    const annualBudgets = budgets.filter(
      (budget) => (budget.is_active ?? true) && getBudgetYear(budget) === currentYear
    )
    const preventiveAssigned = annualBudgets.reduce((sum, budget) => sum + getPreventiveBudget(budget), 0)
    const correctiveAssigned = annualBudgets.reduce((sum, budget) => sum + getCorrectiveBudget(budget), 0)
    const annualMaintenance = maintenances.filter((record) => parseDate(getMaintenanceDate(record))?.getFullYear() === currentYear)
    const preventiveSpent = annualMaintenance
      .filter((record) => record.maintenance_type === "preventiva")
      .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
    const correctiveSpent = annualMaintenance
      .filter((record) => record.maintenance_type === "correctiva")
      .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
    const suspicious = [...budgets, ...budgetMovements].some((item) => isSuspiciousAmount((item as any).amount ?? (item as BudgetRow).total_budget ?? (item as BudgetRow).total_amount))

    return {
      preventiveAssigned,
      correctiveAssigned,
      preventiveSpent,
      correctiveSpent,
      preventiveBalance: preventiveAssigned - preventiveSpent,
      correctiveBalance: correctiveAssigned - correctiveSpent,
      preventiveUsage: preventiveAssigned > 0 ? (preventiveSpent / preventiveAssigned) * 100 : 0,
      correctiveUsage: correctiveAssigned > 0 ? (correctiveSpent / correctiveAssigned) * 100 : 0,
      suspicious,
    }
  }, [budgetMovements, budgets, maintenances])

  const currentMonthKey = monthKey(currentYear, currentMonth)
  const previousMonthKey = monthKey(addMonths(today, -1).getFullYear(), addMonths(today, -1).getMonth() + 1)
  const currentMonthKm = kmForMonth(currentMonthKey)
  const previousMonthKm = kmForMonth(previousMonthKey)
  const kmVariation = previousMonthKm > 0 ? ((currentMonthKm - previousMonthKm) / previousMonthKm) * 100 : 0

  const fleetStatus = useMemo(() => {
    const operational = ambulances.filter((ambulance) => getEstadoCalculado(ambulance) === "operativa").length
    const inMaintenance = ambulances.filter((ambulance) =>
      ["mantencion_preventiva", "mantencion_correctiva"].includes(getEstadoCalculado(ambulance))
    ).length
    const outOfService = ambulances.filter((ambulance) => getEstadoCalculado(ambulance) === "fuera_servicio").length
    const total = ambulances.length
    return {
      operational,
      inMaintenance,
      outOfService,
      total,
      operativity: total > 0 ? (operational / total) * 100 : 0,
      chart: [
        { name: "Operativas", value: operational, color: MONEY_GREEN },
        { name: "En mantenimiento", value: inMaintenance, color: MONEY_ORANGE },
        { name: "Fuera de servicio", value: outOfService, color: MONEY_RED },
      ].filter((item) => item.value > 0),
    }
  }, [ambulances, getEstadoCalculado])

  const fleetKmData = useMemo(
    () =>
      periodKeys.map((key) => ({
        key,
        name: monthLabel(key),
        km: kmForMonth(key),
      })),
    [allowedCodes, forms, gpsMileageLogs, mileageLogs, periodKeys]
  )

  const kmByAmbulance = useMemo(() => {
    const hasRouteKm = filteredForms.some((form) => getRouteKm(form) > 0)
    const rows = new Map<string, { code: string; patent: string; km: number }>()

    const addKm = (code: string, km: number) => {
      const ambulance = ambulances.find((item) => item.id === code)
      const current = rows.get(code) || { code, patent: ambulance?.patente || "Sin patente", km: 0 }
      current.km += Math.max(0, km)
      rows.set(code, current)
    }

    if (hasRouteKm) {
      filteredForms.forEach((form) => addKm(form.ambulance_code, getRouteKm(form)))
    } else {
      filteredMileageLogs.forEach((log) => log.ambulance_code && addKm(log.ambulance_code, getTravelledKm(log)))
      filteredGpsMileageLogs.forEach((log) => log.ambulance_code && addKm(log.ambulance_code, safeAmount(log.travelled_km)))
    }

    return Array.from(rows.values()).sort((a, b) => b.km - a.km).slice(0, 10)
  }, [ambulances, filteredForms, filteredGpsMileageLogs, filteredMileageLogs])

  const monthlyExpenseData = useMemo(
    () =>
      periodKeys.map((key) => {
        const rows = filteredMaintenances.filter((record) => dateMonthKey(getMaintenanceDate(record)) === key)
        const preventive = rows
          .filter((record) => record.maintenance_type === "preventiva")
          .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
        const corrective = rows
          .filter((record) => record.maintenance_type === "correctiva")
          .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
        return { key, name: monthLabel(key), preventive, corrective, total: preventive + corrective }
      }),
    [filteredMaintenances, periodKeys]
  )

  const budgetVsExpenseData = useMemo(() => {
    return periodKeys.map((key) => {
      const [year, month] = key.split("-").map(Number)
      const monthBudgets = budgets.filter(
        (budget) => (budget.is_active ?? true) && getBudgetYear(budget) === year && getBudgetMonth(budget) === month
      )
      const expenses = monthlyExpenseData.find((row) => row.key === key)
      const preventiveBudget = monthBudgets.reduce((sum, budget) => sum + getPreventiveBudget(budget), 0)
      const correctiveBudget = monthBudgets.reduce((sum, budget) => sum + getCorrectiveBudget(budget), 0)
      return {
        key,
        name: monthLabel(key),
        preventiveBudget,
        correctiveBudget,
        preventiveSpent: expenses?.preventive || 0,
        correctiveSpent: expenses?.corrective || 0,
      }
    })
  }, [budgets, monthlyExpenseData, periodKeys])

  const maintenanceByAmbulance = useMemo(() => {
    const rows = new Map<string, { code: string; preventive: number; corrective: number }>()
    filteredMaintenances.forEach((record) => {
      const current = rows.get(record.ambulance_code) || {
        code: record.ambulance_code,
        preventive: 0,
        corrective: 0,
      }
      if (record.maintenance_type === "preventiva") current.preventive += 1
      if (record.maintenance_type === "correctiva") current.corrective += 1
      rows.set(record.ambulance_code, current)
    })
    return Array.from(rows.values())
      .sort((a, b) => b.preventive + b.corrective - (a.preventive + a.corrective))
      .slice(0, 10)
  }, [filteredMaintenances])

  const preventiveCorrectiveSplit = useMemo(() => {
    const preventiveRows = filteredMaintenances.filter((record) => record.maintenance_type === "preventiva")
    const correctiveRows = filteredMaintenances.filter((record) => record.maintenance_type === "correctiva")
    const preventive =
      splitMode === "cantidad"
        ? preventiveRows.length
        : preventiveRows.reduce((sum, record) => sum + getMaintenanceCost(record), 0)
    const corrective =
      splitMode === "cantidad"
        ? correctiveRows.length
        : correctiveRows.reduce((sum, record) => sum + getMaintenanceCost(record), 0)

    return [
      { name: "Preventivos", value: preventive, color: MONEY_BLUE },
      { name: "Correctivos", value: corrective, color: MONEY_ORANGE },
    ].filter((item) => item.value > 0)
  }, [filteredMaintenances, splitMode])

  const workshopData = useMemo(() => {
    const rows = new Map<
      string,
      {
        id: string
        name: string
        preventiveCost: number
        correctiveCost: number
        preventiveCount: number
        correctiveCount: number
      }
    >()

    filteredMaintenances.forEach((record) => {
      const id = record.workshop_id || record.workshop_name || "sin-taller"
      const name = record.workshop_name || workshops.find((workshop) => workshop.id === record.workshop_id)?.name || "Sin taller"
      const current =
        rows.get(id) ||
        {
          id,
          name,
          preventiveCost: 0,
          correctiveCost: 0,
          preventiveCount: 0,
          correctiveCount: 0,
        }
      if (record.maintenance_type === "preventiva") {
        current.preventiveCost += getMaintenanceCost(record)
        current.preventiveCount += 1
      } else {
        current.correctiveCost += getMaintenanceCost(record)
        current.correctiveCount += 1
      }
      rows.set(id, current)
    })

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        totalCost: row.preventiveCost + row.correctiveCost,
        totalCount: row.preventiveCount + row.correctiveCount,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 8)
  }, [filteredMaintenances, workshops])

  const selectedAmbulance = useMemo(
    () => ambulances.find((ambulance) => ambulance.id === selectedAmbulanceCode) || null,
    [ambulances, selectedAmbulanceCode]
  )

  const individualKmData = useMemo(() => {
    if (!selectedAmbulance) return []
    return periodKeys.map((key) => {
      const formKm = forms
        .filter((form) => form.ambulance_code === selectedAmbulance.id && dateMonthKey(form.form_date || form.created_at) === key)
        .reduce((sum, form) => sum + getRouteKm(form), 0)
      const fallbackKm =
        formKm > 0
          ? 0
          : mileageLogs
              .filter((log) => log.ambulance_code === selectedAmbulance.id && dateMonthKey(log.created_at) === key)
              .reduce((sum, log) => sum + getTravelledKm(log), 0)
      return { key, name: monthLabel(key), km: formKm || fallbackKm }
    })
  }, [forms, mileageLogs, periodKeys, selectedAmbulance])

  const individualExpenseData = useMemo(() => {
    if (!selectedAmbulance) return []
    return periodKeys.map((key) => {
      const rows = maintenances.filter(
        (record) => record.ambulance_code === selectedAmbulance.id && dateMonthKey(getMaintenanceDate(record)) === key
      )
      const preventive = rows
        .filter((record) => record.maintenance_type === "preventiva")
        .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
      const corrective = rows
        .filter((record) => record.maintenance_type === "correctiva")
        .reduce((sum, record) => sum + getMaintenanceCost(record), 0)
      return { key, name: monthLabel(key), preventive, corrective, total: preventive + corrective }
    })
  }, [maintenances, periodKeys, selectedAmbulance])

  const criticalUnits = useMemo(() => {
    return ambulances
      .map((ambulance) => {
        const estado = getEstadoCalculado(ambulance)
        const alert = getAlertaPreventiva(ambulance)
        const activeMaintenance = maintenances.find(
          (record) => record.ambulance_code === ambulance.id && !record.archived_at && isActiveMaintenance(record.status)
        )
        const pendingDamages = forms
          .filter((form) => form.ambulance_code === ambulance.id)
          .flatMap((form) => asArray(form.damage_reports))
          .filter((damage) => {
            const status = String(damage?.status || damage?.estado || "Pendiente").toLowerCase()
            return status === "pendiente"
          }).length
        const reasons: string[] = []
        if (activeMaintenance) reasons.push("En mantenimiento")
        if (estado === "mantencion_preventiva") reasons.push("Preventiva")
        if (estado === "mantencion_correctiva") reasons.push("Correctiva")
        if (estado === "fuera_servicio") reasons.push("Fuera de servicio")
        if (alert === "mantencion_preventiva_requerida") reasons.push("Mantención requerida")
        if (alert === "proxima_mantencion") reasons.push("Próxima a mantención")
        if (pendingDamages > 0) reasons.push("Daño pendiente")

        const spent = maintenances
          .filter((record) => record.ambulance_code === ambulance.id && periodSet.has(dateMonthKey(getMaintenanceDate(record))))
          .reduce((sum, record) => sum + getMaintenanceCost(record), 0)

        return { ambulance, reasons, spent, activeMaintenance }
      })
      .filter((row) => row.reasons.length > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
  }, [ambulances, forms, getAlertaPreventiva, getEstadoCalculado, maintenances, periodSet])

  const latestMaintenances = useMemo(
    () =>
      maintenances
        .filter((record) => isFinishedMaintenance(record.status))
        .sort((a, b) => (parseDate(getMaintenanceDate(b))?.getTime() || 0) - (parseDate(getMaintenanceDate(a))?.getTime() || 0))
        .slice(0, 6),
    [maintenances]
  )

  const suspiciousData = useMemo(
    () =>
      budgets.some(
        (budget) =>
          isSuspiciousAmount(budget.total_amount) ||
          isSuspiciousAmount(budget.total_budget) ||
          isSuspiciousAmount(budget.preventive_budget) ||
          isSuspiciousAmount(budget.corrective_budget)
      ) ||
      budgetMovements.some((movement) => isSuspiciousAmount(movement.amount)) ||
      maintenances.some((record) => isSuspiciousAmount(record.final_cost) || isSuspiciousAmount(record.estimated_cost)),
    [budgetMovements, budgets, maintenances]
  )

  const saveMonthlyBudget = async () => {
    if (!isAdmin || !currentUser) return
    if (preventiveBudgetInput < 0 || correctiveBudgetInput < 0) {
      window.alert("El presupuesto no puede ser negativo.")
      return
    }
    const totalBudget = preventiveBudgetInput + correctiveBudgetInput
    if (
      totalBudget >= VERY_HIGH_AMOUNT &&
      !window.confirm("El monto parece demasiado alto. Confirma solo si corresponde.")
    ) {
      return
    }

    setIsSavingBudget(true)
    const payload = {
      budget_year: budgetYear,
      budget_month: budgetMonth,
      budget_type: "mensual",
      total_amount: totalBudget,
      spent_amount: 0,
      year: budgetYear,
      month: budgetMonth,
      initial_budget: totalBudget,
      preventive_budget: preventiveBudgetInput,
      corrective_budget: correctiveBudgetInput,
      total_budget: totalBudget,
      notes: budgetNotes.trim() || null,
      is_active: true,
      created_by_name: currentUser.name,
      updated_at: new Date().toISOString(),
    }

    const response = selectedBudget
      ? await supabase.from("maintenance_budgets").update(payload).eq("id", selectedBudget.id)
      : await supabase.from("maintenance_budgets").insert({ ...payload, created_at: new Date().toISOString() })

    setIsSavingBudget(false)
    if (response.error) {
      window.alert(`No se pudo guardar el presupuesto: ${response.error.message}`)
      return
    }

    await loadStats()
  }

  const exportCurrentSection = () => {
    if (activeSection === "kilometraje") {
      downloadCsv(
        "estadisticas-kilometraje.csv",
        ["Mes", "Km flota"],
        fleetKmData.map((row) => [row.name, row.km])
      )
      return
    }
    if (activeSection === "presupuesto") {
      downloadCsv(
        "estadisticas-presupuesto.csv",
        ["Mes", "Presupuesto preventivo", "Gasto preventivo", "Presupuesto correctivo", "Gasto correctivo"],
        budgetVsExpenseData.map((row) => [
          row.name,
          row.preventiveBudget,
          row.preventiveSpent,
          row.correctiveBudget,
          row.correctiveSpent,
        ])
      )
      return
    }
    if (activeSection === "talleres") {
      downloadCsv(
        "estadisticas-talleres.csv",
        ["Taller", "Mantenciones", "Preventivos", "Correctivos", "Gasto total"],
        workshopData.map((row) => [row.name, row.totalCount, row.preventiveCount, row.correctiveCount, row.totalCost])
      )
      return
    }
    downloadCsv(
      "estadisticas-mantenimientos.csv",
      ["Ambulancia", "Preventivos", "Correctivos"],
      maintenanceByAmbulance.map((row) => [row.code, row.preventive, row.corrective])
    )
  }

  const selectedBudgetMonthExpense = monthlyExpenseData.find((row) => row.key === monthKey(budgetYear, budgetMonth))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">Estadísticas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Panel visual para kilometraje, gastos, mantenimientos, talleres y evolución por ambulancia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCurrentSection}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {notice && (
        <Card className="border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {notice}
        </Card>
      )}

      {suspiciousData && (
        <Card className="border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Existen montos pendientes de revisión. Esos valores no se usan para inflar los gráficos.
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Presupuesto Preventivo Anual"
          value={annualBudgetStats.suspicious ? "Pendiente de revisión" : formatCurrency(annualBudgetStats.preventiveAssigned)}
          color="green"
          icon={WalletCards}
          progress={annualBudgetStats.preventiveUsage}
          rows={[
            { label: "Gastado", value: formatCurrency(annualBudgetStats.preventiveSpent), tone: "text-green-700" },
            { label: "Saldo", value: formatCurrency(annualBudgetStats.preventiveBalance), tone: annualBudgetStats.preventiveBalance < 0 ? "text-red-700" : "text-blue-700" },
            { label: "Uso", value: formatPercent(annualBudgetStats.preventiveUsage) },
          ]}
        />
        <SummaryCard
          title="Presupuesto Correctivo Anual"
          value={annualBudgetStats.suspicious ? "Pendiente de revisión" : formatCurrency(annualBudgetStats.correctiveAssigned)}
          color="red"
          icon={CalendarDays}
          progress={annualBudgetStats.correctiveUsage}
          rows={[
            { label: "Gastado", value: formatCurrency(annualBudgetStats.correctiveSpent), tone: "text-red-700" },
            { label: "Saldo", value: formatCurrency(annualBudgetStats.correctiveBalance), tone: annualBudgetStats.correctiveBalance < 0 ? "text-red-700" : "text-blue-700" },
            { label: "Uso", value: formatPercent(annualBudgetStats.correctiveUsage) },
          ]}
        />
        <SummaryCard
          title="Km Recorridos Este Mes"
          value={formatKm(currentMonthKm)}
          color="blue"
          icon={Route}
          rows={[
            { label: "Mes anterior", value: formatKm(previousMonthKm) },
            { label: "Variación", value: previousMonthKm > 0 ? formatPercent(kmVariation) : "Sin comparación", tone: kmVariation >= 0 ? "text-green-700" : "text-red-700" },
          ]}
        />
        <SummaryCard
          title="Operatividad de la Flota"
          value={formatPercent(fleetStatus.operativity)}
          color="purple"
          icon={Ambulance}
          rows={[
            { label: "Operativas", value: String(fleetStatus.operational), tone: "text-green-700" },
            { label: "En mantenimiento", value: String(fleetStatus.inMaintenance), tone: "text-orange-700" },
            { label: "Fuera de servicio", value: String(fleetStatus.outOfService), tone: "text-red-700" },
          ]}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {sectionConfig.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          )
        })}
      </div>

      <Card className="border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <SelectField label="Periodo" value={rangeMode} onChange={(value) => setRangeMode(value as RangeMode)}>
            <option value="last6">Últimos 6 meses</option>
            <option value="last12">Últimos 12 meses</option>
            <option value="last36">Últimos 36 meses</option>
          </SelectField>
          <SelectField label="Establecimiento" value={baseFilter} onChange={setBaseFilter}>
            <option value="todos">Todos</option>
            {baseOptions.map((base) => (
              <option key={base} value={base}>
                {base}
              </option>
            ))}
          </SelectField>
          <SelectField label="Ambulancia" value={ambulanceFilter} onChange={setAmbulanceFilter}>
            <option value="todos">Todas</option>
            {ambulances.map((ambulance) => (
              <option key={ambulance.id} value={ambulance.id}>
                {ambulance.id} · {ambulance.patente}
              </option>
            ))}
          </SelectField>
          {(activeSection === "talleres" || activeSection === "mantenimientos") && (
            <SelectField label="Taller" value={workshopFilter} onChange={setWorkshopFilter}>
              <option value="todos">Todos</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </option>
              ))}
            </SelectField>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setRangeMode("last12")
              setBaseFilter("todos")
              setAmbulanceFilter("todos")
              setWorkshopFilter("todos")
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {activeSection === "kilometraje" && (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard title={`Kilómetros recorridos por la flota (${rangeMonths} meses)`}>
            {fleetKmData.every((row) => row.km === 0) ? (
              <EmptyChart text="Sin datos suficientes para mostrar este gráfico." />
            ) : (
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fleetKmData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => formatNumber(Number(value))} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatKm(Number(value))} labelClassName="font-semibold" />
                    <Line type="monotone" dataKey="km" name="Km recorridos" stroke={MONEY_BLUE} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Ambulancias más utilizadas">
            {kmByAmbulance.length === 0 ? (
              <EmptyChart text="No hay registros en el periodo seleccionado." />
            ) : (
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kmByAmbulance} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(value) => formatNumber(Number(value))} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" width={56} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatKm(Number(value))} />
                    <Bar dataKey="km" name="Km recorridos" fill={MONEY_BLUE} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {activeSection === "presupuesto" && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartCard title="Presupuesto versus gasto mensual">
              {budgetVsExpenseData.every((row) => row.preventiveBudget + row.correctiveBudget + row.preventiveSpent + row.correctiveSpent === 0) ? (
                <EmptyChart text="Presupuesto pendiente de revisión." />
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={budgetVsExpenseData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(value) => `$${formatNumber(Number(value))}`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="preventiveBudget" name="Pres. preventivo" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="preventiveSpent" name="Gasto preventivo" fill={MONEY_BLUE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="correctiveBudget" name="Pres. correctivo" fill="#fed7aa" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="correctiveSpent" name="Gasto correctivo" fill={MONEY_ORANGE} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <Card className="border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-950">Control mensual de presupuesto</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SelectField label="Mes" value={budgetMonth} onChange={(value) => setBudgetMonth(Number(value))}>
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Año" value={budgetYear} onChange={(value) => setBudgetYear(Number(value))}>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-500">
                  Presupuesto preventivo
                  <Input
                    value={formatIntegerInput(preventiveBudgetInput)}
                    onChange={(event) => setPreventiveBudgetInput(parseIntegerInput(event.target.value))}
                    disabled={!isAdmin}
                    className="mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Presupuesto correctivo
                  <Input
                    value={formatIntegerInput(correctiveBudgetInput)}
                    onChange={(event) => setCorrectiveBudgetInput(parseIntegerInput(event.target.value))}
                    disabled={!isAdmin}
                    className="mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Observación
                  <Input value={budgetNotes} onChange={(event) => setBudgetNotes(event.target.value)} disabled={!isAdmin} className="mt-1" />
                </label>
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Gasto preventivo del mes</span>
                    <strong>{formatCurrency(selectedBudgetMonthExpense?.preventive || 0)}</strong>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Gasto correctivo del mes</span>
                    <strong>{formatCurrency(selectedBudgetMonthExpense?.corrective || 0)}</strong>
                  </div>
                </div>
                {isAdmin ? (
                  <Button onClick={saveMonthlyBudget} disabled={isSavingBudget} className="w-full">
                    Guardar presupuesto mensual
                  </Button>
                ) : (
                  <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                    Perfil coordinador: presupuesto disponible solo en lectura.
                  </p>
                )}
              </div>
            </Card>
          </div>

          <ChartCard title="Gasto mensual en mantenimientos">
            {monthlyExpenseData.every((row) => row.total === 0) ? (
              <EmptyChart text="No hay registros en el periodo seleccionado." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyExpenseData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => `$${formatNumber(Number(value))}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="preventive" stackId="a" name="Preventivo" fill={MONEY_BLUE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="corrective" stackId="a" name="Correctivo" fill={MONEY_ORANGE} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="total" name="Total" stroke={MONEY_GREEN} strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {activeSection === "mantenimientos" && (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <ChartCard title="Mantenimientos acumulados por ambulancia">
            {maintenanceByAmbulance.length === 0 ? (
              <EmptyChart text="No hay registros en el periodo seleccionado." />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceByAmbulance} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="preventive" name="Preventivos" fill={MONEY_BLUE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="corrective" name="Correctivos" fill={MONEY_ORANGE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Preventivos versus correctivos">
            <div className="mb-3 flex gap-2">
              <Button variant={splitMode === "cantidad" ? "default" : "outline"} size="sm" onClick={() => setSplitMode("cantidad")}>
                Cantidad
              </Button>
              <Button variant={splitMode === "gasto" ? "default" : "outline"} size="sm" onClick={() => setSplitMode("gasto")}>
                Gasto
              </Button>
            </div>
            {preventiveCorrectiveSplit.length === 0 ? (
              <EmptyChart text="Sin datos suficientes para mostrar este gráfico." />
            ) : (
              <div className="h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={preventiveCorrectiveSplit} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                      {preventiveCorrectiveSplit.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => (splitMode === "gasto" ? formatCurrency(Number(value)) : formatNumber(Number(value)))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {activeSection === "talleres" && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartCard title="Gastos por taller">
            {workshopData.length === 0 ? (
              <EmptyChart text="No hay registros en el periodo seleccionado." />
            ) : (
              <div className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={workshopData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="money" tickFormatter={(value) => `$${formatNumber(Number(value))}`} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="count" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => (String(name).includes("N°") ? formatNumber(Number(value)) : formatCurrency(Number(value)))} />
                    <Legend />
                    <Bar yAxisId="money" dataKey="preventiveCost" name="Preventivo ($)" fill={MONEY_BLUE} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="money" dataKey="correctiveCost" name="Correctivo ($)" fill={MONEY_ORANGE} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="count" type="monotone" dataKey="totalCount" name="N° mantenciones" stroke={MONEY_PURPLE} strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Resumen por taller">
            {workshopData.length === 0 ? (
              <EmptyChart text="No hay registros en el periodo seleccionado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Taller</th>
                      <th className="py-2 pr-3">Mant.</th>
                      <th className="py-2 pr-3">P/C</th>
                      <th className="py-2">Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshopData.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 pr-3 font-medium">{row.name}</td>
                        <td className="py-3 pr-3">{row.totalCount}</td>
                        <td className="py-3 pr-3">
                          {row.preventiveCount}/{row.correctiveCount}
                        </td>
                        <td className="py-3">{formatCurrency(row.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {activeSection === "ambulancia" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white p-4 shadow-sm">
            <SelectField label="Ambulancia individual" value={selectedAmbulanceCode} onChange={setSelectedAmbulanceCode}>
              <option value="">Seleccione una ambulancia</option>
              {ambulances.map((ambulance) => (
                <option key={ambulance.id} value={ambulance.id}>
                  {ambulance.id} · {ambulance.patente}
                </option>
              ))}
            </SelectField>
          </Card>

          {!selectedAmbulance ? (
            <EmptyChart text="Seleccione una ambulancia para ver su evolución individual." />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Estado actual</p>
                  <p className="mt-1 font-semibold">{statusLabel(getEstadoCalculado(selectedAmbulance))}</p>
                </Card>
                <Card className="border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Km desde última mantención</p>
                  <p className="mt-1 font-semibold">{formatKm(getUsoDesdeMantencion(selectedAmbulance))}</p>
                </Card>
                <Card className="border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Avance preventivo</p>
                  <p className="mt-1 font-semibold">{formatPercent(getProgressPercentage(selectedAmbulance))}</p>
                </Card>
                <Card className="border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Última alerta</p>
                  <p className="mt-1 font-semibold">{getAlertaPreventiva(selectedAmbulance).replace(/_/g, " ")}</p>
                </Card>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title={`Evolución mensual de kilometraje · ${selectedAmbulance.id}`}>
                  {individualKmData.every((row) => row.km === 0) ? (
                    <EmptyChart text="Sin datos suficientes para mostrar este gráfico." />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={individualKmData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(value) => formatNumber(Number(value))} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => formatKm(Number(value))} />
                          <Line type="monotone" dataKey="km" name="Km recorridos" stroke={MONEY_BLUE} strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartCard>
                <ChartCard title={`Gasto mensual · ${selectedAmbulance.id}`}>
                  {individualExpenseData.every((row) => row.total === 0) ? (
                    <EmptyChart text="Sin gastos registrados para esta ambulancia en el periodo seleccionado." />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={individualExpenseData} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(value) => `$${formatNumber(Number(value))}`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="preventive" name="Preventivo" fill={MONEY_BLUE} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="corrective" name="Correctivo" fill={MONEY_ORANGE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartCard>
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard title="Últimos mantenimientos finalizados">
          {latestMaintenances.length === 0 ? (
            <EmptyChart text="No hay mantenimientos finalizados para mostrar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Ambulancia</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Taller</th>
                    <th className="py-2 pr-3">Costo</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {latestMaintenances.map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">{parseDate(getMaintenanceDate(record))?.toLocaleDateString("es-CL") || "Sin fecha"}</td>
                      <td className="py-3 pr-3 font-medium">{record.ambulance_code}</td>
                      <td className="py-3 pr-3 capitalize">{record.maintenance_type}</td>
                      <td className="py-3 pr-3">{record.workshop_name || "Sin taller"}</td>
                      <td className="py-3 pr-3">{formatCurrency(getMaintenanceCost(record))}</td>
                      <td className="py-3">
                        <Badge className="border-green-200 bg-green-50 text-green-700">{record.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Unidades críticas">
          {criticalUnits.length === 0 ? (
            <EmptyChart text="No hay unidades críticas en este momento." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Ambulancia</th>
                    <th className="py-2 pr-3">Motivo</th>
                    <th className="py-2 pr-3">Km mant.</th>
                    <th className="py-2">Gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalUnits.map((row) => (
                    <tr key={row.ambulance.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">{row.ambulance.id}</td>
                      <td className="py-3 pr-3">
                        <Badge className={badgeClassForStatus(row.reasons[0].toLowerCase())}>{row.reasons[0]}</Badge>
                      </td>
                      <td className="py-3 pr-3">{formatKm(getUsoDesdeMantencion(row.ambulance))}</td>
                      <td className="py-3">{formatCurrency(row.spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
