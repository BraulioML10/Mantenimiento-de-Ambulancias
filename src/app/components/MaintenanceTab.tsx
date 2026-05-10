import { Card } from "./ui/card"
import { Wrench } from "lucide-react"

export function MaintenanceTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-inter font-bold text-gray-900">
          Mantenimientos
        </h1>
        <p className="text-sm font-inter text-gray-600">
          Apartado destinado a la gestión de mantenimientos de ambulancias.
        </p>
      </div>

      <Card className="p-6 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6 text-gray-700" />
          </div>

          <div>
            <h2 className="text-lg font-inter font-bold text-gray-900">
              Sección de mantenimientos
            </h2>
            <p className="text-sm font-inter text-gray-600 mt-1">
              Este apartado queda habilitado para organizar posteriormente los registros asociados a mantenimientos preventivos y correctivos.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}