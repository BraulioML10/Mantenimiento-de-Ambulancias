import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Search, QrCode, Download, Printer, Eye, Info } from "lucide-react"
import { useState } from "react"

interface AmbulanceQR {
  id: string
  patente: string
  qrStatus: 'activo' | 'inactivo' | 'pendiente'
  formLink: string
  lastScan: string
}

export function QRFormsTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const ambulances: AmbulanceQR[] = [
    { id: "R-61", patente: "LVZP-22", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-61", lastScan: "Hace 2 horas" },
    { id: "R-60", patente: "LVZP-20", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-60", lastScan: "Hace 5 minutos" },
    { id: "R-62", patente: "LVZP-23", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-62", lastScan: "Hace 1 día" },
    { id: "R-63", patente: "LVZP-21", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-63", lastScan: "Hace 3 horas" },
    { id: "R-11", patente: "TDKZ-25", qrStatus: "pendiente", formLink: "https://forms.app/ambulancia/R-11", lastScan: "Nunca" },
    { id: "R-12", patente: "HZHC-30", qrStatus: "inactivo", formLink: "https://forms.app/ambulancia/R-12", lastScan: "Hace 15 días" },
    { id: "R-13", patente: "HZHC-31", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-13", lastScan: "Hace 1 hora" },
    { id: "R-14", patente: "LPXW-71", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-14", lastScan: "Hace 30 minutos" },
    { id: "R-20", patente: "HZHC-32", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-20", lastScan: "Hace 4 horas" },
    { id: "R-21", patente: "TDKZ-23", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-21", lastScan: "Hace 2 días" },
    { id: "R-22", patente: "TDKZ-27", qrStatus: "activo", formLink: "https://forms.app/ambulancia/R-22", lastScan: "Hace 6 horas" },
    { id: "A-12", patente: "OPQR-77", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-12", lastScan: "Hace 1 hora" },
    { id: "A-13", patente: "STUV-88", qrStatus: "pendiente", formLink: "https://forms.app/ambulancia/A-13", lastScan: "Nunca" },
    { id: "A-14", patente: "WXYZ-99", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-14", lastScan: "Hace 3 horas" },
    { id: "A-15", patente: "AABC-00", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-15", lastScan: "Hace 5 horas" },
    { id: "A-16", patente: "DDEF-11", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-16", lastScan: "Hace 2 horas" },
    { id: "A-17", patente: "GGHI-22", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-17", lastScan: "Hace 1 día" },
    { id: "A-18", patente: "JJKL-33", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-18", lastScan: "Hace 8 horas" },
    { id: "A-19", patente: "MMNO-44", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-19", lastScan: "Hace 45 minutos" },
    { id: "A-20", patente: "PPQR-55", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-20", lastScan: "Hace 3 días" },
    { id: "A-21", patente: "SSTT-66", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-21", lastScan: "Hace 2 horas" },
    { id: "A-22", patente: "UUVV-77", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-22", lastScan: "Hace 4 horas" },
    { id: "A-23", patente: "WWXX-88", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-23", lastScan: "Hace 1 hora" },
    { id: "A-24", patente: "YYZZ-99", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-24", lastScan: "Hace 6 horas" },
    { id: "A-25", patente: "AABB-00", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-25", lastScan: "Hace 5 días" },
    { id: "A-26", patente: "CCDD-11", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-26", lastScan: "Hace 2 horas" },
    { id: "A-27", patente: "EEFF-22", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-27", lastScan: "Hace 7 horas" },
    { id: "A-28", patente: "GGHH-33", qrStatus: "activo", formLink: "https://forms.app/ambulancia/A-28", lastScan: "Hace 3 horas" }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>
      case 'inactivo':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactivo</Badge>
      case 'pendiente':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const filteredAmbulances = ambulances.filter(amb =>
    amb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amb.patente.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activoCount = ambulances.filter(a => a.qrStatus === 'activo').length
  const inactivoCount = ambulances.filter(a => a.qrStatus === 'inactivo').length
  const pendienteCount = ambulances.filter(a => a.qrStatus === 'pendiente').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Gestión de QR y Formularios</h1>
          <p className="text-sm font-inter text-gray-600">Códigos QR físicos para revisión diaria de ambulancias</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-inter">
            <Download className="w-4 h-4 mr-2" />
            Descargar Todos los QR
          </Button>
          <Button className="font-inter">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Planilla
          </Button>
        </div>
      </div>

      {/* Explanation Card */}
      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-blue-900 mb-2">¿Cómo funciona el sistema de QR?</h3>
            <p className="text-sm font-inter text-blue-800 mb-3">
              Cada ambulancia tiene un código QR único pegado en un lugar visible (generalmente en la cabina del conductor).
              El chofer escanea el QR con su teléfono móvil y accede directamente al formulario de revisión diaria de esa unidad específica.
            </p>
            <ul className="text-sm font-inter text-blue-800 space-y-1">
              <li>✓ El formulario registra automáticamente la ambulancia, fecha y hora</li>
              <li>✓ El chofer completa el checklist de revisión diaria</li>
              <li>✓ Se reportan fallas o problemas detectados</li>
              <li>✓ Los datos se almacenan para seguimiento y control</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-inter text-blue-700">Total QR</p>
          <p className="text-2xl font-inter font-bold text-blue-900">{ambulances.length}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-xs font-inter text-green-700">QR Activos</p>
          <p className="text-2xl font-inter font-bold text-green-900">{activoCount}</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-inter text-amber-700">QR Pendientes</p>
          <p className="text-2xl font-inter font-bold text-amber-900">{pendienteCount}</p>
        </Card>
        <Card className="p-4 bg-gray-50 border-gray-200">
          <p className="text-xs font-inter text-gray-700">QR Inactivos</p>
          <p className="text-2xl font-inter font-bold text-gray-900">{inactivoCount}</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por código o patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-inter"
          />
        </div>
      </Card>

      {/* QR Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-inter">Código</TableHead>
              <TableHead className="font-inter">Patente</TableHead>
              <TableHead className="font-inter">Estado QR</TableHead>
              <TableHead className="font-inter">Link del Formulario</TableHead>
              <TableHead className="font-inter">Último Escaneo</TableHead>
              <TableHead className="font-inter text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAmbulances.map((ambulance) => (
              <TableRow key={ambulance.id} className="hover:bg-gray-50">
                <TableCell className="font-inter font-semibold">{ambulance.id}</TableCell>
                <TableCell className="font-inter">{ambulance.patente}</TableCell>
                <TableCell>{getStatusBadge(ambulance.qrStatus)}</TableCell>
                <TableCell className="font-inter text-sm text-blue-600">
                  <a href={ambulance.formLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {ambulance.formLink}
                  </a>
                </TableCell>
                <TableCell className="font-inter text-sm text-gray-600">{ambulance.lastScan}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="font-inter">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver QR
                    </Button>
                    <Button variant="outline" size="sm" className="font-inter">
                      <Download className="w-4 h-4 mr-1" />
                      Descargar
                    </Button>
                    <Button variant="outline" size="sm" className="font-inter">
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
