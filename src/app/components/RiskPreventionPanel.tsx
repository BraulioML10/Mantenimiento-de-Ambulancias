import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { AlertTriangle, Shield, MapPin, Clock, Phone, Navigation, Zap } from "lucide-react"

interface RiskAlert {
  id: string
  truckId: string
  type: 'geofence_violation' | 'unexpected_stop' | 'route_deviation' | 'speed_violation' | 'fuel_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  location: string
  timestamp: string
  duration?: string
  actionRequired: boolean
  driverName: string
  expectedLocation?: string
}

export function RiskPreventionPanel() {
  const alerts: RiskAlert[] = [
    {
      id: "ALT-001",
      truckId: "ZM-002",
      type: "geofence_violation",
      severity: "critical",
      message: "Vehicle left authorized delivery zone without clearance",
      location: "15km off-route near Kabwe",
      timestamp: "5 min ago",
      duration: "12 minutes",
      actionRequired: true,
      driverName: "Patrick Banda",
      expectedLocation: "Main Highway Route"
    },
    {
      id: "ALT-002", 
      truckId: "ZM-003",
      type: "unexpected_stop",
      severity: "high",
      message: "Unscheduled stop in remote area - possible theft risk",
      location: "Rural Road, 45km from Ndola",
      timestamp: "12 min ago",
      duration: "18 minutes",
      actionRequired: true,
      driverName: "Grace Phiri"
    },
    {
      id: "ALT-003",
      truckId: "ZM-007",
      type: "route_deviation",
      severity: "medium", 
      message: "Vehicle deviated from planned route",
      location: "Alternative Highway B",
      timestamp: "8 min ago",
      actionRequired: false,
      driverName: "Mary Chilufya",
      expectedLocation: "Main Highway A"
    },
    {
      id: "ALT-004",
      truckId: "ZM-010",
      type: "fuel_anomaly",
      severity: "high",
      message: "Fuel level dropped unexpectedly fast - possible leak or theft",
      location: "En route to Chipata",
      timestamp: "15 min ago",
      actionRequired: true,
      driverName: "James Mulenga"
    }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'geofence_violation': return <Shield className="w-5 h-5 text-red-500" />
      case 'unexpected_stop': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'route_deviation': return <Navigation className="w-5 h-5 text-amber-500" />
      case 'fuel_anomaly': return <Zap className="w-5 h-5 text-red-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'geofence_violation': return 'GEOFENCE VIOLATION'
      case 'unexpected_stop': return 'UNEXPECTED STOP'
      case 'route_deviation': return 'ROUTE DEVIATION'
      case 'fuel_anomaly': return 'FUEL ANOMALY'
      default: return 'ALERT'
    }
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const highAlerts = alerts.filter(alert => alert.severity === 'high')

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="p-4 bg-red-100 border-red-300 border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-inter font-semibold text-red-900">🚨 CRITICAL SECURITY ALERT</p>
                <p className="text-sm font-inter text-red-700">{criticalAlerts.length} vehicle(s) require immediate attention</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="font-inter">
              <Phone className="w-4 h-4 mr-2" />
              Contact Control Center
            </Button>
          </div>
        </Card>
      )}

      {/* Active Alerts List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-inter font-semibold text-gray-900">Risk Prevention Alerts</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-inter">
              Filter
            </Button>
            <Button variant="outline" size="sm" className="font-inter">
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className={`border rounded-lg p-4 ${
              alert.severity === 'critical' ? 'border-red-200 bg-red-50' : 
              alert.severity === 'high' ? 'border-red-100 bg-red-25' : 
              alert.severity === 'medium' ? 'border-amber-100 bg-amber-25' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`text-xs font-inter ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-inter">
                        {getAlertTypeLabel(alert.type)}
                      </Badge>
                      <span className="font-inter font-medium text-gray-900">{alert.truckId}</span>
                    </div>
                    
                    <p className="font-inter text-gray-900 mb-2">{alert.message}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm font-inter text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Location: {alert.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Time: {alert.timestamp}</span>
                      </div>
                      {alert.expectedLocation && (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>Expected: {alert.expectedLocation}</span>
                        </div>
                      )}
                      {alert.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Duration: {alert.duration}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm font-inter text-gray-600 mt-2">
                      Driver: {alert.driverName}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {alert.actionRequired && (
                    <Button size="sm" variant="destructive" className="font-inter">
                      Take Action
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="font-inter">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Prevention Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-inter font-bold text-gray-900">7</p>
            <p className="text-sm font-inter text-gray-600">Prevented Thefts</p>
            <p className="text-xs font-inter text-green-600">This month</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Navigation className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-inter font-bold text-gray-900">23</p>
            <p className="text-sm font-inter text-gray-600">Route Violations</p>
            <p className="text-xs font-inter text-amber-600">Detected</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-inter font-bold text-gray-900">98.2%</p>
            <p className="text-sm font-inter text-gray-600">Geofence Compliance</p>
            <p className="text-xs font-inter text-green-600">Above target</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-inter font-bold text-gray-900">2.1min</p>
            <p className="text-sm font-inter text-gray-600">Avg Response Time</p>
            <p className="text-xs font-inter text-green-600">Fast response</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
