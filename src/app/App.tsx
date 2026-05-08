import { useState } from "react"
import { SimplifiedDashboard } from "./components/SimplifiedDashboard"
import { FleetTab } from "./components/FleetTab"
import { FuelTab } from "./components/FuelTab"
import { QRFormsTab } from "./components/QRFormsTab"
import { RoutesTab } from "./components/RoutesTab"
import { AlertsTab } from "./components/AlertsTab"
import { ReportsTab } from "./components/ReportsTab"
import {
  Ambulance,
  FileText,
  Gauge,
  Home,
  QrCode,
  Users,
  Wrench,
} from "lucide-react"

type TabType =
  | "inicio"
  | "ambulancias"
  | "kilometraje"
  | "mantenimientos"
  | "usuarios"
  | "reportes"
  | "qr"

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio")

  const tabs: {
    id: TabType
    label: string
    icon: React.ReactNode
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Ambulance className="w-7 h-7 text-red-600" />
            </div>

            <div>
              <h1 className="text-2xl font-inter font-bold text-gray-900">
                Gestión de Mantenimiento Preventivo SAMU - SSVQ
              </h1>
              <p className="text-sm font-inter text-gray-600">
                Prototipo funcional con datos simulados para control de kilometraje, mantenciones, usuarios y registros QR.
              </p>
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
          <p>Datos simulados para prototipo académico. Última actualización: {new Date().toLocaleTimeString("es-CL")}</p>
        </div>
      </footer>
    </div>
  )
}