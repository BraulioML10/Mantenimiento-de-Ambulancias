import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Download, Calendar, TrendingUp, AlertTriangle, Wrench } from "lucide-react"

export function ReportsTab() {
  // Mantenciones por mes
  const monthlyData = [
    { mes: 'Ene', preventivas: 4, correctivas: 2 },
    { mes: 'Feb', preventivas: 3, correctivas: 3 },
    { mes: 'Mar', preventivas: 5, correctivas: 1 },
    { mes: 'Abr', preventivas: 4, correctivas: 2 },
    { mes: 'May', preventivas: 6, correctivas: 3 },
  ]

  // Distribución de alertas
  const alertData = [
    { tipo: 'Preventivas', cantidad: 4, color: '#ef4444' },
    { tipo: 'Próximas', cantidad: 4, color: '#f59e0b' },
    { tipo: 'Correctivas', cantidad: 3, color: '#f97316' },
  ]

  // Ambulancias con más mantenciones
  const ambulanciaData = [
    { ambulancia: 'A-03', mantenciones: 8 },
    { ambulancia: 'A-11', mantenciones: 7 },
    { ambulancia: 'A-18', mantenciones: 6 },
    { ambulancia: 'A-06', mantenciones: 5 },
    { ambulancia: 'A-27', mantenciones: 4 },
  ]

  // Kilometraje promedio mensual
  const kmData = [
    { mes: 'Ene', kmPromedio: 15200 },
    { mes: 'Feb', kmPromedio: 16800 },
    { mes: 'Mar', kmPromedio: 14500 },
    { mes: 'Abr', kmPromedio: 17200 },
    { mes: 'May', kmPromedio: 16000 },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">Reportes y Análisis</h1>
          <p className="text-sm font-inter text-gray-600">Estadísticas de mantención y operación de la flota</p>
        </div>
        <div className="flex gap-3">
          <Select>
            <SelectTrigger className="w-40 font-inter">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="font-inter">
            <Calendar className="w-4 h-4 mr-2" />
            Seleccionar Fechas
          </Button>
          <Button className="font-inter">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Total Mantenciones</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">22</p>
              <p className="text-sm font-inter text-green-600 mt-1">+15% vs mes anterior</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Cumplimiento</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">92%</p>
              <p className="text-sm font-inter text-green-600 mt-1">+3% mejora</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Alertas Activas</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">11</p>
              <p className="text-sm font-inter text-red-600 mt-1">4 preventivas</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-600">Km Promedio</p>
              <p className="text-2xl font-inter font-semibold text-gray-900">16.0K</p>
              <p className="text-sm font-inter text-green-600 mt-1">por mes</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">

        {/* Mantenciones por Mes */}
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Mantenciones por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
              <Bar dataKey="preventivas" fill="#2563eb" radius={[4, 4, 0, 0]} name="Preventivas" />
              <Bar dataKey="correctivas" fill="#f97316" radius={[4, 4, 0, 0]} name="Correctivas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribución de Alertas */}
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Distribución de Alertas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={alertData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="cantidad"
                nameKey="tipo"
                label
              >
                {alertData.map((entry, index) => (
                  <Cell key={`alert-cell-${entry.tipo}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Ambulancias con Más Mantenciones */}
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Ambulancias con Más Mantenciones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ambulanciaData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="ambulancia" type="category" stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="mantenciones" fill="#ef4444" radius={[0, 4, 4, 0]} name="Mantenciones" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Kilometraje Promedio Mensual */}
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Kilometraje Promedio Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(1)}K km`, 'Km Promedio']}
              />
              <Line
                type="monotone"
                dataKey="kmPromedio"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                name="Km Promedio"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="p-6 border border-gray-200">
        <h3 className="text-lg font-inter font-semibold text-gray-900 mb-6">Resumen Estadístico</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-inter text-blue-700 mb-2">Mantenciones Preventivas</p>
            <p className="text-3xl font-inter font-bold text-blue-900">22</p>
            <p className="text-xs font-inter text-blue-600 mt-1">Este año</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm font-inter text-orange-700 mb-2">Mantenciones Correctivas</p>
            <p className="text-3xl font-inter font-bold text-orange-900">11</p>
            <p className="text-xs font-inter text-orange-600 mt-1">Este año</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-inter text-green-700 mb-2">Tasa de Cumplimiento</p>
            <p className="text-3xl font-inter font-bold text-green-900">92%</p>
            <p className="text-xs font-inter text-green-600 mt-1">Mantenciones a tiempo</p>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-inter text-amber-700 mb-2">Km Total Flota</p>
            <p className="text-3xl font-inter font-bold text-amber-900">2.1M</p>
            <p className="text-xs font-inter text-amber-600 mt-1">Kilómetros recorridos</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
