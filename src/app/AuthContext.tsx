import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "../lib/supabaseClient"

export type UserRole = "Administrador" | "Coordinador" | "Chofer"
export type UserStatus = "Activo" | "Inactivo"

export interface LoggedUser {
  id: string
  userCode: string
  name: string
  username: string
  email: string
  role: UserRole
  status: UserStatus
  lastAccess: string
}

interface AuthContextValue {
  currentUser: LoggedUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const mapUserFromDatabase = (user: any): LoggedUser => ({
  id: user.id,
  userCode: user.user_code,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status,
  lastAccess: user.last_access,
})

const getCurrentAccessText = () => {
  return `Hoy ${new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LoggedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("samu_current_user")

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      return {
        ok: false,
        message: "Debes ingresar nickname y contraseña.",
      }
    }

    const { data, error } = await supabase
      .from("system_users")
      .select("*")
      .eq("username", cleanUsername)
      .single()

    if (error || !data) {
      return {
        ok: false,
        message: "Usuario no encontrado.",
      }
    }

    if (data.status !== "Activo") {
      return {
        ok: false,
        message: "El usuario se encuentra inactivo.",
      }
    }

    if (data.temporary_password !== cleanPassword) {
      return {
        ok: false,
        message: "Contraseña incorrecta.",
      }
    }

    const newLastAccess = getCurrentAccessText()

    const { data: updatedUser } = await supabase
      .from("system_users")
      .update({ last_access: newLastAccess })
      .eq("id", data.id)
      .select()
      .single()

    const loggedUser = mapUserFromDatabase(
      updatedUser || { ...data, last_access: newLastAccess }
    )

    setCurrentUser(loggedUser)
    localStorage.setItem("samu_current_user", JSON.stringify(loggedUser))

    return { ok: true }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("samu_current_user")
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }

  return context
}