import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { MapPin, Clock, Fuel } from "lucide-react"

export function TruckPhotosPanel() {
  const truckPhotos = [
    {
      id: "ZM-157-TK",
      imageUrl: "https://images.unsplash.com/photo-1572805991705-5cf7e0c73289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWVsJTIwdGFua2VyJTIwdHJ1Y2slMjB0cmFuc3BvcnR8ZW58MXx8fHwxNzU1NTMzNTUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      location: "Lusaka-Ndola Highway",
      status: "In Transit",
      fuelLevel: 78,
      eta: "2h 15m"
    },
    {
      id: "ZM-298-TK",
      imageUrl: "https://images.unsplash.com/photo-1695601510327-1553ba5f8bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXRyb2xldW0lMjB0YW5rZXIlMjB0cnVjayUyMGhpZ2h3YXl8ZW58MXx8fHwxNzU1NTMzNTU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      location: "Kitwe Industrial Zone",
      status: "Unloading",
      fuelLevel: 92,
      eta: "Complete"
    },
    {
      id: "ZM-334-TK",
      imageUrl: "https://images.unsplash.com/photo-1744680740445-0dcf900ce2ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvaWwlMjB0YW5rZXIlMjB2ZWhpY2xlJTIwZGVsaXZlcnl8ZW58MXx8fHwxNzU1NTMzNTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      location: "Chipata Border Crossing",
      status: "Border Check",
      fuelLevel: 85,
      eta: "45m"
    }
  ]

  return (
    <Card className="bg-white border border-gray-200 p-6 mt-6">
      <h3 className="text-gray-900 font-inter font-semibold mb-4">Live Tanker Feed</h3>
      <div className="grid grid-cols-3 gap-6">
        {truckPhotos.map((truck) => (
          <div key={truck.id} className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <ImageWithFallback
                src={truck.imageUrl}
                alt={`Fuel tanker ${truck.id}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with truck info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-inter font-medium">{truck.id}</span>
                    <Badge className="bg-blue-600 text-white text-xs font-inter">
                      {truck.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-slate-200 font-inter">{truck.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-200 font-inter">{truck.fuelLevel}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-slate-200 font-inter">{truck.eta}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
