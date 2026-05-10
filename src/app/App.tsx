import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { SimplifiedDashboard } from "./components/SimplifiedDashboard"
import { FleetTab } from "./components/FleetTab"
import { FuelTab } from "./components/FuelTab"
import { QRFormsTab } from "./components/QRFormsTab"
import { AlertsTab } from "./components/AlertsTab"
import { ReportsTab } from "./components/ReportsTab"
import { LoginPage } from "./components/LoginPage"
import { Button } from "./components/ui/button"
import { useAmbulances } from "./AmbulanceContext"
import { useAuth, type LoggedUser } from "./AuthContext"
import {
  Ambulance,
  BarChart3,
  Bell,
  ChevronDown,
  FileText,
  Gauge,
  Home,
  LogOut,
  Users,
  X,
} from "lucide-react"

type TabType =
  | "inicio"
  | "ambulancias"
  | "kilometraje"
  | "usuarios"
  | "formularios"
  | "estadisticas"

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  priority: "alta" | "media"
  badgeLabel: string
  badgeClass: string
  read: boolean
}

export default function App() {
  const { currentUser, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm font-inter text-gray-600">Cargando sesión...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  return <DashboardApp currentUser={currentUser} logout={logout} />
}

function DashboardApp({
  currentUser,
  logout,
}: {
  currentUser: LoggedUser
  logout: () => void
}) {
  const [activeTab, setActiveTab] = useState<TabType>("inicio")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const registeredNotificationIds = useRef<Set<string>>(new Set())

  const {
    ambulances,
    getUsoDesdeMantencion,
    getKmFaltantes,
    getEstadoCalculado,
    getAlertaPreventiva,
    formatKm,
    statusConfig,
    preventiveAlertConfig,
  } = useAmbulances()

  const userInitials = currentUser.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const currentNotifications = useMemo<NotificationItem[]>(() => {
    const result: NotificationItem[] = []

    ambulances.forEach((ambulance) => {
      const estadoOperativo = getEstadoCalculado(ambulance)
      const alertaPreventiva = getAlertaPreventiva(ambulance)
      const uso = getUsoDesdeMantencion(ambulance)
      const faltantes = getKmFaltantes(ambulance)

      if (estadoOperativo === "mantencion_preventiva") {
        result.push({
          id: `${ambulance.id}-estado-preventiva-${ambulance.lastUpdate}`,
          title: `Unidad en mantenimiento preventivo · ${ambulance.id}`,
          description: `${ambulance.patente} se encuentra registrada en mantenimiento preventivo.`,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority: "media",
          badgeLabel: statusConfig[estadoOperativo].shortLabel,
          badgeClass: statusConfig[estadoOperativo].badgeClass,
          read: false,
        })
      }

      if (estadoOperativo === "mantencion_correctiva") {
        result.push({
          id: `${ambulance.id}-estado-correctiva-${ambulance.lastUpdate}`,
          title: `Unidad en mantenimiento correctivo · ${ambulance.id}`,
          description: `${ambulance.patente} se encuentra asociada a una mantención correctiva o incidencia operativa.`,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority: "alta",
          badgeLabel: statusConfig[estadoOperativo].shortLabel,
          badgeClass: statusConfig[estadoOperativo].badgeClass,
          read: false,
        })
      }

      if (estadoOperativo === "fuera_servicio") {
        result.push({
          id: `${ambulance.id}-estado-fuera-servicio-${ambulance.lastUpdate}`,
          title: `Unidad fuera de servicio · ${ambulance.id}`,
          description: `${ambulance.patente} no se encuentra disponible para operación.`,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority: "alta",
          badgeLabel: statusConfig[estadoOperativo].shortLabel,
          badgeClass: statusConfig[estadoOperativo].badgeClass,
          read: false,
        })
      }

      if (alertaPreventiva === "mantencion_preventiva_requerida") {
        result.push({
          id: `${ambulance.id}-alerta-preventiva-${ambulance.lastUpdate}-${uso}`,
          title: `Mantención preventiva requerida · ${ambulance.id}`,
          description: `${ambulance.patente} superó la pauta preventiva configurada. Uso desde última mantención: ${formatKm(
            uso
          )}.`,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority: "alta",
          badgeLabel: preventiveAlertConfig[alertaPreventiva].shortLabel,
          badgeClass: preventiveAlertConfig[alertaPreventiva].badgeClass,
          read: false,
        })
      }

      if (alertaPreventiva === "proxima_mantencion") {
        result.push({
          id: `${ambulance.id}-alerta-proxima-${ambulance.lastUpdate}-${faltantes}`,
          title: `Próxima a mantención · ${ambulance.id}`,
          description: `${ambulance.patente} está próxima a cumplir la pauta preventiva. Faltan ${formatKm(
            faltantes
          )}.`,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority: "media",
          badgeLabel: preventiveAlertConfig[alertaPreventiva].shortLabel,
          badgeClass: preventiveAlertConfig[alertaPreventiva].badgeClass,
          read: false,
        })
      }
    })

    return result
  }, [
    ambulances,
    formatKm,
    getAlertaPreventiva,
    getEstadoCalculado,
    getKmFaltantes,
    getUsoDesdeMantencion,
    preventiveAlertConfig,
    statusConfig,
  ])

  useEffect(() => {
    const newNotifications = currentNotifications.filter((notification) => {
      return !registeredNotificationIds.current.has(notification.id)
    })

    if (newNotifications.length === 0) return

    newNotifications.forEach((notification) => {
      registeredNotificationIds.current.add(notification.id)
    })

    setNotifications((prev) => [...newNotifications, ...prev])
  }, [currentNotifications])

  useEffect(() => {
    if (!isProfileOpen) return

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    )
  }, [isProfileOpen])

  const unreadNotifications = notifications.filter((notification) => !notification.read)
  const hasUnreadNotifications = unreadNotifications.length > 0
  const visibleNotifications = notifications.slice(0, 10)

  const tabs: {
    id: TabType
    label: string
    icon: ReactNode
  }[] = [
    { id: "inicio", label: "Inicio", icon: <Home className="w-4 h-4" /> },
    { id: "ambulancias", label: "Ambulancias", icon: <Ambulance className="w-4 h-4" /> },
    { id: "kilometraje", label: "Kilometraje", icon: <Gauge className="w-4 h-4" /> },
    { id: "usuarios", label: "Usuarios", icon: <Users className="w-4 h-4" /> },
    { id: "formularios", label: "Formularios", icon: <FileText className="w-4 h-4" /> },
    { id: "estadisticas", label: "Estadísticas", icon: <BarChart3 className="w-4 h-4" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "ambulancias":
        return <FleetTab />
      case "kilometraje":
        return <FuelTab />
      case "usuarios":
        return <AlertsTab />
      case "formularios":
        return <QRFormsTab />
      case "estadisticas":
        return <ReportsTab />
      default:
        return <SimplifiedDashboard />
    }
  }

  const getTabClassName = (tab: TabType) => {
    return `flex items-center gap-2 text-sm font-inter transition-colors pb-4 ${
      activeTab === tab
        ? "text-red-600 border-b-2 border-red-600"
        : "text-gray-500 hover:text-gray-700"
    }`
  }

  const getNotificationCardClass = (priority: "alta" | "media") => {
    return priority === "alta"
      ? "border-red-200 bg-red-50"
      : "border-amber-200 bg-amber-50"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 relative z-30">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Ambulance className="w-7 h-7 text-red-600" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-inter font-bold text-gray-900">
                  Gestión de Mantenimiento Preventivo SAMU - SSVQ
                </h1>
                <p className="text-sm font-inter text-gray-600">
                  Sistema de gestión para control de ambulancias, kilometraje,
                  usuarios, formularios y estadísticas operativas.
                </p>
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-sm font-inter font-bold text-red-700">
                    {userInitials}
                  </div>

                  {hasUnreadNotifications && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                    </span>
                  )}
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-inter font-semibold text-gray-900 leading-5">
                    {currentUser.name}
                  </p>
                  <p className="text-xs font-inter text-gray-500 leading-4">
                    {currentUser.role}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-inter font-bold text-gray-900">
                      Perfil y notificaciones
                    </h3>

                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-xl font-inter font-bold text-red-700 shrink-0">
                        {userInitials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-inter font-bold text-gray-900">
                          {currentUser.name}
                        </p>

                        <p className="text-sm font-inter text-gray-600 break-all">
                          {currentUser.email || "Sin correo registrado"}
                        </p>

                        <p className="text-xs font-inter text-gray-500 mt-1">
                          Nickname: {currentUser.username}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-inter font-medium text-blue-700">
                            Rol: {currentUser.role}
                          </span>

                          <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-inter font-medium text-green-700">
                            Estado: {currentUser.status}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full mt-4 font-inter"
                          onClick={logout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar sesión
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <h4 className="text-base font-inter font-bold text-gray-900">
                          Notificaciones de precaución
                        </h4>
                      </div>

                      <span className="text-xs font-inter text-gray-500">
                        Últimas 10
                      </span>
                    </div>

                    {visibleNotifications.length > 0 ? (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {visibleNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-xl border p-4 ${getNotificationCardClass(
                              notification.priority
                            )}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-inter font-semibold text-gray-900">
                                    {notification.title}
                                  </p>

                                  {!notification.read && (
                                    <span className="rounded-full bg-red-600 text-white text-[10px] font-inter font-bold px-2 py-0.5">
                                      Nueva
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm font-inter text-gray-700 mt-1">
                                  {notification.description}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 inline-flex items-center rounded-full px-2 py-1 text-[11px] font-inter font-medium ${
                                  notification.priority === "alta"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-amber-100 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {notification.priority === "alta" ? "Alta" : "Media"}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs font-inter text-gray-500">
                                {notification.time}
                              </span>

                              <span
                                className={`text-xs font-inter font-medium ${notification.badgeClass} rounded-full px-2 py-1 border`}
                              >
                                {notification.badgeLabel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-inter text-gray-500">
                        No hay notificaciones de precaución registradas.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="px-6 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabClassName(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main>{renderContent()}</main>

      <footer className="px-6 py-4 bg-white border-t border-gray-200 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs font-inter text-gray-500">
          <p>© 2026 Sistema de Gestión de Mantenimiento Preventivo SAMU - SSVQ.</p>
          <p>
            Última actualización de sesión:{" "}
            {new Date().toLocaleTimeString("es-CL")}
          </p>
        </div>
      </footer>
    </div>
  )
}