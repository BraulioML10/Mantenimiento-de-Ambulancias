import { useState } from 'react'
import { SimplifiedDashboard } from './components/SimplifiedDashboard'
import { FleetTab } from './components/FleetTab'
import { FuelTab } from './components/FuelTab'
import { QRFormsTab } from './components/QRFormsTab'
import { RoutesTab } from './components/RoutesTab'
import { AlertsTab } from './components/AlertsTab'
import { ReportsTab } from './components/ReportsTab'
import { Bell, Settings, User, Search, Ambulance } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

type TabType = 'inicio' | 'ambulancias' | 'kilometraje' | 'qr' | 'mantenimientos' | 'alertas' | 'reportes'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('inicio')

  const renderContent = () => {
    switch (activeTab) {
      case 'ambulancias':
        return <FleetTab />
      case 'kilometraje':
        return <FuelTab />
      case 'qr':
        return <QRFormsTab />
      case 'mantenimientos':
        return <RoutesTab />
      case 'alertas':
        return <AlertsTab />
      case 'reportes':
        return <ReportsTab />
      default:
        return (
          <main className="p-6">
            <SimplifiedDashboard />
          </main>
        )
    }
  }

  const getTabClassName = (tab: TabType) => {
    return `text-sm font-inter transition-colors ${
      activeTab === tab
        ? 'text-red-600 border-b-2 border-red-600 pb-4'
        : 'text-gray-500 hover:text-gray-700 pb-4'
    }`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {/* Logo Ambulancia */}
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-md">
                <Ambulance className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-gray-900 font-inter font-semibold">Dashboard de Mantención de Ambulancias</h1>
                <p className="text-xs text-gray-500 font-inter">Sistema de Control de Kilometraje</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('inicio')}
                className={getTabClassName('inicio')}
              >
                Inicio
              </button>
              <button
                onClick={() => setActiveTab('ambulancias')}
                className={getTabClassName('ambulancias')}
              >
                Ambulancias
              </button>
              <button
                onClick={() => setActiveTab('kilometraje')}
                className={getTabClassName('kilometraje')}
              >
                Kilometraje
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={getTabClassName('qr')}
              >
                QR / Formularios
              </button>
              <button
                onClick={() => setActiveTab('mantenimientos')}
                className={getTabClassName('mantenimientos')}
              >
                Mantenimientos
              </button>
              <button
                onClick={() => setActiveTab('alertas')}
                className={getTabClassName('alertas')}
              >
                Alertas
              </button>
              <button
                onClick={() => setActiveTab('reportes')}
                className={getTabClassName('reportes')}
              >
                Reportes
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar ambulancia, patente, estado..."
                className="w-80 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 font-inter"
              />
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 relative">
              <Bell className="w-5 h-5" />
              {/* Notification indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {renderContent()}
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500 font-inter">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-red-600" />
              <span>© 2026 Sistema de Mantención de Ambulancias.</span>
            </div>
            <span>Control preventivo basado en kilometraje cada 100.000 km.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema en línea</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
