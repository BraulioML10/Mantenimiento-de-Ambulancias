import { Card } from "./ui/card"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function FleetCharts() {
  const fuelConsumptionData = [
    { day: 'Mon', consumption: 2850000 },
    { day: 'Tue', consumption: 3100000 },
    { day: 'Wed', consumption: 2750000 },
    { day: 'Thu', consumption: 3250000 },
    { day: 'Fri', consumption: 3400000 },
    { day: 'Sat', consumption: 2900000 },
    { day: 'Sun', consumption: 2650000 }
  ]

  const theftAttemptData = [
    { route: 'Lusaka-Ndola', attempts: 8 },
    { route: 'Kitwe-Solwezi', attempts: 5 },
    { route: 'Chipata-Lundazi', attempts: 12 },
    { route: 'Livingstone-Sesheke', attempts: 3 },
    { route: 'Kasama-Mbala', attempts: 7 },
    { route: 'Mongu-Senanga', attempts: 4 }
  ]

  const fleetStatusData = [
    { name: 'Normal', value: 385, color: '#10b981' },
    { name: 'Maintenance', value: 12, color: '#f59e0b' },
    { name: 'Alert', value: 3, color: '#ef4444' }
  ]

  const formatFuelValue = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M L`
  }

  return (
    <div className="grid grid-cols-3 gap-6 mt-6">
      <Card className="bg-white border border-gray-200 p-4 col-span-2">
        <h4 className="text-gray-900 mb-4 font-inter font-semibold">Fuel Consumption - Last 7 Days</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fuelConsumptionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatFuelValue}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [formatFuelValue(value), 'Fuel Consumed']}
            />
            <Line 
              type="monotone" 
              dataKey="consumption" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-white border border-gray-200 p-4">
        <h4 className="text-gray-900 mb-4 font-inter font-semibold">Fleet Status Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={fleetStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {fleetStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#6b7280' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-white border border-gray-200 p-4 col-span-3">
        <h4 className="text-gray-900 mb-4 font-inter font-semibold">Theft Attempts by Route - This Month</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={theftAttemptData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="route" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [value, 'Theft Attempts']}
            />
            <Bar 
              dataKey="attempts" 
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
