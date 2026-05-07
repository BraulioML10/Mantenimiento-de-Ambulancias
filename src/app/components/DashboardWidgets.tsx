import { Card } from "./ui/card"
import { TrendingUp, AlertTriangle, DollarSign, Truck } from "lucide-react"

interface WidgetProps {
  title: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: React.ReactNode
  color: string
}

function Widget({ title, value, trend, trendUp, icon, color }: WidgetProps) {
  return (
    <Card className={`p-6 bg-white border border-gray-200 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-inter">{title}</p>
          <p className="text-3xl text-gray-900 mt-1 font-inter font-semibold">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm font-inter ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <Widget
        title="Total Fuel in Transit"
        value="2,847,320L"
        trend="+5.2%"
        trendUp={true}
        icon={<Truck className="w-8 h-8" />}
        color="border-l-4 border-l-blue-500"
      />
      <Widget
        title="Theft Incidents Today"
        value="3"
        trend="-12.3%"
        trendUp={false}
        icon={<AlertTriangle className="w-8 h-8" />}
        color="border-l-4 border-l-red-500"
      />
      <Widget
        title="Cost Savings (USD)"
        value="$48,291"
        trend="+18.7%"
        trendUp={true}
        icon={<DollarSign className="w-8 h-8" />}
        color="border-l-4 border-l-green-500"
      />
      <Widget
        title="Active Alerts"
        value="27"
        trend="+3.1%"
        trendUp={true}
        icon={<AlertTriangle className="w-8 h-8" />}
        color="border-l-4 border-l-amber-500"
      />
    </div>
  )
}
