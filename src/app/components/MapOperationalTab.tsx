import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  Ambulance,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Satellite,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useAmbulances } from "../AmbulanceContext"

interface AmbulanceLocation {
  id: string
  ambulance_code: string
  ambulance_patente: string | null
  latitude: number
  longitude: number
  speed_kmh: number | null
  heading: number | null
  source: string
  recorded_at: string
}

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export function MapOperationalTab() {
  const { ambulances } = useAmbulances()

  const [locations, setLocations] = useState<AmbulanceLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadLocations = async () => {
    setIsLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("ambulance_locations")
      .select(
        `
        id,
        ambulance_code,
        ambulance_patente,
        latitude,
        longitude,
        speed_kmh,
        heading,
        source,
        recorded_at
      `
      )
      .order("recorded_at", { ascending: false })

    if (error) {
      setError(error.message)
      setLocations([])
      setIsLoading(false)
      return
    }

    setLocations((data || []) as AmbulanceLocation[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const locatedAmbulanceCodes = useMemo(() => {
    return new Set(locations.map((location) => location.ambulance_code))
  }, [locations])

  const ambulancesWithoutLocation = ambulances.filter(
    (ambulance) => !locatedAmbulanceCodes.has(ambulance.id)
  )

  const lastLocation = locations[0]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Mapa operativo
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Visualización de ubicación GPS de ambulancias en la Región de Valparaíso.
          </p>
        </div>

        <Button variant="outline" className="font-inter" onClick={loadLocations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar ubicación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-blue-700">
                Ambulancias con ubicación
              </p>
              <p className="text-3xl font-inter font-bold text-blue-900">
                {locations.length}
              </p>
              <p className="text-xs font-inter text-blue-700">
                Registros GPS activos
              </p>
            </div>

            <MapPin className="w-7 h-7 text-blue-600" />
          </div>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-gray-700">
                Sin ubicación GPS
              </p>
              <p className="text-3xl font-inter font-bold text-gray-900">
                {ambulancesWithoutLocation.length}
              </p>
              <p className="text-xs font-inter text-gray-700">
                Ambulancias sin señal registrada
              </p>
            </div>

            <Satellite className="w-7 h-7 text-gray-600" />
          </div>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-green-700">
                Flota registrada
              </p>
              <p className="text-3xl font-inter font-bold text-green-900">
                {ambulances.length}
              </p>
              <p className="text-xs font-inter text-green-700">
                Unidades en base de datos
              </p>
            </div>

            <Ambulance className="w-7 h-7 text-green-600" />
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-amber-700">
                Última actualización GPS
              </p>
              <p className="text-lg font-inter font-bold text-amber-900 mt-1">
                {lastLocation ? formatDateTime(lastLocation.recorded_at) : "Sin registros"}
              </p>
              <p className="text-xs font-inter text-amber-700">
                Según último dato recibido
              </p>
            </div>

            <Clock className="w-7 h-7 text-amber-600" />
          </div>
        </Card>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="text-sm font-inter text-red-700">
            No fue posible cargar ubicaciones GPS: {error}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="border border-gray-200 overflow-hidden xl:col-span-2">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-inter font-bold text-gray-900">
                  Región de Valparaíso
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Vista base del mapa operativo para unidades con ubicación GPS registrada.
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-[520px] bg-gray-100">
            <iframe
              title="Mapa operativo Región de Valparaíso"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-72.25%2C-33.45%2C-70.00%2C-31.70&layer=mapnik"
              className="w-full h-full border-0"
            />

            {locations.length === 0 && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Satellite className="w-8 h-8 text-gray-600" />
                  </div>

                  <h3 className="text-lg font-inter font-bold text-gray-900">
                    Sin ubicaciones GPS registradas
                  </h3>

                  <p className="text-sm font-inter text-gray-600 mt-2">
                    Las unidades aparecerán en el mapa cuando existan coordenadas registradas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Últimas ubicaciones
            </h2>
          </div>

          {isLoading ? (
            <p className="text-sm font-inter text-gray-500">
              Cargando ubicaciones...
            </p>
          ) : locations.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-inter font-semibold text-gray-700">
                No hay móviles con ubicación GPS.
              </p>
              <p className="text-sm font-inter text-gray-500 mt-1">
                Sin ubicaciones GPS registradas para mostrar.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-inter font-bold text-gray-900">
                        {location.ambulance_code}
                      </p>

                      <p className="text-xs font-inter text-gray-500">
                        {location.ambulance_patente || "Sin patente registrada"}
                      </p>
                    </div>

                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-inter">
                      {location.source}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-xs font-inter text-gray-600">
                    <p>Latitud: {location.latitude}</p>
                    <p>Longitud: {location.longitude}</p>
                    <p>
                      Velocidad:{" "}
                      {location.speed_kmh !== null
                        ? `${location.speed_kmh} km/h`
                        : "Sin dato"}
                    </p>
                    <p>Registrado: {formatDateTime(location.recorded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>


    </div>
  )
}
