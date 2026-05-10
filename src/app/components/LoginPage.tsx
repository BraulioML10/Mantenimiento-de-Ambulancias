import { useState } from "react"
import { Ambulance, Lock, LogIn, User } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { useAuth } from "../AuthContext"

export function LoginPage() {
  const { login } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberSession, setRememberSession] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await login(username, password, rememberSession)

    if (!result.ok) {
      setError(result.message || "No fue posible iniciar sesión.")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-5xl overflow-hidden border border-gray-200 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-red-600 p-8 text-white flex flex-col justify-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <Ambulance className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-3xl font-inter font-bold">
                Gestión de Mantenimiento Preventivo SAMU - SSVQ
              </h1>

              <p className="text-sm font-inter text-red-50 mt-4 leading-6">
                Acceso al sistema de administración de ambulancias, control de
                kilometraje, usuarios, formularios y registros operativos.
              </p>
            </div>
          </div>

          <div className="p-8 bg-white">
            <div className="mb-6">
              <h2 className="text-2xl font-inter font-bold text-gray-900">
                Iniciar sesión
              </h2>

              <p className="text-sm font-inter text-gray-600 mt-1">
                Ingresa con tu nickname y contraseña asignada.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-inter text-gray-700">
                  Nickname
                </label>

                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Ej: juan.perez"
                    className="pl-10 font-inter"
                  />
                </div>

                <p className="text-xs font-inter text-gray-500 mt-1">
                  Utiliza el formato nombre.apellido.
                </p>
              </div>

              <div>
                <label className="text-sm font-inter text-gray-700">
                  Contraseña
                </label>

                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="pl-10 font-inter"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-inter text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Permanecer conectado en este dispositivo
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-inter text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-inter"
                disabled={isSubmitting}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isSubmitting ? "Validando..." : "Entrar al sistema"}
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}