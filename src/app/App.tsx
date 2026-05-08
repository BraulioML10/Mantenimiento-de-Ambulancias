import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { SimplifiedDashboard } from "./components/SimplifiedDashboard"
import { FleetTab } from "./components/FleetTab"
import { FuelTab } from "./components/FuelTab"
import { QRFormsTab } from "./components/QRFormsTab"
import { RoutesTab } from "./components/RoutesTab"
import { AlertsTab } from "./components/AlertsTab"
import { ReportsTab } from "./components/ReportsTab"
import { useAmbulances, type AmbulanceStatus } from "./AmbulanceContext"
import {
  Ambulance,
  Bell,
  ChevronDown,
  FileText,
  Gauge,
  Home,
  QrCode,
  Users,
  Wrench,
  X,
} from "lucide-react"

type TabType =
  | "inicio"
  | "ambulancias"
  | "kilometraje"
  | "mantenimientos"
  | "usuarios"
  | "reportes"
  | "qr"

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  priority: "alta" | "media"
  status: AmbulanceStatus
  read: boolean
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const registeredNotificationIds = useRef<Set<string>>(new Set())

  const {
    ambulances,
    getEstadoCalculado,
    getUsoDesdeMantencion,
    getKmFaltantes,
    formatKm,
    statusConfig,
  } = useAmbulances()

  const currentUser = {
    name: "Administrador SAMU",
    email: "admin.samu@ssvq.cl",
    role: "Administrador",
    status: "Activo",
    initials: "AS",
  }

  const currentAlarmNotifications = useMemo<NotificationItem[]>(() => {
    return ambulances
      .map((ambulance) => {
        const status = getEstadoCalculado(ambulance)

        if (
          status !== "mantencion_preventiva" &&
          status !== "mantencion_correctiva" &&
          status !== "fuera_servicio" &&
          status !== "proxima_mantencion"
        ) {
          return null
        }

        const uso = getUsoDesdeMantencion(ambulance)
        const faltantes = getKmFaltantes(ambulance)

        let title = ""
        let description = ""
        let priority: "alta" | "media" = "media"

        if (status === "mantencion_preventiva") {
          title = `Mantención preventiva requerida · ${ambulance.id}`
          description = `${ambulance.patente} superó la pauta preventiva configurada. Uso acumulado: ${formatKm(
            uso
          )}.`
          priority = "alta"
        }

        if (status === "mantencion_correctiva") {
          title = `Mantención correctiva reportada · ${ambulance.id}`
          description = `${ambulance.patente} presenta estado correctivo y requiere seguimiento.`
          priority = "alta"
        }

        if (status === "fuera_servicio") {
          title = `Unidad fuera de servicio · ${ambulance.id}`
          description = `${ambulance.patente} no se encuentra disponible para operación.`
          priority = "alta"
        }

        if (status === "proxima_mantencion") {
          title = `Próxima a mantención · ${ambulance.id}`
          description = `${ambulance.patente} está próxima a cumplir la pauta preventiva. Faltan ${formatKm(
            faltantes
          )}.`
          priority = "media"
        }

        return {
          id: `${ambulance.id}-${status}-${ambulance.lastUpdate}-${uso}-${faltantes}`,
          title,
          description,
          time: ambulance.lastUpdate ? `${ambulance.lastUpdate} hrs` : "Sin registro",
          priority,
          status,
          read: false,
        }
      })
      .filter((item): item is NotificationItem => item !== null)
  }, [
    ambulances,
    formatKm,
    getEstadoCalculado,
    getKmFaltantes,
    getUsoDesdeMantencion,
  ])

  useEffect(() => {
    const newNotifications = currentAlarmNotifications.filter((notification) => {
      return !registeredNotificationIds.current.has(notification.id)
    })

    if (newNotifications.length === 0) return

    newNotifications.forEach((notification) => {
      registeredNotificationIds.current.add(notification.id)
    })

    setNotifications((prev) => [...newNotifications, ...prev])
  }, [currentAlarmNotifications])

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
    { id: "mantenimientos", label: "Mantenimientos", icon: <Wrench className="w-4 h-4" /> },
    { id: "usuarios", label: "Usuarios", icon: <Users className="w-4 h-4" /> },
    { id: "reportes", label: "Reportes", icon: <FileText className="w-4 h-4" /> },
    { id: "qr", label: "QR / Formularios", icon: <QrCode className="w-4 h-4" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "ambulancias":
        return <FleetTab />
      case "kilometraje":
        return <FuelTab />
      case "mantenimientos":
        return <RoutesTab />
      case "usuarios":
        return <AlertsTab />
      case "reportes":
        return <ReportsTab />
      case "qr":
        return <QRFormsTab />
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
                  Prototipo funcional con datos simulados para control de kilometraje, mantenciones, usuarios y registros QR.
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
                    {currentUser.initials}
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
                        {currentUser.initials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-inter font-bold text-gray-900">
                          {currentUser.name}
                        </p>

                        <p className="text-sm font-inter text-gray-600 break-all">
                          {currentUser.email}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-inter font-medium text-blue-700">
                            Rol: {currentUser.role}
                          </span>

                          <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-inter font-medium text-green-700">
                            Estado: {currentUser.status}
                          </span>
                        </div>
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
                                className={`text-xs font-inter font-medium ${
                                  statusConfig[notification.status].badgeClass
                                } rounded-full px-2 py-1 border`}
                              >
                                {statusConfig[notification.status].shortLabel}
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
            Datos simulados para prototipo académico. Última actualización:{" "}
            {new Date().toLocaleTimeString("es-CL")}
          </p>
        </div>
      </footer>
    </div>
  )
}