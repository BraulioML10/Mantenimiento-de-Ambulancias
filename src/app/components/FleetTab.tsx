import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Search, Eye, Download, Filter } from "lucide-react"
import { useState } from "react"

interface Ambulance {
  id: string
  patente: string
  modelo: string
  kilometrajeActual: number
  kilometrajeUltimaMantencion: number
  estado: 'operativa' | 'proxima_mantencion' | 'mantencion_preventiva' | 'mantencion_correctiva' | 'fuera_servicio'
}

export function FleetTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const ambulances: Ambulance[] = [
    { id: "A-01", patente: "XXYZ-12", modelo: "Mercedes-Benz Sprinter 2020", kilometrajeActual: 45000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-02", patente: "ABCD-34", modelo: "Ford Transit 2019", kilometrajeActual: 185000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-03", patente: "EFGH-56", modelo: "Mercedes-Benz Sprinter 2018", kilometrajeActual: 202000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-04", patente: "IJKL-78", modelo: "Renault Master 2021", kilometrajeActual: 67000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-05", patente: "MNOP-90", modelo: "Fiat Ducato 2019", kilometrajeActual: 125000, kilometrajeUltimaMantencion: 50000, estado: "mantencion_correctiva" },
    { id: "A-06", patente: "QRST-11", modelo: "Mercedes-Benz Sprinter 2017", kilometrajeActual: 310000, kilometrajeUltimaMantencion: 200000, estado: "fuera_servicio" },
    { id: "A-07", patente: "UVWX-22", modelo: "Ford Transit 2022", kilometrajeActual: 32000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-08", patente: "YZAB-33", modelo: "Mercedes-Benz Sprinter 2021", kilometrajeActual: 58000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-09", patente: "CDEF-44", modelo: "Renault Master 2019", kilometrajeActual: 192000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-10", patente: "GHIJ-55", modelo: "Fiat Ducato 2020", kilometrajeActual: 41000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-11", patente: "KLMN-66", modelo: "Mercedes-Benz Sprinter 2018", kilometrajeActual: 215000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-12", patente: "OPQR-77", modelo: "Ford Transit 2020", kilometrajeActual: 73000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-13", patente: "STUV-88", modelo: "Renault Master 2022", kilometrajeActual: 28000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-14", patente: "WXYZ-99", modelo: "Mercedes-Benz Sprinter 2019", kilometrajeActual: 156000, kilometrajeUltimaMantencion: 80000, estado: "mantencion_correctiva" },
    { id: "A-15", patente: "AABC-00", modelo: "Fiat Ducato 2021", kilometrajeActual: 62000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-16", patente: "DDEF-11", modelo: "Ford Transit 2019", kilometrajeActual: 188000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-17", patente: "GGHI-22", modelo: "Mercedes-Benz Sprinter 2021", kilometrajeActual: 51000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-18", patente: "JJKL-33", modelo: "Renault Master 2018", kilometrajeActual: 208000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-19", patente: "MMNO-44", modelo: "Fiat Ducato 2022", kilometrajeActual: 39000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-20", patente: "PPQR-55", modelo: "Mercedes-Benz Sprinter 2020", kilometrajeActual: 64000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-21", patente: "SSTT-66", modelo: "Ford Transit 2021", kilometrajeActual: 47000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-22", patente: "UUVV-77", modelo: "Renault Master 2019", kilometrajeActual: 142000, kilometrajeUltimaMantencion: 70000, estado: "mantencion_correctiva" },
    { id: "A-23", patente: "WWXX-88", modelo: "Mercedes-Benz Sprinter 2022", kilometrajeActual: 36000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-24", patente: "YYZZ-99", modelo: "Fiat Ducato 2019", kilometrajeActual: 194000, kilometrajeUltimaMantencion: 100000, estado: "proxima_mantencion" },
    { id: "A-25", patente: "AABB-00", modelo: "Ford Transit 2020", kilometrajeActual: 55000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-26", patente: "CCDD-11", modelo: "Mercedes-Benz Sprinter 2021", kilometrajeActual: 71000, kilometrajeUltimaMantencion: 0, estado: "operativa" },
    { id: "A-27", patente: "EEFF-22", modelo: "Renault Master 2018", kilometrajeActual: 211000, kilometrajeUltimaMantencion: 100000, estado: "mantencion_preventiva" },
    { id: "A-28", patente: "GGHH-33", modelo: "Fiat Ducato 2021", kilometrajeActual: 44000, kilometrajeUltimaMantencion: 0, estado: "operativa" }
  ]

  const getKmRecorridos = (kmActual: number, kmUltima: number) => kmActual - kmUltima
  const getKmRestantes = (kmActual: number, kmUltima: number) => Math.max(0, 100000 - (kmActual - kmUltima))

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'operativa':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Operativa</Badge>
      case 'proxima_mantencion':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Próxima Mantención</Badge>
      case 'mantencion_preventiva':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Mantención Preventiva</Badge>
      case 'mantencion_correctiva':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Mantención Correctiva</Badge>
      case 'fuera_servicio':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Fuera de Servicio</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const filteredAmbulances = ambulances.filter(amb =>
    amb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amb.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amb.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Gestión de Ambulancias</h1>
          <p className="text-sm font-inter text-gray-600">Control completo de la flota de 28 ambulancias</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-inter">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button className="font-inter">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por código, patente o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-inter"
          />
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-inter text-blue-700">Total</p>
          <p className="text-2xl font-inter font-bold text-blue-900">{ambulances.length}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-xs font-inter text-green-700">Operativas</p>
          <p className="text-2xl font-inter font-bold text-green-900">
            {ambulances.filter(a => a.estado === 'operativa').length}
          </p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-inter text-amber-700">Próximas</p>
          <p className="text-2xl font-inter font-bold text-amber-900">
            {ambulances.filter(a => a.estado === 'proxima_mantencion').length}
          </p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs font-inter text-red-700">Preventiva</p>
          <p className="text-2xl font-inter font-bold text-red-900">
            {ambulances.filter(a => a.estado === 'mantencion_preventiva').length}
          </p>
        </Card>
        <Card className="p-4 bg-orange-50 border-orange-200">
          <p className="text-xs font-inter text-orange-700">Correctiva</p>
          <p className="text-2xl font-inter font-bold text-orange-900">
            {ambulances.filter(a => a.estado === 'mantencion_correctiva').length}
          </p>
        </Card>
        <Card className="p-4 bg-gray-50 border-gray-200">
          <p className="text-xs font-inter text-gray-700">Fuera Servicio</p>
          <p className="text-2xl font-inter font-bold text-gray-900">
            {ambulances.filter(a => a.estado === 'fuera_servicio').length}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-inter">Código</TableHead>
              <TableHead className="font-inter">Patente</TableHead>
              <TableHead className="font-inter">Modelo</TableHead>
              <TableHead className="font-inter text-right">Km Actual</TableHead>
              <TableHead className="font-inter text-right">Km Última Mantención</TableHead>
              <TableHead className="font-inter text-right">Km Recorridos</TableHead>
              <TableHead className="font-inter text-right">Km Restantes</TableHead>
              <TableHead className="font-inter">Estado</TableHead>
              <TableHead className="font-inter text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAmbulances.map((ambulance) => {
              const kmRecorridos = getKmRecorridos(ambulance.kilometrajeActual, ambulance.kilometrajeUltimaMantencion)
              const kmRestantes = getKmRestantes(ambulance.kilometrajeActual, ambulance.kilometrajeUltimaMantencion)

              return (
                <TableRow key={ambulance.id} className="hover:bg-gray-50">
                  <TableCell className="font-inter font-semibold">{ambulance.id}</TableCell>
                  <TableCell className="font-inter">{ambulance.patente}</TableCell>
                  <TableCell className="font-inter text-sm">{ambulance.modelo}</TableCell>
                  <TableCell className="font-inter text-right font-medium">
                    {ambulance.kilometrajeActual.toLocaleString()} km
                  </TableCell>
                  <TableCell className="font-inter text-right">
                    {ambulance.kilometrajeUltimaMantencion.toLocaleString()} km
                  </TableCell>
                  <TableCell className={`font-inter text-right font-semibold ${
                    kmRecorridos >= 100000 ? 'text-red-600' :
                    kmRecorridos >= 80000 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {kmRecorridos.toLocaleString()} km
                  </TableCell>
                  <TableCell className={`font-inter text-right font-semibold ${
                    kmRestantes === 0 ? 'text-red-600' :
                    kmRestantes <= 20000 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {kmRestantes.toLocaleString()} km
                  </TableCell>
                  <TableCell>{getEstadoBadge(ambulance.estado)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" className="font-inter">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalle
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
