import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { Truck, User, MapPin, AlertTriangle, Wrench } from "lucide-react"

interface TruckData {
  id: string
  status: 'normal' | 'alert' | 'maintenance'
  fuelLevel: number
  tankVolume: number
  driverName: string
  location: string
  imageUrl: string
}

export function TruckGrid() {
  const trucks: TruckData[] = [
    {
      id: "ZM-001",
      status: "normal",
      fuelLevel: 85,
      tankVolume: 40000,
      driverName: "Joseph Mwale",
      location: "Lusaka Central",
      imageUrl: "https://images.unsplash.com/photo-1572805991705-5cf7e0c73289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWVsJTIwdGFua2VyJTIwdHJ1Y2slMjB0cmFuc3BvcnR8ZW58MXx8fHwxNzU1NTMzNTUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "ZM-002",
      status: "alert",
      fuelLevel: 25,
      tankVolume: 35000,
      driverName: "Patrick Banda",
      location: "Ndola Highway",
      imageUrl: "https://images.unsplash.com/photo-1695601510327-1553ba5f8bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXRyb2xldW0lMjB0YW5rZXIlMjB0cnVjayUyMGhpZ2h3YXl8ZW58MXx8fHwxNzU1NTMzNTU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "ZM-003",
      status: "maintenance",
      fuelLevel: 92,
      tankVolume: 45000,
      driverName: "Grace Phiri",
      location: "Service Station",
      imageUrl: "https://images.unsplash.com/photo-1744680740445-0dcf900ce2ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvaWwlMjB0YW5rZXIlMjB2ZWhpY2xlJTIwZGVsaXZlcnl8ZW58MXx8fHwxNzU1NTMzNTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "ZM-004",
      status: "normal",
      fuelLevel: 67,
      tankVolume: 38000,
      driverName: "Michael Zulu",
      location: "Livingstone",
      imageUrl: "https://images.unsplash.com/photo-1740957112428-1210d53e93c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWVsJTIwdHJhbnNwb3J0JTIwdHJ1Y2slMjBpbmR1c3RyaWFsfGVufDF8fHx8MTc1NTUzMzU2NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "ZM-005",
      status: "normal",
      fuelLevel: 78,
      tankVolume: 42000,
      driverName: "Sarah Tembo",
      location: "Chipata",
      imageUrl: "https://images.unsplash.com/photo-1708008914410-fc368c747e87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWVzZWwlMjB0YW5rZXIlMjB0cnVjayUyMGNvbW1lcmNpYWx8ZW58MXx8fHwxNzU1NTMzNTY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: "ZM-006",
      status: "normal",
      fuelLevel: 91,
      tankVolume: 40000,
      driverName: "Daniel Sakala",
      location: "Kabwe",
      imageUrl: "https://images.unsplash.com/photo-1572805991705-5cf7e0c73289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWVsJTIwdGFua2VyJTIwdHJ1Y2slMjB0cmFuc3BvcnR8ZW58MXx8fHwxNzU1NTMzNTUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-500" />
      default: return <Truck className="w-4 h-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alert': return 'bg-red-50 text-red-700 border-red-200'
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-green-50 text-green-700 border-green-200'
    }
  }

  const getFuelColor = (level: number) => {
    if (level < 30) return 'bg-red-500'
    if (level < 60) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-inter font-semibold text-gray-900">Active Fuel Tankers</h2>
        <div className="text-sm text-gray-500">Showing 6 of 400 tanker trucks</div>
      </div>
      
      <div className="grid grid-cols-6 gap-4">
        {trucks.map((truck) => (
          <Card key={truck.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
            <div className="p-4">
              {/* Truck Image */}
              <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-gray-100">
                <ImageWithFallback
                  src={truck.imageUrl}
                  alt={`Fuel Tanker ${truck.id}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Truck ID and Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(truck.status)}
                  <span className="font-inter font-medium text-gray-900">{truck.id}</span>
                </div>
                <Badge className={`text-xs font-inter ${getStatusColor(truck.status)}`}>
                  {truck.status === 'normal' ? 'OK' : 
                   truck.status === 'alert' ? 'ALERT' : 'MAINTENANCE'}
                </Badge>
              </div>

              {/* Fuel Level - Main Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-inter font-medium text-gray-700">Fuel Load</span>
                  <span className="text-xs font-inter font-semibold text-gray-900">{truck.fuelLevel}%</span>
                </div>
                
                {/* Large fuel progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getFuelColor(truck.fuelLevel)}`}
                    style={{ width: `${truck.fuelLevel}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {Math.round((truck.fuelLevel / 100) * truck.tankVolume).toLocaleString()}L
                  </span>
                  <span className="text-xs text-gray-500">
                    {truck.tankVolume.toLocaleString()}L
                  </span>
                </div>
              </div>

              {/* Driver */}
              <div className="flex items-center gap-1 mb-2">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-inter text-gray-600">{truck.driverName}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-inter text-gray-600">{truck.location}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
