import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Fuel, 
  Gauge, 
  Navigation, 
  AlertTriangle, 
  Settings, 
  Calendar,
  Route,
  Shield,
  Droplets,
  Zap,
  Wrench,
  CheckCircle,
  XCircle
} from "lucide-react"

interface TruckDetailProps {
  truckId: string
  onBack: () => void
}

interface TruckDetailData {
  id: string
  model: string
  year: number
  licensePlate: string
  status: 'normal' | 'geofence_violation' | 'unexpected_stop' | 'route_deviation' | 'maintenance'
  riskLevel: 'low' | 'medium' | 'high'
  fuelLevel: number
  fuelCapacity: number
  currentLocation: string
  destination: string
  estimatedArrival: string
  speed: number
  mileage: number
  driverName: string
  driverPhone: string
  driverLicense: string
  lastMaintenance: string
  nextMaintenance: string
  engineHours: number
  alerts: string[]
  routeHistory: Array<{
    location: string
    timestamp: string
    event: string
  }>
  technicalStatus: {
    engine: 'good' | 'warning' | 'critical'
    brakes: 'good' | 'warning' | 'critical'
    tires: 'good' | 'warning' | 'critical'
    lights: 'good' | 'warning' | 'critical'
  }
}

export function TruckDetailView({ truckId, onBack }: TruckDetailProps) {
  // Mock data - в реальном приложении это будет из API
  const truckData: TruckDetailData = {
    id: truckId,
    model: "Volvo FH16 750",
    year: 2022,
    licensePlate: "ZM-2024-FT",
    status: truckId.includes('002') ? 'geofence_violation' : 
           truckId.includes('003') ? 'unexpected_stop' :
           truckId.includes('004') ? 'route_deviation' : 'normal',
    riskLevel: truckId.includes('002') || truckId.includes('003') ? 'high' : 
               truckId.includes('004') ? 'medium' : 'low',
    fuelLevel: truckId.includes('002') ? 25 : 
               truckId.includes('006') ? 15 : 
               truckId.includes('001') ? 85 : 67,
    fuelCapacity: 40000,
    currentLocation: truckId.includes('002') ? "Off-route - Kabwe (15km deviation)" :
                    truckId.includes('003') ? "Rural Area - Ndola (Unscheduled stop)" :
                    "Lusaka Highway - Main Route",
    destination: "Chipata Border Crossing",
    estimatedArrival: "14:30 (2h 15min)",
    speed: truckId.includes('003') ? 0 : 75,
    mileage: 156420,
    driverName: truckId.includes('002') ? "Patrick Banda" : 
                truckId.includes('003') ? "Grace Phiri" : "Joseph Mwale",
    driverPhone: "+260 97 123 4567",
    driverLicense: "ZM-CDL-789456",
    lastMaintenance: "2024-12-10",
    nextMaintenance: "2025-02-10",
    engineHours: 12456,
    alerts: truckId.includes('002') ? ["Geofence violation", "High fuel consumption"] :
            truckId.includes('003') ? ["Unexpected stop", "Engine idle time exceeded"] :
            truckId.includes('006') ? ["Critical fuel level"] : [],
    routeHistory: [
      { location: "Lusaka Depot", timestamp: "08:30", event: "Departure" },
      { location: "Kabwe Checkpoint", timestamp: "10:15", event: "Passed" },
      { location: "Current Location", timestamp: "12:25", event: "Location Update" }
    ],
    technicalStatus: {
      engine: truckId.includes('006') ? 'warning' : 'good',
      brakes: 'good',
      tires: truckId.includes('004') ? 'warning' : 'good', 
      lights: 'good'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'geofence_violation':
      case 'unexpected_stop':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'route_deviation':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'maintenance':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200'
      default: return 'bg-green-50 text-green-600 border-green-200'
    }
  }

  const getTechnicalStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="font-inter"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fleet
        </Button>
        <div>
          <h1 className="text-2xl font-inter font-semibold text-gray-900">{truckData.id}</h1>
          <p className="text-sm font-inter text-gray-600">{truckData.model} • {truckData.licensePlate}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <Badge className={`font-inter ${getStatusColor(truckData.status)}`}>
            {truckData.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={`font-inter ${getRiskColor(truckData.riskLevel)}`}>
            {truckData.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>
      </div>

      {/* Alert Banner */}
      {truckData.alerts.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-inter font-semibold text-red-900">Active Alerts</p>
              <div className="space-y-1">
                {truckData.alerts.map((alert, index) => (
                  <p key={index} className="text-sm font-inter text-red-700">• {alert}</p>
                ))}
              </div>
            </div>
            <Button size="sm" variant="destructive" className="ml-auto font-inter">
              Take Action
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Status & Location */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Current Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-inter font-medium text-gray-700">Current Location</p>
                  <p className="text-sm font-inter text-gray-900">{truckData.currentLocation}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-inter font-medium text-gray-700">Destination</p>
                  <p className="text-sm font-inter text-gray-900">{truckData.destination}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-inter font-medium text-gray-700">ETA</p>
                  <p className="text-sm font-inter text-gray-900">{truckData.estimatedArrival}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-inter font-medium text-gray-700">Current Speed</p>
                  <p className="text-sm font-inter text-gray-900">{truckData.speed} km/h</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Driver Information */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Driver Information</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-inter font-medium text-gray-900">{truckData.driverName}</p>
                <p className="text-sm font-inter text-gray-600">Licensed Driver</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-inter text-gray-600">{truckData.driverPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-inter text-gray-600">{truckData.driverLicense}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4 font-inter">
              <Phone className="w-4 h-4 mr-2" />
              Contact Driver
            </Button>
          </Card>

          {/* Route History */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Route History</h3>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {truckData.routeHistory.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-inter font-medium text-gray-900">{entry.location}</p>
                      <p className="text-xs font-inter text-gray-500">{entry.timestamp} - {entry.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Middle Column - Fuel & Performance */}
        <div className="space-y-6">
          {/* Fuel Status */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Fuel Status</h3>
            <div className="text-center mb-4">
              <div className="w-24 h-24 mx-auto relative">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={truckData.fuelLevel < 20 ? "#ef4444" : truckData.fuelLevel < 40 ? "#f59e0b" : "#10b981"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - truckData.fuelLevel / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-inter font-bold text-gray-900">{truckData.fuelLevel}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm font-inter">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Level:</span>
                <span className="text-gray-900">{Math.round(truckData.fuelLevel / 100 * truckData.fuelCapacity).toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tank Capacity:</span>
                <span className="text-gray-900">{truckData.fuelCapacity.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Range:</span>
                <span className="text-gray-900">
                  {Math.round((truckData.fuelLevel / 100 * truckData.fuelCapacity) / 28 * 100)} km
                </span>
              </div>
            </div>
            {truckData.fuelLevel < 20 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-inter font-medium text-red-700">Critical Fuel Level</span>
                </div>
                <p className="text-xs font-inter text-red-600 mt-1">Immediate refueling required</p>
              </div>
            )}
          </Card>

          {/* Vehicle Info */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Vehicle Information</h3>
            <div className="space-y-3 text-sm font-inter">
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="text-gray-900">{truckData.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="text-gray-900">{truckData.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License Plate:</span>
                <span className="text-gray-900">{truckData.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mileage:</span>
                <span className="text-gray-900">{truckData.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Engine Hours:</span>
                <span className="text-gray-900">{truckData.engineHours.toLocaleString()} h</span>
              </div>
            </div>
          </Card>

          {/* Maintenance */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Maintenance</h3>
            <div className="space-y-3 text-sm font-inter">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Service:</span>
                <span className="text-gray-900">{truckData.lastMaintenance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Next Service:</span>
                <span className="text-gray-900">{truckData.nextMaintenance}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4 font-inter">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </Card>
        </div>

        {/* Right Column - Technical Status & Map */}
        <div className="space-y-6">
          {/* Technical Status */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Technical Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-inter text-gray-700">Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTechnicalStatusIcon(truckData.technicalStatus.engine)}
                  <span className="text-sm font-inter capitalize">{truckData.technicalStatus.engine}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-inter text-gray-700">Brakes</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTechnicalStatusIcon(truckData.technicalStatus.brakes)}
                  <span className="text-sm font-inter capitalize">{truckData.technicalStatus.brakes}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-inter text-gray-700">Tires</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTechnicalStatusIcon(truckData.technicalStatus.tires)}
                  <span className="text-sm font-inter capitalize">{truckData.technicalStatus.tires}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-inter text-gray-700">Lights</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTechnicalStatusIcon(truckData.technicalStatus.lights)}
                  <span className="text-sm font-inter capitalize">{truckData.technicalStatus.lights}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Live Map */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Live Location</h3>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-inter">Live GPS Tracking</p>
                <p className="text-sm text-gray-500 font-inter">Real-time location: {truckData.currentLocation}</p>
                <Button size="sm" variant="outline" className="mt-3 font-inter">
                  View Full Map
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-inter font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full font-inter">
                <Phone className="w-4 h-4 mr-2" />
                Contact Driver
              </Button>
              <Button variant="outline" className="w-full font-inter">
                <Route className="w-4 h-4 mr-2" />
                Update Route
              </Button>
              <Button variant="outline" className="w-full font-inter">
                <Settings className="w-4 h-4 mr-2" />
                Vehicle Settings
              </Button>
              <Button variant="destructive" className="w-full font-inter">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Stop
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
