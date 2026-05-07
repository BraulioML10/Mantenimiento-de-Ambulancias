import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Search, Filter, Download, Plus, Calendar, Wrench, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Mantenimiento {
  id: string
  tipo: 'preventiva' | 'correctiva'
  ambulancia: string
  patente: string
  fechaProgramada: string
  kmAlMantenimiento: number
  responsable: string
  estado: 'pendiente' | 'en_proceso' | 'realizada'
  descripcion: string
}

export function RoutesTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const mantenimientos: Mantenimiento[] = [
    { id: "MNT-001", tipo: "preventiva", ambulancia: "A-03", patente: "EFGH-56", fechaProgramada: "2026-05-10", kmAlMantenimiento: 202000, responsable: "Taller Central", estado: "pendiente", descripcion: "Mantención preventiva 100.000 km" },
    { id: "MNT-002", tipo: "preventiva", ambulancia: "A-11", patente: "KLMN-66", fechaProgramada: "2026-05-08", kmAlMantenimiento: 215000, responsable: "Taller Norte", estado: "en_proceso", descripcion: "Mantención preventiva 100.000 km" },
    { id: "MNT-003", tipo: "preventiva", ambulancia: "A-18", patente: "JJKL-33", fechaProgramada: "2026-05-12", kmAlMantenimiento: 208000, responsable: "Taller Central", estado: "pendiente", descripcion: "Mantención preventiva 100.000 km" },
    { id: "MNT-004", tipo: "preventiva", ambulancia: "A-27", patente: "EEFF-22", fechaProgramada: "2026-05-15", kmAlMantenimiento: 211000, responsable: "Taller Sur", estado: "pendiente", descripcion: "Mantención preventiva 100.000 km" },

    { id: "MNT-005", tipo: "correctiva", ambulancia: "A-05", patente: "MNOP-90", fechaProgramada: "2026-05-07", kmAlMantenimiento: 125000, responsable: "Taller Central", estado: "en_proceso", descripcion: "Reparación sistema de frenos" },
    { id: "MNT-006", tipo: "correctiva", ambulancia: "A-14", patente: "WXYZ-99", fechaProgramada: "2026-05-09", kmAlMantenimiento: 156000, responsable: "Taller Norte", estado: "pendiente", descripcion: "Revisión de motor por ruido anormal" },
    { id: "MNT-007", tipo: "correctiva", ambulancia: "A-22", patente: "UUVV-77", fechaProgramada: "2026-05-08", kmAlMantenimiento: 142000, responsable: "Taller Central", estado: "pendiente", descripcion: "Diagnóstico luz de advertencia motor" },

    { id: "MNT-008", tipo: "preventiva", ambulancia: "A-02", patente: "ABCD-34", fechaProgramada: "2026-05-20", kmAlMantenimiento: 185000, responsable: "Taller Norte", estado: "pendiente", descripcion: "Pre-agenda: Próxima a cumplir 100.000 km" },
    { id: "MNT-009", tipo: "preventiva", ambulancia: "A-09", patente: "CDEF-44", fechaProgramada: "2026-05-22", kmAlMantenimiento: 192000, responsable: "Taller Sur", estado: "pendiente", descripcion: "Pre-agenda: Próxima a cumplir 100.000 km" },
    { id: "MNT-010", tipo: "preventiva", ambulancia: "A-16", patente: "DDEF-11", fechaProgramada: "2026-05-18", kmAlMantenimiento: 188000, responsable: "Taller Central", estado: "pendiente", descripcion: "Pre-agenda: Próxima a cumplir 100.000 km" },

    { id: "MNT-011", tipo: "preventiva", ambulancia: "A-01", patente: "XXYZ-12", fechaProgramada: "2026-04-25", kmAlMantenimiento: 100000, responsable: "Taller Central", estado: "realizada", descripcion: "Mantención preventiva 100.000 km completada" },
    { id: "MNT-012", tipo: "correctiva", ambulancia: "A-07", patente: "UVWX-22", fechaProgramada: "2026-04-20", kmAlMantenimiento: 32000, responsable: "Taller Norte", estado: "realizada", descripcion: "Reparación sistema eléctrico" }
  ]

  const getTipoBadge = (tipo: string) => {
    return tipo === 'preventiva'
      ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Preventiva</Badge>
      : <Badge className="bg-orange-100 text-orange-700 border-orange-200">Correctiva</Badge>
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Pendiente</Badge>
      case 'en_proceso':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En Proceso</Badge>
      case 'realizada':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Realizada</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const filteredMantenimientos = mantenimientos.filter(mnt =>
    mnt.ambulancia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mnt.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mnt.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendientesCount = mantenimientos.filter(m => m.estado === 'pendiente').length
  const enProcesoCount = mantenimientos.filter(m => m.estado === 'en_proceso').length
  const realizadasCount = mantenimientos.filter(m => m.estado === 'realizada').length
  const preventivasCount = mantenimientos.filter(m => m.tipo === 'preventiva' && m.estado !== 'realizada').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Gestión de Mantenimientos</h1>
          <p className="text-sm font-inter text-gray-600">Control de mantenciones preventivas y correctivas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-inter">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="font-inter">
            <Plus className="w-4 h-4 mr-2" />
            Programar Mantención
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Total Mantenciones</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">{mantenimientos.length}</p>
              <p className="text-xs font-inter text-gray-500">Programadas + Realizadas</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Pendientes</p>
              <p className="text-2xl font-inter font-semibold text-gray-700">{pendientesCount}</p>
              <p className="text-xs font-inter text-gray-500">Requieren agendamiento</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">En Proceso</p>
              <p className="text-2xl font-inter font-semibold text-blue-600">{enProcesoCount}</p>
              <p className="text-xs font-inter text-blue-600">En talleres actualmente</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Realizadas</p>
              <p className="text-2xl font-inter font-semibold text-green-600">{realizadasCount}</p>
              <p className="text-xs font-inter text-green-600">Completadas este mes</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Preventivas Alert */}
      {preventivasCount > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-inter font-semibold text-blue-900">Mantenciones Preventivas Programadas</p>
                <p className="text-sm font-inter text-blue-700">
                  {preventivasCount} mantención(es) preventiva(s) requieren coordinación
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="font-inter">
              Ver Calendario
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por ambulancia, patente o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-inter"
            />
          </div>
          <Button variant="outline" className="font-inter">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Mantenimientos Table */}
      <Card className="border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-inter font-medium">Tipo</TableHead>
              <TableHead className="font-inter font-medium">Ambulancia</TableHead>
              <TableHead className="font-inter font-medium">Patente</TableHead>
              <TableHead className="font-inter font-medium">Fecha Programada</TableHead>
              <TableHead className="font-inter font-medium text-right">Km al Mantenimiento</TableHead>
              <TableHead className="font-inter font-medium">Responsable</TableHead>
              <TableHead className="font-inter font-medium">Estado</TableHead>
              <TableHead className="font-inter font-medium">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMantenimientos.map((mnt) => (
              <TableRow key={mnt.id} className="hover:bg-gray-50">
                <TableCell>{getTipoBadge(mnt.tipo)}</TableCell>
                <TableCell className="font-inter font-semibold">{mnt.ambulancia}</TableCell>
                <TableCell className="font-inter">{mnt.patente}</TableCell>
                <TableCell className="font-inter">{mnt.fechaProgramada}</TableCell>
                <TableCell className="font-inter text-right font-medium">
                  {mnt.kmAlMantenimiento.toLocaleString()} km
                </TableCell>
                <TableCell className="font-inter">{mnt.responsable}</TableCell>
                <TableCell>{getEstadoBadge(mnt.estado)}</TableCell>
                <TableCell className="font-inter text-sm text-gray-600">{mnt.descripcion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
