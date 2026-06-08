import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BarChart3,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  Gauge,
  RefreshCw,
  Users,
  Wrench
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { supabase } from "../../lib/supabaseClient";
import { useAmbulances } from "../AmbulanceContext";
import { useAuth } from "../AuthContext";

type TabType =
  | "inicio"
  | "ambulancias"
  | "kilometraje"
  | "mapa_operativo"
  | "mantenimientos"
  | "usuarios"
  | "estadisticas"
  | "formularios";

type MaintenanceRequestType = "preventiva" | "correctiva";
type MaintenanceStatus = "programada" | "en_taller" | "esperando_repuesto" | "finalizada" | "cancelada";

interface SimplifiedDashboardProps {
  onRequestMaintenance?: (ambulanceCode: string, type: MaintenanceRequestType) => void;
  onNavigate?: (tab: TabType) => void;
}

interface MaintenanceSummary {
  id: string;
  ambulance_code: string;
  maintenance_type: MaintenanceRequestType;
  reason?: string | null;
  source?: string | null;
  status: MaintenanceStatus;
  estimated_cost?: number | null;
  final_cost?: number | null;
  created_at?: string | null;
  finished_at?: string | null;
  archived_at?: string | null;
}

interface FormSummary {
  id: string;
  ambulance_code: string;
  ambulance_patente?: string | null;
  registered_by_name?: string | null;
  form_date?: string | null;
  created_at?: string | null;
  damage_reports?: unknown;
  status?: string | null;
}

interface PendingDamage {
  id: string;
  kind: "bitacora" | "siniestro";
  formId: string;
  maintenanceId?: string;
  damageIndex: number;
  ambulanceCode: string;
  patent: string;
  area: string;
  severity: string;
  date: string;
  driver: string;
  status: string;
  description: string;
  raw: Record<string, unknown>;
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  type: "form" | "maintenance" | "damage";
}

const activeMaintenanceStatuses: MaintenanceStatus[] = ["programada", "en_taller", "esperando_repuesto"];

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatKm(value?: number | null) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${new Intl.NumberFormat("es-CL").format(safeValue)} km`;
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  return value.trim();
}

function normalizeDamageReports(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function getDamageStatus(item: Record<string, unknown>) {
  return normalizeText(item.status ?? item.estado, "Pendiente");
}

function getStatusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("operativa") || lower.includes("finalizada")) return "bg-green-50 text-green-700 border-green-200";
  if (lower.includes("taller") || lower.includes("programada")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (lower.includes("repuesto") || lower.includes("preventiva") || lower.includes("requerida")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (lower.includes("fuera") || lower.includes("correctiva") || lower.includes("pendiente")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function maintenanceLabel(status: MaintenanceStatus) {
  const labels: Record<MaintenanceStatus, string> = {
    programada: "Programada",
    en_taller: "En taller",
    esperando_repuesto: "Esperando repuesto",
    finalizada: "Finalizada",
    cancelada: "Cancelada"
  };
  return labels[status] ?? status;
}

function typeLabel(type: MaintenanceRequestType) {
  return type === "preventiva" ? "Preventiva" : "Correctiva";
}

function ambulanceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    operativa: "Operativa",
    proxima_mantencion: "Próxima a mantención",
    mantencion_preventiva: "Mantención preventiva",
    mantencion_correctiva: "Mantención correctiva",
    fuera_servicio: "Fuera de servicio"
  };
  return labels[status] ?? "Sin estado";
}

export function SimplifiedDashboard({ onRequestMaintenance, onNavigate }: SimplifiedDashboardProps) {
  const { ambulances, getAlertaPreventiva, getUsoDesdeMantencion } = useAmbulances();
  const { currentUser } = useAuth();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceSummary[]>([]);
  const [isLoadingPanel, setIsLoadingPanel] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<PendingDamage | null>(null);

  const isAdmin = currentUser?.role === "Administrador";
  const isCoordinator = currentUser?.role === "Coordinador";
  const isDriver = currentUser?.role === "Chofer";

  const loadPanelData = async () => {
    setIsLoadingPanel(true);
    try {
      const [formsResult, maintenanceResult] = await Promise.all([
        supabase
          .from("shift_route_forms")
          .select("id, ambulance_code, ambulance_patente, registered_by_name, form_date, created_at, damage_reports, status")
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("maintenance_records")
          .select("id, ambulance_code, maintenance_type, reason, source, status, estimated_cost, final_cost, created_at, finished_at, archived_at")
          .order("created_at", { ascending: false })
          .limit(80)
      ]);

      if (formsResult.error) {
        console.warn("No se pudieron cargar formularios para inicio:", formsResult.error.message);
        setForms([]);
      } else {
        setForms((formsResult.data ?? []) as FormSummary[]);
      }

      if (maintenanceResult.error) {
        console.warn("No se pudieron cargar mantenimientos para inicio:", maintenanceResult.error.message);
        setMaintenances([]);
      } else {
        setMaintenances((maintenanceResult.data ?? []) as MaintenanceSummary[]);
      }
    } finally {
      setIsLoadingPanel(false);
    }
  };

  useEffect(() => {
    loadPanelData();
  }, []);

  const activeMaintenanceByCode = useMemo(() => {
    const map = new Map<string, MaintenanceSummary>();
    maintenances
      .filter((record) => !record.archived_at && activeMaintenanceStatuses.includes(record.status))
      .forEach((record) => {
        if (!map.has(record.ambulance_code)) map.set(record.ambulance_code, record);
      });
    return map;
  }, [maintenances]);

  const maintenanceStats = useMemo(() => {
    const inMaintenanceCodes = new Set(activeMaintenanceByCode.keys());
    ambulances.forEach((ambulance) => {
      if (ambulance.status === "mantencion_preventiva" || ambulance.status === "mantencion_correctiva") {
        inMaintenanceCodes.add(ambulance.id);
      }
    });

    return {
      operational: ambulances.filter((ambulance) => ambulance.status === "operativa" && !inMaintenanceCodes.has(ambulance.id)).length,
      inMaintenance: inMaintenanceCodes.size,
      outOfService: ambulances.filter((ambulance) => ambulance.status === "fuera_servicio").length,
      upcomingMaintenance: ambulances.filter((ambulance) => getAlertaPreventiva(ambulance) === "proxima_mantencion").length
    };
  }, [activeMaintenanceByCode, ambulances, getAlertaPreventiva]);

  const maintenanceCountByCode = useMemo(() => {
    const map = new Map<string, { total: number; preventiva: number; correctiva: number }>();
    maintenances.forEach((record) => {
      const current = map.get(record.ambulance_code) ?? { total: 0, preventiva: 0, correctiva: 0 };
      current.total += 1;
      current[record.maintenance_type] += 1;
      map.set(record.ambulance_code, current);
    });
    return map;
  }, [maintenances]);

  const pendingDamages = useMemo(() => {
    const formDamages = forms.flatMap((form) => {
      return normalizeDamageReports(form.damage_reports)
        .map((damage, index): PendingDamage => {
          const status = getDamageStatus(damage);
          const date = form.form_date ?? form.created_at ?? "";
          return {
            id: `${form.id}-${index}`,
            kind: "bitacora",
            formId: form.id,
            damageIndex: index,
            ambulanceCode: normalizeText(form.ambulance_code, "Sin móvil"),
            patent: normalizeText(form.ambulance_patente, "Sin patente"),
            area: normalizeText(damage.affected_area ?? damage.area ?? damage.sector, "Sin área"),
            severity: normalizeText(damage.severity ?? damage.gravedad ?? damage.damage_type, "Sin gravedad"),
            date,
            driver: normalizeText(form.registered_by_name, "Sin conductor"),
            status,
            description: normalizeText(damage.description ?? damage.observations ?? damage.observacion, "Sin observación"),
            raw: damage
          };
        })
        .filter((damage) => damage.status.toLowerCase() === "pendiente");
    });

    const incidentDamages = maintenances
      .filter((record) => {
        const source = (record.source || "").toLowerCase();
        return (
          source === "siniestro" &&
          !record.archived_at &&
          !["finalizada", "cancelada"].includes(record.status)
        );
      })
      .map((record): PendingDamage => {
        const ambulance = ambulances.find((item) => item.id === record.ambulance_code);
        return {
          id: `siniestro-${record.id}`,
          kind: "siniestro",
          formId: "",
          maintenanceId: record.id,
          damageIndex: 0,
          ambulanceCode: record.ambulance_code,
          patent: ambulance?.patente || "Sin patente",
          area: "Siniestro / colisión",
          severity: "Grave",
          date: record.created_at ?? "",
          driver: "Reporte de siniestro",
          status: "Pendiente",
          description: record.reason || "Siniestro reportado para mantenimiento correctivo.",
          raw: record as unknown as Record<string, unknown>
        };
      });

    return [...incidentDamages, ...formDamages];
  }, [ambulances, forms, maintenances]);

  const todaysForms = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return forms.filter((form) => (form.form_date ?? form.created_at ?? "").slice(0, 10) === today).length;
  }, [forms]);

  const criticalUnits = useMemo(() => {
    return ambulances
      .map((ambulance) => {
        const activeMaintenance = activeMaintenanceByCode.get(ambulance.id);
        const pendingDamageCount = pendingDamages.filter((damage) => damage.ambulanceCode === ambulance.id).length;
        const counters = maintenanceCountByCode.get(ambulance.id) ?? { total: 0, preventiva: 0, correctiva: 0 };
        const preventiveAlert = getAlertaPreventiva(ambulance);
        const reasons: string[] = [];

        if (activeMaintenance) {
          reasons.push(`Mantención ${maintenanceLabel(activeMaintenance.status).toLowerCase()}`);
        }
        if (ambulance.status === "mantencion_preventiva") reasons.push("Mantención preventiva");
        if (ambulance.status === "mantencion_correctiva") reasons.push("Mantención correctiva");
        if (ambulance.status === "fuera_servicio") reasons.push("Fuera de servicio");
        if (preventiveAlert === "mantencion_preventiva_requerida") reasons.push("Supera pauta preventiva");
        if (preventiveAlert === "proxima_mantencion") reasons.push("Próxima a mantención");
        if (pendingDamageCount > 0) reasons.push(`${pendingDamageCount} daño${pendingDamageCount === 1 ? "" : "s"} pendiente${pendingDamageCount === 1 ? "" : "s"}`);

        return {
          ambulance,
          activeMaintenance,
          counters,
          reasons,
          pendingDamageCount
        };
      })
      .filter((item) => item.reasons.length > 0)
      .sort((a, b) => {
        const priorityA = getAlertaPreventiva(a.ambulance) === "mantencion_preventiva_requerida" ? 0 : a.activeMaintenance ? 1 : 2;
        const priorityB = getAlertaPreventiva(b.ambulance) === "mantencion_preventiva_requerida" ? 0 : b.activeMaintenance ? 1 : 2;
        return priorityA - priorityB || b.pendingDamageCount - a.pendingDamageCount;
      })
      .slice(0, 6);
  }, [activeMaintenanceByCode, ambulances, getAlertaPreventiva, maintenanceCountByCode, pendingDamages]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const formActivity: ActivityItem[] = forms.slice(0, 12).map((form) => {
      const damages = normalizeDamageReports(form.damage_reports).length;
      return {
        id: `form-${form.id}`,
        title: `Formulario ${form.ambulance_code}`,
        detail: damages > 0 ? `${damages} daño${damages === 1 ? "" : "s"} reportado${damages === 1 ? "" : "s"}` : "Formulario recibido sin daños reportados",
        date: form.created_at ?? form.form_date ?? "",
        type: damages > 0 ? "damage" : "form"
      };
    });

    const maintenanceActivity: ActivityItem[] = maintenances.slice(0, 12).map((record) => ({
      id: `maintenance-${record.id}`,
      title: `${typeLabel(record.maintenance_type)} ${record.ambulance_code}`,
      detail: maintenanceLabel(record.status),
      date: record.finished_at ?? record.created_at ?? "",
      type: "maintenance"
    }));

    return [...formActivity, ...maintenanceActivity]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [forms, maintenances]);

  const lastUpdate = useMemo(() => {
    const dates = [...forms.map((form) => form.created_at), ...maintenances.map((record) => record.created_at)]
      .filter((date): date is string => Boolean(date))
      .map((date) => new Date(date).getTime())
      .filter((date) => !Number.isNaN(date));

    if (dates.length === 0) return "Sin actividad reciente";
    return `Actualizado ${formatDate(new Date(Math.max(...dates)).toISOString())}`;
  }, [forms, maintenances]);

  const updateDamageStatus = async (damage: PendingDamage, nextStatus: string) => {
    if (!isAdmin) return;
    if (damage.kind === "siniestro" && damage.maintenanceId) {
      const nextMaintenanceStatus =
        nextStatus === "Descartado" ? "cancelada" : "en_taller";
      const payload: Record<string, string> = {
        status: nextMaintenanceStatus,
        notes:
          nextStatus === "Descartado"
            ? "Siniestro descartado desde Inicio."
            : "Siniestro revisado desde Inicio y enviado a taller.",
      };

      if (nextMaintenanceStatus === "en_taller") {
        payload.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("maintenance_records")
        .update(payload)
        .eq("id", damage.maintenanceId);

      if (error) {
        alert(`No se pudo actualizar el siniestro: ${error.message}`);
        return;
      }

      setSelectedDamage(null);
      await loadPanelData();
      return;
    }

    const form = forms.find((item) => item.id === damage.formId);
    if (!form) return;

    const reports = normalizeDamageReports(form.damage_reports);
    const target = reports[damage.damageIndex];
    if (!target) return;

    const nextReports = reports.map((item, index) => {
      if (index !== damage.damageIndex) return item;
      return {
        ...item,
        status: nextStatus,
        estado: nextStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUser?.name ?? currentUser?.nickname ?? "Sistema"
      };
    });

    const { error } = await supabase
      .from("shift_route_forms")
      .update({ damage_reports: nextReports })
      .eq("id", damage.formId);

    if (error) {
      alert(`No se pudo actualizar el daño: ${error.message}`);
      return;
    }

    setSelectedDamage(null);
    await loadPanelData();

    if (nextStatus === "Enviado a mantenimiento") {
      onRequestMaintenance?.(damage.ambulanceCode, "correctiva");
    }
  };

  if (isDriver) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-semibold">Formularios de turno</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tu acceso está concentrado en completar y revisar formularios operativos.
            </p>
            <Button className="mt-4" onClick={() => onNavigate?.("formularios")}>
              Ir a formularios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Flota total",
      value: ambulances.length,
      helper: "Ambulancias activas en sistema",
      icon: Ambulance,
      className: "text-blue-700 bg-blue-50 border-blue-200"
    },
    {
      label: "Operativas",
      value: maintenanceStats.operational,
      helper: "Disponibles para servicio",
      icon: CheckCircle,
      className: "text-green-700 bg-green-50 border-green-200"
    },
    {
      label: "En mantención",
      value: maintenanceStats.inMaintenance,
      helper: "Preventiva o correctiva",
      icon: Wrench,
      className: "text-blue-700 bg-blue-50 border-blue-200"
    },
    {
      label: "Fuera de servicio",
      value: maintenanceStats.outOfService,
      helper: "No disponibles",
      icon: AlertTriangle,
      className: "text-red-700 bg-red-50 border-red-200"
    },
    {
      label: "Próximas",
      value: maintenanceStats.upcomingMaintenance,
      helper: "Cercanas a pauta",
      icon: Gauge,
      className: "text-amber-700 bg-amber-50 border-amber-200"
    },
    {
      label: "Daños pendientes",
      value: pendingDamages.length,
      helper: "Reportados en formularios",
      icon: ClipboardList,
      className: "text-red-700 bg-red-50 border-red-200"
    },
    {
      label: "Formularios hoy",
      value: todaysForms,
      helper: "Recibidos durante el día",
      icon: FileText,
      className: "text-slate-700 bg-slate-50 border-slate-200"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Panel de control de ambulancias</h1>
          <p className="mt-1 text-sm text-slate-600">
            Resumen operativo actualizado de la flota.
          </p>
          <p className="mt-1 text-xs text-slate-500">{lastUpdate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadPanelData} disabled={isLoadingPanel}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPanel ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => onNavigate?.("mantenimientos")}>
              <Wrench className="mr-2 h-4 w-4" />
              Ir a mantenciones
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`border ${card.className}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  </div>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs opacity-80">{card.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Unidades críticas
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.("ambulancias")}>
                <Eye className="mr-2 h-4 w-4" />
                Ver flota
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {criticalUnits.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
                No hay ambulancias con alertas, mantenciones activas o daños pendientes.
              </div>
            ) : (
              <div className="space-y-3">
                {criticalUnits.map(({ ambulance, activeMaintenance, counters, reasons }) => (
                  <div key={ambulance.id} className="rounded-md border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{ambulance.id}</h3>
                          <Badge variant="outline" className={getStatusBadge(activeMaintenance ? activeMaintenance.status : ambulance.status)}>
                            {activeMaintenance ? maintenanceLabel(activeMaintenance.status) : ambulanceStatusLabel(ambulance.status)}
                          </Badge>
                          <span className="text-xs text-slate-500">{ambulance.patente}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{reasons.join(" · ")}</p>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                          <span>Km total: {formatKm(ambulance.kilometrajeActual)}</span>
                          <span>Uso mantención: {formatKm(getUsoDesdeMantencion(ambulance))}</span>
                          <span>
                            Historial: {counters.total} ({counters.preventiva} P / {counters.correctiva} C)
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => onNavigate?.("ambulancias")}>
                          Detalle
                        </Button>
                        {activeMaintenance && (
                          <Button variant="outline" size="sm" onClick={() => onNavigate?.("mantenimientos")}>
                            Mantención
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-600" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
                No hay actividad reciente registrada.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-md bg-slate-100 p-2 text-slate-600">
                        {item.type === "maintenance" ? (
                          <Wrench className="h-4 w-4" />
                        ) : item.type === "damage" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-950">{item.title}</p>
                        <p className="text-xs text-slate-600">{item.detail}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    {index < recentActivity.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-red-600" />
                Daños pendientes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.("formularios")}>
                Ver formularios
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingDamages.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
                No hay daños pendientes por revisar.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDamages.slice(0, 6).map((damage) => (
                  <div key={damage.id} className="rounded-md border p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-950">{damage.ambulanceCode}</span>
                          <Badge variant="outline" className={getStatusBadge(damage.status)}>
                            {damage.status}
                          </Badge>
                          <span className="text-xs text-slate-500">{formatDate(damage.date)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {damage.patent} · {damage.area} · {damage.severity}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{damage.description}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDamage(damage)}>
                        Revisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-slate-700" />
              Accesos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("ambulancias")}>
                <Ambulance className="mr-2 h-4 w-4" />
                Flota
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("mantenimientos")}>
                <Wrench className="mr-2 h-4 w-4" />
                Mantenciones
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("formularios")}>
                <FileText className="mr-2 h-4 w-4" />
                Formularios
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("kilometraje")}>
                <Gauge className="mr-2 h-4 w-4" />
                Kilometraje
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("estadisticas")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Estadísticas
              </Button>
              {isAdmin && (
                <Button variant="outline" className="justify-start" onClick={() => onNavigate?.("usuarios")}>
                  <Users className="mr-2 h-4 w-4" />
                  Usuarios
                </Button>
              )}
            </div>
            {isCoordinator && (
              <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                Perfil coordinador: visualización operativa sin edición de ambulancias ni mantenciones.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedDamage)} onOpenChange={(open) => !open && setSelectedDamage(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Revisión de daño reportado</DialogTitle>
          </DialogHeader>
          {selectedDamage && (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-md border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Móvil</p>
                  <p className="font-medium">{selectedDamage.ambulanceCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Patente</p>
                  <p className="font-medium">{selectedDamage.patent}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Conductor</p>
                  <p className="font-medium">{selectedDamage.driver}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-medium">{formatDate(selectedDamage.date)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Detalle</p>
                <div className="rounded-md border p-3 text-sm text-slate-700">
                  <p>
                    <span className="font-medium">Área:</span> {selectedDamage.area}
                  </p>
                  <p>
                    <span className="font-medium">Gravedad:</span> {selectedDamage.severity}
                  </p>
                  <p className="mt-2">{selectedDamage.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setSelectedDamage(null)}>
                  Cerrar
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="outline" onClick={() => updateDamageStatus(selectedDamage, "Revisado")}>
                      Marcar revisado
                    </Button>
                    <Button variant="outline" onClick={() => updateDamageStatus(selectedDamage, "Descartado")}>
                      Descartar
                    </Button>
                    <Button onClick={() => updateDamageStatus(selectedDamage, "Enviado a mantenimiento")}>
                      Llevar a mantención
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
