import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Search, Filter, Download, AlertTriangle, Gauge, TrendingUp, Activity } from "lucide-react"
import { useState } from "react"

interface AmbulanceKmData {
  id: string
  patente: string
  kilometrajeActual: number
  kilometrajeUltimaMantencion: number
  estado: 'operativa' | 'proxima_mantencion' | 'mantencion_preventiva' | 'mantencion_correctiva' | 'fuera_servicio'
}

export function FuelTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("all")

  const ambulances: AmbulanceKmData[] = [
    { id: "R-61", patente: "LVZP-22", kilometrajeActual: 45000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "R-60", patente: "LVZP-20", kilometrajeActual: 185000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "R-62", patente: "LVZP-23", kilometrajeActual: 202000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "R-63", patente: "LVZP-21", kilometrajeActual: 67000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "R-11", patente: "TDKZ-25", kilometrajeActual: 125000, kilometrajeUltimaMantencion: 50000, estado: "mantencion_correctiva" },
    { id: "R-12", patente: "HZHC-30", kilometrajeActual: 310000, kilometrajeUltimaMantencion: 200000, estado: "fuera_servicio" },
    { id: "R-13", patente: "HZHC-31", kilometrajeActual: 32000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "R-14", patente: "LPXW-71", kilometrajeActual: 58000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "R-20", patente: "HZHC-32", kilometrajeActual: 192000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "R-21", patente: "TDKZ-23", kilometrajeActual: 41000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "R-22", patente: "TDKZ-27", kilometrajeActual: 215000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-12", patente: "OPQR-77", kilometrajeActual: 73000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-13", patente: "STUV-88", kilometrajeActual: 28000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-14", patente: "WXYZ-99", kilometrajeActual: 156000, kilometrajeUltimaMantencion: 80000, estado: "mantencion_correctiva" },
    { id: "A-15", patente: "AABC-00", kilometrajeActual: 62000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-16", patente: "DDEF-11", kilometrajeActual: 188000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-17", patente: "GGHI-22", kilometrajeActual: 51000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-18", patente: "JJKL-33", kilometrajeActual: 208000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-19", patente: "MMNO-44", kilometrajeActual: 39000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-20", patente: "PPQR-55", kilometrajeActual: 64000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-21", patente: "SSTT-66", kilometrajeActual: 47000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-22", patente: "UUVV-77", kilometrajeActual: 142000, kilometrajeUltimaMantencion: 70000, estado: "mantencion_correctiva" },
    { id: "A-23", patente: "WWXX-88", kilometrajeActual: 36000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-24", patente: "YYZZ-99", kilometrajeActual: 194000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-25", patente: "AABB-00", kilometrajeActual: 55000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-26", patente: "CCDD-11", kilometrajeActual: 71000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-27", patente: "EEFF-22", kilometrajeActual: 211000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-28", patente: "GGHH-33", kilometrajeActual: 44000, kilometrajeUltimaMantencion: 0, estado: "operativa" }
  ]

  const getKmRecorridos = (kmActual: number, kmUltima: number) => kmActual - kmUltima
  const getKmRestantes = (kmActual: number, kmUltima: number) => Math.max(0, 100000 - (kmActual - kmUltima))
  const getProgressPercentage = (kmActual: number, kmUltima: number) => {
    const kmRecorridos = kmActual - kmUltima
    return Math.min(100, (kmRecorridos / 100000) * 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'operativa':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Operativa</Badge>
      case 'proxima_mantencion':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Próxima</Badge>
      case 'mantencion_preventiva':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Preventiva</Badge>
      case 'mantencion_correctiva':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Correctiva</Badge>
      case 'fuera_servicio':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">Fuera Servicio</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const mantencionRequerida = ambulances.filter(a => getKmRecorridos(a.kilometrajeActual, a.kilometrajeUltimaMantencion) >= 100000)
  const proximasMantencion = ambulances.filter(a => {
    const km = getKmRecorridos(a.kilometrajeActual, a.kilometrajeUltimaMantencion)
    return km >= 80000 && km < 100000
  })

  let filteredAmbulances = ambulances.filter(amb =>
    amb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amb.patente.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filterEstado !== "all") {
    filteredAmbulances = filteredAmbulances.filter(amb => amb.estado === filterEstado)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Control de Kilometraje</h1>
          <p className="text-sm font-inter text-gray-600">Monitoreo de avance hacia mantención preventiva (según pauta técnica de kilometraje)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-inter">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button className="font-inter">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alertas Kilometraje
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Total Ambulancias</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">{ambulances.length}</p>
              <p className="text-xs font-inter text-gray-500">Flota completa</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gauge className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Mantención Requerida</p>
              <p className="text-2xl font-inter font-semibold text-red-600">{mantencionRequerida.length}</p>
              <p className="text-xs font-inter text-red-600">≥ 100.000 km recorridos</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Próximas</p>
              <p className="text-2xl font-inter font-semibold text-amber-600">{proximasMantencion.length}</p>
              <p className="text-xs font-inter text-amber-600">80.000 - 99.999 km</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Km Promedio</p>
              <p className="text-2xl font-inter font-semibold text-green-600">
                {Math.round(ambulances.reduce((sum, a) => sum + getKmRecorridos(a.kilometrajeActual, a.kilometrajeUltimaMantencion), 0) / ambulances.length).toLocaleString()}
              </p>
              <p className="text-xs font-inter text-green-600">desde última mantención</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {mantencionRequerida.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200 border-2 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            <h3 className="font-inter font-semibold text-red-900">⚠️ Ambulancias que Requieren Mantención Preventiva</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {mantencionRequerida.map(amb => {
              const kmRecorridos = getKmRecorridos(amb.kilometrajeActual, amb.kilometrajeUltimaMantencion)
              return (
                <div key={amb.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-inter font-semibold text-gray-900">{amb.id}</span>
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">¡URGENTE!</Badge>
                  </div>
                  <p className="text-xs font-inter text-gray-600">{amb.patente}</p>
                  <p className="text-sm font-inter text-red-600 font-semibold mt-1">
                    {kmRecorridos.toLocaleString()} km recorridos
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código o patente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-inter"
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-52 font-inter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="operativa">Operativas</SelectItem>
              <SelectItem value="proxima_mantencion">Próximas a mantención</SelectItem>
              <SelectItem value="mantencion_preventiva">Mantención preventiva</SelectItem>
              <SelectItem value="mantencion_correctiva">Mantención correctiva</SelectItem>
              <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-inter">
            <Filter className="w-4 h-4 mr-2" />
            Más Filtros
          </Button>
        </div>
      </Card>

      {/* Ambulances Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredAmbulances.map(ambulance => {
          const kmRecorridos = getKmRecorridos(ambulance.kilometrajeActual, ambulance.kilometrajeUltimaMantencion)
          const kmRestantes = getKmRestantes(ambulance.kilometrajeActual, ambulance.kilometrajeUltimaMantencion)
          const progressPercentage = getProgressPercentage(ambulance.kilometrajeActual, ambulance.kilometrajeUltimaMantencion)

          return (
            <Card key={ambulance.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-inter font-bold text-gray-900">{ambulance.id}</h3>
                    <p className="text-sm font-inter text-gray-600">{ambulance.patente}</p>
                  </div>
                  {getEstadoBadge(ambulance.estado)}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-inter font-medium text-gray-700">Avance a mantención</span>
                    <span className={`text-xs font-inter font-semibold ${
                      progressPercentage >= 100 ? 'text-red-600' :
                      progressPercentage >= 80 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm font-inter">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Km actual:</span>
                    <span className="font-semibold text-gray-900">{ambulance.kilometrajeActual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última mantención:</span>
                    <span className="font-medium text-gray-700">{ambulance.kilometrajeUltimaMantencion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Km recorridos:</span>
                    <span className={`font-semibold ${
                      kmRecorridos >= 100000 ? 'text-red-600' :
                      kmRecorridos >= 80000 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {kmRecorridos.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Km restantes:</span>
                    <span className={`font-semibold ${
                      kmRestantes === 0 ? 'text-red-600' :
                      kmRestantes <= 20000 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {kmRestantes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
