import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Truck, MapPin, AlertCircle, Wrench } from "lucide-react"

interface TruckPosition {
  id: string
  lat: number
  lng: number
  status: 'normal' | 'theft' | 'maintenance'
  fuelLevel: number
  destination: string
}

export function MapView() {
  const trucks: TruckPosition[] = [
    { id: "ZM-001", lat: -15.3875, lng: 28.3228, status: 'normal', fuelLevel: 85, destination: "Lusaka" },
    { id: "ZM-002", lat: -12.9767, lng: 28.6390, status: 'theft', fuelLevel: 45, destination: "Ndola" },
    { id: "ZM-003", lat: -13.1339, lng: 27.8493, status: 'maintenance', fuelLevel: 92, destination: "Kitwe" },
    { id: "ZM-004", lat: -16.1496, lng: 27.8493, status: 'normal', fuelLevel: 67, destination: "Livingstone" },
    { id: "ZM-005", lat: -14.5186, lng: 30.4031, status: 'normal', fuelLevel: 78, destination: "Chipata" },
    { id: "ZM-006", lat: -13.4646, lng: 28.1826, status: 'normal', fuelLevel: 91, destination: "Kabwe" },
    { id: "ZM-007", lat: -11.8406, lng: 27.4138, status: 'theft', fuelLevel: 23, destination: "Kasama" },
    { id: "ZM-008", lat: -15.7749, lng: 26.7201, status: 'maintenance', fuelLevel: 56, destination: "Mongu" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'theft': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-500" />
      default: return <Truck className="w-4 h-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'theft': return 'bg-red-500'
      case 'maintenance': return 'bg-amber-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className="flex-1 mr-6">
      <Card className="h-[600px] bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-inter font-semibold">Live Fleet Tracking - Zambia</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 text-sm font-inter">Normal (385)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-gray-600 text-sm font-inter">Maintenance (12)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600 text-sm font-inter">Alert (3)</span>
            </div>
          </div>
        </div>
        
        <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <div className="absolute inset-4 border-2 border-gray-300 rounded-lg bg-gray-100">
            <svg className="w-full h-full opacity-30" viewBox="0 0 400 300">
              <path
                d="M50 80 L350 80 L340 120 L320 160 L280 200 L200 220 L120 200 L80 160 L60 120 Z"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              />
            </svg>
            
            {trucks.map((truck, index) => (
              <div
                key={truck.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${20 + (index % 3) * 30 + Math.random() * 20}%`,
                  top: `${20 + Math.floor(index / 3) * 25 + Math.random() * 15}%`
                }}
              >
                <div className={`w-4 h-4 ${getStatusColor(truck.status)} rounded-full flex items-center justify-center pulse`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[200px] shadow-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(truck.status)}
                    <span className="font-inter font-medium">{truck.id}</span>
                  </div>
                  <p className="text-sm font-inter">Fuel: {truck.fuelLevel}%</p>
                  <p className="text-sm font-inter">Destination: {truck.destination}</p>
                  <Badge className={`text-xs mt-1 font-inter ${
                    truck.status === 'theft' ? 'bg-red-100 text-red-700 border-red-200' : 
                    truck.status === 'maintenance' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {truck.status === 'theft' ? 'THEFT' : 
                     truck.status === 'maintenance' ? 'MAINTENANCE' : 'NORMAL'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <path
              d="M100 150 Q200 100 300 200"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            <path
              d="M150 100 Q250 150 350 180"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
        
        <style>{`
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </Card>
    </div>
  )
}
