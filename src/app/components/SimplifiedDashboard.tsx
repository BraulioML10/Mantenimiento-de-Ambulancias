import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { TruckDetailView } from "./TruckDetailView"
import { AlertTriangle, Wrench, CheckCircle, Activity, Gauge, Calendar } from "lucide-react"
import { useState } from "react"

interface AmbulanceStatus {
  id: string
  patente: string
  status: 'operativa' | 'proxima_mantencion' | 'mantencion_preventiva' | 'mantencion_correctiva' | 'fuera_servicio'
  kilometrajeActual: number
  kilometrajeUltimaMantencion: number
  lastUpdate: string
}

export function SimplifiedDashboard() {
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null)

  // 28 ambulancias con datos realistas
  const ambulances: AmbulanceStatus[] = [
    { id: "A-01", patente: "XXYZ-12", status: "operativa", kilometrajeActual: 45000, kilometrajeUltimaMantencion: 0, lastUpdate: "2 min" },
    { id: "A-02", patente: "ABCD-34", status: "proxima_mantencion", kilometrajeActual: 185000, kilometrajeUltimaMantencion: 100000, lastUpdate: "5 min" },
    { id: "A-03", patente: "EFGH-56", status: "mantencion_preventiva", kilometrajeActual: 202000, kilometrajeUltimaMantencion: 100000, lastUpdate: "12 min" },
    { id: "A-04", patente: "IJKL-78", status: "operativa", kilometrajeActual: 67000, kilometrajeUltimaMantencion: 0, lastUpdate: "8 min" },
    { id: "A-05", patente: "MNOP-90", status: "mantencion_correctiva", kilometrajeActual: 125000, kilometrajeUltimaMantencion: 50000, lastUpdate: "1 min" },
    { id: "A-06", patente: "QRST-11", status: "fuera_servicio", kilometrajeActual: 310000, kilometrajeUltimaMantencion: 200000, lastUpdate: "45 min" },
    { id: "A-07", patente: "UVWX-22", status: "operativa", kilometrajeActual: 32000, kilometrajeUltimaMantencion: 0, lastUpdate: "3 min" },
    { id: "A-08", patente: "YZAB-33", status: "operativa", kilometrajeActual: 58000, kilometrajeUltimaMantencion: 0, lastUpdate: "15 min" },
    { id: "A-09", patente: "CDEF-44", status: "proxima_mantencion", kilometrajeActual: 192000, kilometrajeUltimaMantencion: 100000, lastUpdate: "7 min" },
    { id: "A-10", patente: "GHIJ-55", status: "operativa", kilometrajeActual: 41000, kilometrajeUltimaMantencion: 0, lastUpdate: "4 min" },
    { id: "A-11", patente: "KLMN-66", status: "mantencion_preventiva", kilometrajeActual: 215000, kilometrajeUltimaMantencion: 100000, lastUpdate: "20 min" },
    { id: "A-12", patente: "OPQR-77", status: "operativa", kilometrajeActual: 73000, kilometrajeUltimaMantencion: 0, lastUpdate: "6 min" },
    { id: "A-13", patente: "STUV-88", status: "operativa", kilometrajeActual: 28000, kilometrajeUltimaMantencion: 0, lastUpdate: "9 min" },
    { id: "A-14", patente: "WXYZ-99", status: "mantencion_correctiva", kilometrajeActual: 156000, kilometrajeUltimaMantencion: 80000, lastUpdate: "18 min" },
    { id: "A-15", patente: "AABC-00", status: "operativa", kilometrajeActual: 62000, kilometrajeUltimaMantencion: 0, lastUpdate: "5 min" },
    { id: "A-16", patente: "DDEF-11", status: "proxima_mantencion", kilometrajeActual: 188000, kilometrajeUltimaMantencion: 100000, lastUpdate: "10 min" },
    { id: "A-17", patente: "GGHI-22", status: "operativa", kilometrajeActual: 51000, kilometrajeUltimaMantencion: 0, lastUpdate: "3 min" },
    { id: "A-18", patente: "JJKL-33", status: "mantencion_preventiva", kilometrajeActual: 208000, kilometrajeUltimaMantencion: 100000, lastUpdate: "25 min" },
    { id: "A-19", patente: "MMNO-44", status: "operativa", kilometrajeActual: 39000, kilometrajeUltimaMantencion: 0, lastUpdate: "7 min" },
    { id: "A-20", patente: "PPQR-55", status: "operativa", kilometrajeActual: 64000, kilometrajeUltimaMantencion: 0, lastUpdate: "11 min" },
    { id: "A-21", patente: "SSTT-66", status: "operativa", kilometrajeActual: 47000, kilometrajeUltimaMantencion: 0, lastUpdate: "2 min" },
    { id: "A-22", patente: "UUVV-77", status: "mantencion_correctiva", kilometrajeActual: 142000, kilometrajeUltimaMantencion: 70000, lastUpdate: "14 min" },
    { id: "A-23", patente: "WWXX-88", status: "operativa", kilometrajeActual: 36000, kilometrajeUltimaMantencion: 0, lastUpdate: "8 min" },
    { id: "A-24", patente: "YYZZ-99", status: "proxima_mantencion", kilometrajeActual: 194000, kilometrajeUltimaMantencion: 100000, lastUpdate: "16 min" },
    { id: "A-25", patente: "AABB-00", status: "operativa", kilometrajeActual: 55000, kilometrajeUltimaMantencion: 0, lastUpdate: "4 min" },
    { id: "A-26", patente: "CCDD-11", status: "operativa", kilometrajeActual: 71000, kilometrajeUltimaMantencion: 0, lastUpdate: "13 min" },
    { id: "A-27", patente: "EEFF-22", status: "mantencion_preventiva", kilometrajeActual: 211000, kilometrajeUltimaMantencion: 100000, lastUpdate: "30 min" },
    { id: "A-28", patente: "GGHH-33", status: "operativa", kilometrajeActual: 44000, kilometrajeUltimaMantencion: 0, lastUpdate: "5 min" }
  ]

  // Calculate mileage since last maintenance
  const getKmDesdeUltimaMantencion = (amb: AmbulanceStatus) => {
    return amb.kilometrajeActual - amb.kilometrajeUltimaMantencion
  }

  // Calculate remaining km until next maintenance
  const getKmRestantesParaMantencion = (amb: AmbulanceStatus) => {
    const kmRecorridos = getKmDesdeUltimaMantencion(amb)
    return Math.max(0, 100000 - kmRecorridos)
  }

  // Calculate progress percentage
  const getProgressPercentage = (amb: AmbulanceStatus) => {
    const kmRecorridos = getKmDesdeUltimaMantencion(amb)
    return Math.min(100, (kmRecorridos / 100000) * 100)
  }

  // If an ambulance is selected, show detail view
  if (selectedAmbulance) {
    return (
      <TruckDetailView
        truckId={selectedAmbulance}
        onBack={() => setSelectedAmbulance(null)}
      />
    )
  }

  // Ambulance SVG illustration
  const AmbulanceIllustration = ({ status, progressPercentage }: { status: string, progressPercentage: number }) => {
    const getColor = () => {
      if (status === 'mantencion_preventiva' || status === 'mantencion_correctiva') return '#ef4444' // red
      if (status === 'proxima_mantencion') return '#f59e0b' // amber
      if (status === 'fuera_servicio') return '#6b7280' // gray
      return '#10b981' // green
    }

    const shouldBlink = status === 'mantencion_preventiva' || status === 'mantencion_correctiva'

    return (
      <div className={`relative ${shouldBlink ? 'animate-pulse' : ''}`}>
        <svg width="60" height="35" viewBox="0 0 60 35" className="mx-auto">
          {/* Ambulance body */}
          <rect x="8" y="15" width="30" height="12" rx="1" fill={getColor()} stroke="#374151" strokeWidth="1"/>
          {/* Ambulance cab */}
          <rect x="38" y="12" width="12" height="15" rx="1" fill={getColor()} stroke="#374151" strokeWidth="1"/>
          {/* Red cross on side */}
          <rect x="20" y="19" width="2" height="6" fill="white"/>
          <rect x="18" y="21" width="6" height="2" fill="white"/>
          {/* Wheels */}
          <circle cx="15" cy="28" r="2.5" fill="#374151"/>
          <circle cx="25" cy="28" r="2.5" fill="#374151"/>
          <circle cx="44" cy="28" r="2.5" fill="#374151"/>
          {/* Emergency light on top */}
          <rect x="42" y="8" width="4" height="3" rx="1" fill="#ef4444">
            {status === 'operativa' && (
              <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite"/>
            )}
          </rect>

          {/* Maintenance warning indicator */}
          {(status === 'mantencion_preventiva' || status === 'mantencion_correctiva') && (
            <circle cx="48" cy="8" r="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5">
              <animate attributeName="r" values="4;5;4" dur="1s" repeatCount="indefinite"/>
            </circle>
          )}
          {(status === 'mantencion_preventiva' || status === 'mantencion_correctiva') && (
            <text x="48" y="10" textAnchor="middle" fontSize="6" fill="#f59e0b" fontWeight="bold">!</text>
          )}
        </svg>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'mantencion_preventiva': return 'bg-red-100 text-red-700 border-red-200'
      case 'mantencion_correctiva': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'proxima_mantencion': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'fuera_servicio': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'mantencion_preventiva': return 'MANT. PREVENTIVA'
      case 'mantencion_correctiva': return 'MANT. CORRECTIVA'
      case 'proxima_mantencion': return 'PRÓXIMA'
      case 'fuera_servicio': return 'FUERA SERVICIO'
      default: return 'OPERATIVA'
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  // Statistics
  const totalFlota = ambulances.length
  const mantencionRequerida = ambulances.filter(a => a.status === 'mantencion_preventiva').length
  const proximasMantencion = ambulances.filter(a => a.status === 'proxima_mantencion').length
  const alertasCorrectivas = ambulances.filter(a => a.status === 'mantencion_correctiva').length
  const ambulanciasOperativas = ambulances.filter(a => a.status === 'operativa').length
  const fueraServicio = ambulances.filter(a => a.status === 'fuera_servicio').length

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-blue-700">Total Flota</p>
              <p className="text-2xl font-inter font-bold text-blue-900">{totalFlota}</p>
              <p className="text-xs font-inter text-blue-600 mt-1">Ambulancias totales</p>
            </div>
            <Gauge className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-green-700">Operativas</p>
              <p className="text-2xl font-inter font-bold text-green-900">{ambulanciasOperativas}</p>
              <p className="text-xs font-inter text-green-600 mt-1">En servicio activo</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-amber-700">Próximas</p>
              <p className="text-2xl font-inter font-bold text-amber-900">{proximasMantencion}</p>
              <p className="text-xs font-inter text-amber-600 mt-1">80.000-99.999 km</p>
            </div>
            <Calendar className="w-8 h-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-red-700">Preventiva</p>
              <p className="text-2xl font-inter font-bold text-red-900">{mantencionRequerida}</p>
              <p className="text-xs font-inter text-red-600 mt-1">≥100.000 km</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-orange-700">Correctiva</p>
              <p className="text-2xl font-inter font-bold text-orange-900">{alertasCorrectivas}</p>
              <p className="text-xs font-inter text-orange-600 mt-1">Reparaciones</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-gray-700">Fuera Servicio</p>
              <p className="text-2xl font-inter font-bold text-gray-900">{fueraServicio}</p>
              <p className="text-xs font-inter text-gray-600 mt-1">No disponibles</p>
            </div>
            <Activity className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Critical Maintenance Alert */}
      {mantencionRequerida > 0 && (
        <Card className="p-4 bg-red-50 border-red-200 border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-inter font-semibold text-red-900">⚠️ MANTENCIÓN PREVENTIVA REQUERIDA</p>
                <p className="text-sm font-inter text-red-700">
                  {mantencionRequerida} ambulancia(s) han cumplido 100.000 km desde su última mantención
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="font-inter">
              Ver Detalles
            </Button>
          </div>
        </Card>
      )}

      {/* Ambulances Grid - Showing first 12 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-inter font-semibold text-gray-900">Resumen de Ambulancias (Mostrando 12 de {totalFlota})</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-inter">
              Ver Todas las Ambulancias
            </Button>
            <Button variant="outline" size="sm" className="font-inter">
              Programar Mantención
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {ambulances.slice(0, 12).map(ambulance => {
            const kmRecorridos = getKmDesdeUltimaMantencion(ambulance)
            const kmRestantes = getKmRestantesParaMantencion(ambulance)
            const progressPercentage = getProgressPercentage(ambulance)

            return (
              <Card
                key={ambulance.id}
                className="p-3 hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
                onClick={() => setSelectedAmbulance(ambulance.id)}
              >
                <div className="space-y-2">
                  {/* Ambulance Illustration */}
                  <AmbulanceIllustration
                    status={ambulance.status}
                    progressPercentage={progressPercentage}
                  />

                  {/* Ambulance Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="font-inter font-bold text-gray-900">{ambulance.id}</span>
                      <span className="text-xs font-inter text-gray-600">({ambulance.patente})</span>
                    </div>

                    {/* Status Badge */}
                    <Badge className={`text-xs font-inter mb-2 ${getStatusBadgeColor(ambulance.status)}`}>
                      {getStatusLabel(ambulance.status)}
                    </Badge>

                    {/* Mileage Information */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-inter">Km actual:</span>
                        <span className="font-inter font-semibold text-gray-900">
                          {ambulance.kilometrajeActual.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-inter">Km recorridos:</span>
                        <span className={`font-inter font-semibold ${
                          kmRecorridos >= 100000 ? 'text-red-600' :
                          kmRecorridos >= 80000 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {kmRecorridos.toLocaleString()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                            style={{ width: `${Math.min(100, progressPercentage)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-inter font-semibold ${
                          progressPercentage >= 100 ? 'text-red-600' :
                          progressPercentage >= 80 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>

      {/* Status Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-inter font-semibold text-gray-900 mb-6">Resumen del Estado de Flota</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-green-900">{ambulanciasOperativas}</p>
            <p className="text-sm font-inter text-green-700">Operativas</p>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="w-8 h-8 bg-amber-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-amber-900">{proximasMantencion}</p>
            <p className="text-sm font-inter text-amber-700">Próximas</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-red-900">{mantencionRequerida}</p>
            <p className="text-sm font-inter text-red-700">Mant. Preventiva</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-orange-900">{alertasCorrectivas}</p>
            <p className="text-sm font-inter text-orange-700">Mant. Correctiva</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-gray-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-gray-900">{fueraServicio}</p>
            <p className="text-sm font-inter text-gray-700">Fuera de Servicio</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-inter font-bold text-blue-900">{totalFlota}</p>
            <p className="text-sm font-inter text-blue-700">Total Flota</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
