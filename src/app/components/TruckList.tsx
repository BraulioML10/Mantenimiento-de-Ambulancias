import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import { Progress } from "./ui/progress"
import { Truck, User, Clock, Droplets, AlertTriangle, Wrench } from "lucide-react"

interface TruckData {
  id: string
  status: 'normal' | 'theft' | 'maintenance'
  fuelLevel: number
  tankVolume: number
  destination: string
  driverName: string
  eta: string
  location: string
}

export function TruckList() {
  const trucks: TruckData[] = [
    {
      id: "ZM-001-TK",
      status: "normal",
      fuelLevel: 85,
      tankVolume: 40000,
      destination: "Lusaka Central",
      driverName: "Joseph Mwale",
      eta: "14:30",
      location: "N1 Highway"
    },
    {
      id: "ZM-002-TK",
      status: "theft",
      fuelLevel: 45,
      tankVolume: 35000,
      destination: "Ndola Mine",
      driverName: "Patrick Banda",
      eta: "16:15",
      location: "M8 Route"
    },
    {
      id: "ZM-003-TK",
      status: "maintenance",
      fuelLevel: 92,
      tankVolume: 45000,
      destination: "Kitwe Industrial",
      driverName: "Grace Phiri",
      eta: "18:45",
      location: "Service Station"
    },
    {
      id: "ZM-004-TK",
      status: "normal",
      fuelLevel: 67,
      tankVolume: 38000,
      destination: "Livingstone Tourism",
      driverName: "Michael Zulu",
      eta: "12:20",
      location: "A1 Highway"
    },
    {
      id: "ZM-005-TK",
      status: "normal",
      fuelLevel: 78,
      tankVolume: 42000,
      destination: "Chipata Border",
      driverName: "Sarah Tembo",
      eta: "15:10",
      location: "Eastern Province"
    },
    {
      id: "ZM-006-TK",
      status: "normal",
      fuelLevel: 91,
      tankVolume: 40000,
      destination: "Kabwe Center",
      driverName: "Daniel Sakala",
      eta: "13:40",
      location: "Central Province"
    },
    {
      id: "ZM-007-TK",
      status: "theft",
      fuelLevel: 23,
      tankVolume: 35000,
      destination: "Kasama District",
      driverName: "Mary Chilufya",
      eta: "17:25",
      location: "Northern Route"
    },
    {
      id: "ZM-008-TK",
      status: "maintenance",
      fuelLevel: 56,
      tankVolume: 38000,
      destination: "Mongu Terminal",
      driverName: "Peter Liuwa",
      eta: "19:00",
      location: "Western Province"
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'theft': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-500" />
      default: return <Truck className="w-4 h-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'theft': return 'bg-red-50 text-red-700 border-red-200'
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-green-50 text-green-700 border-green-200'
    }
  }

  return (
    <div className="w-96">
      <Card className="h-[600px] bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-gray-900 font-inter font-semibold">Live Fleet Status</h3>
          <p className="text-gray-600 text-sm font-inter">400 active trucks</p>
        </div>
        
        <ScrollArea className="h-[536px]">
          <div className="p-4 space-y-4">
            {trucks.map((truck) => (
              <div key={truck.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(truck.status)}
                    <span className="text-gray-900 font-inter font-medium">{truck.id}</span>
                  </div>
                  <Badge className={`text-xs font-inter ${getStatusColor(truck.status)}`}>
                    {truck.status === 'theft' ? 'THEFT' : 
                     truck.status === 'maintenance' ? 'MAINTENANCE' : 'NORMAL'}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-gray-600 font-inter">Fuel Level</span>
                    </div>
                    <span className="text-xs text-gray-900 font-inter font-medium">{truck.fuelLevel}%</span>
                  </div>
                  <Progress 
                    value={truck.fuelLevel} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 font-inter">
                    <span>{Math.round((truck.fuelLevel / 100) * truck.tankVolume).toLocaleString()}L</span>
                    <span>{truck.tankVolume.toLocaleString()}L</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600 font-inter">{truck.driverName}</span>
                </div>
                
                <div className="text-xs text-gray-600 mb-2 font-inter">
                  <span className="text-gray-500">Destination:</span> {truck.destination}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-gray-600 font-inter">ETA: {truck.eta}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-inter">{truck.location}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
