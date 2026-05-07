import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { AlertTriangle, Wrench, Clock, XCircle, CheckCircle, Bell } from "lucide-react"

interface Alert {
  id: string
  tipo: 'preventiva_cumplida' | 'proxima_preventiva' | 'correctiva_reportada' | 'fuera_servicio'
  ambulancia: string
  patente: string
  descripcion: string
  fecha: string
  prioridad: 'alta' | 'media' | 'baja'
  estado: 'pendiente' | 'en_proceso' | 'resuelta'
}

export function AlertsTab() {
  const alerts: Alert[] = [
    { id: "ALT-001", tipo: "preventiva_cumplida", ambulancia: "A-03", patente: "EFGH-56", descripcion: "Ambulancia superó 100.000 km desde última mantención (102.000 km recorridos)", fecha: "Hoy, 09:15", prioridad: "alta", estado: "pendiente" },
    { id: "ALT-002", tipo: "preventiva_cumplida", ambulancia: "A-11", patente: "KLMN-66", descripcion: "Ambulancia superó 100.000 km desde última mantención (115.000 km recorridos)", fecha: "Hoy, 08:30", prioridad: "alta", estado: "en_proceso" },
    { id: "ALT-003", tipo: "preventiva_cumplida", ambulancia: "A-18", patente: "JJKL-33", descripcion: "Ambulancia superó 100.000 km desde última mantención (108.000 km recorridos)", fecha: "Ayer, 16:45", prioridad: "alta", estado: "pendiente" },
    { id: "ALT-004", tipo: "preventiva_cumplida", ambulancia: "A-27", patente: "EEFF-22", descripcion: "Ambulancia superó 100.000 km desde última mantención (111.000 km recorridos)", fecha: "Ayer, 14:20", prioridad: "alta", estado: "pendiente" },

    { id: "ALT-005", tipo: "proxima_preventiva", ambulancia: "A-02", patente: "ABCD-34", descripcion: "Próxima a mantención preventiva (85.000 km recorridos)", fecha: "Hoy, 10:00", prioridad: "media", estado: "pendiente" },
    { id: "ALT-006", tipo: "proxima_preventiva", ambulancia: "A-09", patente: "CDEF-44", descripcion: "Próxima a mantención preventiva (92.000 km recorridos)", fecha: "Hoy, 07:30", prioridad: "media", estado: "pendiente" },
    { id: "ALT-007", tipo: "proxima_preventiva", ambulancia: "A-16", patente: "DDEF-11", descripcion: "Próxima a mantención preventiva (88.000 km recorridos)", fecha: "Ayer, 18:00", prioridad: "media", estado: "pendiente" },
    { id: "ALT-008", tipo: "proxima_preventiva", ambulancia: "A-24", patente: "YYZZ-99", descripcion: "Próxima a mantención preventiva (94.000 km recorridos)", fecha: "Ayer, 12:15", prioridad: "media", estado: "pendiente" },

    { id: "ALT-009", tipo: "correctiva_reportada", ambulancia: "A-05", patente: "MNOP-90", descripcion: "Falla reportada: Sistema de frenos requiere revisión urgente", fecha: "Hoy, 11:45", prioridad: "alta", estado: "en_proceso" },
    { id: "ALT-010", tipo: "correctiva_reportada", ambulancia: "A-14", patente: "WXYZ-99", descripcion: "Falla reportada: Ruido anormal en motor", fecha: "Hoy, 06:30", prioridad: "media", estado: "pendiente" },
    { id: "ALT-011", tipo: "correctiva_reportada", ambulancia: "A-22", patente: "UUVV-77", descripcion: "Falla reportada: Luz de advertencia de motor encendida", fecha: "Ayer, 19:20", prioridad: "alta", estado: "pendiente" },

    { id: "ALT-012", tipo: "fuera_servicio", ambulancia: "A-06", patente: "QRST-11", descripcion: "Ambulancia fuera de servicio por alto kilometraje total (110.000 km desde última mantención)", fecha: "Hace 3 días", prioridad: "alta", estado: "en_proceso" }
  ]

  const getTipoInfo = (tipo: string) => {
    switch (tipo) {
      case 'preventiva_cumplida':
        return { icon: <AlertTriangle className="w-5 h-5" />, label: "Mantención Preventiva Requerida", color: "bg-red-100 text-red-700 border-red-200" }
      case 'proxima_preventiva':
        return { icon: <Clock className="w-5 h-5" />, label: "Próxima a Mantención", color: "bg-amber-100 text-amber-700 border-amber-200" }
      case 'correctiva_reportada':
        return { icon: <Wrench className="w-5 h-5" />, label: "Falla Correctiva Reportada", color: "bg-orange-100 text-orange-700 border-orange-200" }
      case 'fuera_servicio':
        return { icon: <XCircle className="w-5 h-5" />, label: "Fuera de Servicio", color: "bg-gray-100 text-gray-700 border-gray-200" }
      default:
        return { icon: <Bell className="w-5 h-5" />, label: "Desconocido", color: "bg-blue-100 text-blue-700 border-blue-200" }
    }
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Alta</Badge>
      case 'media':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Media</Badge>
      case 'baja':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Baja</Badge>
      default:
        return <Badge>Desconocida</Badge>
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Pendiente</Badge>
      case 'en_proceso':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En Proceso</Badge>
      case 'resuelta':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Resuelta</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const preventivasCumplidasCount = alerts.filter(a => a.tipo === 'preventiva_cumplida' && a.estado !== 'resuelta').length
  const proximasCount = alerts.filter(a => a.tipo === 'proxima_preventiva' && a.estado !== 'resuelta').length
  const correctivasCount = alerts.filter(a => a.tipo === 'correctiva_reportada' && a.estado !== 'resuelta').length
  const fueraServicioCount = alerts.filter(a => a.tipo === 'fuera_servicio' && a.estado !== 'resuelta').length

  const preventivas = alerts.filter(a => a.tipo === 'preventiva_cumplida')
  const proximas = alerts.filter(a => a.tipo === 'proxima_preventiva')
  const correctivas = alerts.filter(a => a.tipo === 'correctiva_reportada')
  const fueraServicio = alerts.filter(a => a.tipo === 'fuera_servicio')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Centro de Alertas</h1>
          <p className="text-sm font-inter text-gray-600">Monitoreo de alertas de mantención y operación</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-inter">
            Filtros
          </Button>
          <Button className="font-inter">
            <Bell className="w-4 h-4 mr-2" />
            Configurar Notificaciones
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-red-700">Preventiva Requerida</p>
              <p className="text-2xl font-inter font-bold text-red-900">{preventivasCumplidasCount}</p>
              <p className="text-xs font-inter text-red-600">≥100.000 km</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-amber-700">Próximas</p>
              <p className="text-2xl font-inter font-bold text-amber-900">{proximasCount}</p>
              <p className="text-xs font-inter text-amber-600">80.000-99.999 km</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-orange-700">Correctivas</p>
              <p className="text-2xl font-inter font-bold text-orange-900">{correctivasCount}</p>
              <p className="text-xs font-inter text-orange-600">Fallas reportadas</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-medium text-gray-700">Fuera Servicio</p>
              <p className="text-2xl font-inter font-bold text-gray-900">{fueraServicioCount}</p>
              <p className="text-xs font-inter text-gray-600">No disponibles</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Mantención Preventiva Requerida */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-gray-900">Mantención Preventiva Requerida</h3>
            <p className="text-sm font-inter text-gray-600">Ambulancias que superaron 100.000 km desde última mantención</p>
          </div>
        </div>
        <div className="space-y-3">
          {preventivas.map(alert => {
            const tipoInfo = getTipoInfo(alert.tipo)
            return (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${tipoInfo.color} rounded-lg flex items-center justify-center`}>
                    {tipoInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-inter font-semibold text-gray-900">{alert.ambulancia}</span>
                      <span className="text-sm font-inter text-gray-600">({alert.patente})</span>
                      {getPrioridadBadge(alert.prioridad)}
                      {getEstadoBadge(alert.estado)}
                    </div>
                    <p className="text-sm font-inter text-gray-700">{alert.descripcion}</p>
                    <p className="text-xs font-inter text-gray-500 mt-1">{alert.fecha}</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="font-inter">Programar Mantención</Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Próximas a Mantención */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-gray-900">Próximas a Mantención</h3>
            <p className="text-sm font-inter text-gray-600">Ambulancias que están por cumplir 100.000 km</p>
          </div>
        </div>
        <div className="space-y-3">
          {proximas.map(alert => {
            const tipoInfo = getTipoInfo(alert.tipo)
            return (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${tipoInfo.color} rounded-lg flex items-center justify-center`}>
                    {tipoInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-inter font-semibold text-gray-900">{alert.ambulancia}</span>
                      <span className="text-sm font-inter text-gray-600">({alert.patente})</span>
                      {getPrioridadBadge(alert.prioridad)}
                      {getEstadoBadge(alert.estado)}
                    </div>
                    <p className="text-sm font-inter text-gray-700">{alert.descripcion}</p>
                    <p className="text-xs font-inter text-gray-500 mt-1">{alert.fecha}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="font-inter">Pre-Agendar</Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Fallas Correctivas */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-gray-900">Fallas Correctivas Reportadas</h3>
            <p className="text-sm font-inter text-gray-600">Fallas detectadas por choferes en revisión diaria</p>
          </div>
        </div>
        <div className="space-y-3">
          {correctivas.map(alert => {
            const tipoInfo = getTipoInfo(alert.tipo)
            return (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${tipoInfo.color} rounded-lg flex items-center justify-center`}>
                    {tipoInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-inter font-semibold text-gray-900">{alert.ambulancia}</span>
                      <span className="text-sm font-inter text-gray-600">({alert.patente})</span>
                      {getPrioridadBadge(alert.prioridad)}
                      {getEstadoBadge(alert.estado)}
                    </div>
                    <p className="text-sm font-inter text-gray-700">{alert.descripcion}</p>
                    <p className="text-xs font-inter text-gray-500 mt-1">{alert.fecha}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="font-inter">Asignar Técnico</Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Fuera de Servicio */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <XCircle className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-gray-900">Ambulancias Fuera de Servicio</h3>
            <p className="text-sm font-inter text-gray-600">No disponibles para operación</p>
          </div>
        </div>
        <div className="space-y-3">
          {fueraServicio.map(alert => {
            const tipoInfo = getTipoInfo(alert.tipo)
            return (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${tipoInfo.color} rounded-lg flex items-center justify-center`}>
                    {tipoInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-inter font-semibold text-gray-900">{alert.ambulancia}</span>
                      <span className="text-sm font-inter text-gray-600">({alert.patente})</span>
                      {getPrioridadBadge(alert.prioridad)}
                      {getEstadoBadge(alert.estado)}
                    </div>
                    <p className="text-sm font-inter text-gray-700">{alert.descripcion}</p>
                    <p className="text-xs font-inter text-gray-500 mt-1">{alert.fecha}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="font-inter">Ver Detalle</Button>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
