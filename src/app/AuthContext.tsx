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
  lastAccess: string | null
}

interface AuthContextValue {
  currentUser: LoggedUser | null
  isLoading: boolean
  login: (
    username: string,
    password: string,
    rememberSession: boolean
  ) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SESSION_KEY = "samu_current_user"
const REMEMBER_KEY = "samu_remember_session"

const mapUserFromDatabase = (user: any): LoggedUser => ({
  id: user.id,
  userCode: user.user_code,
  name: user.name,
  username: user.username,
  email: user.email || "",
  role: user.role,
  status: user.status,
  lastAccess: user.last_access,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LoggedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedLocalUser = localStorage.getItem(SESSION_KEY)
    const storedSessionUser = sessionStorage.getItem(SESSION_KEY)

    if (storedLocalUser) {
      setCurrentUser(JSON.parse(storedLocalUser))
      setIsLoading(false)
      return
    }

    if (storedSessionUser) {
      setCurrentUser(JSON.parse(storedSessionUser))
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }, [])

  const login = async (
    username: string,
    password: string,
    rememberSession: boolean
  ) => {
    const cleanUsername = username.trim()
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
      .ilike("username", cleanUsername)
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

    const newLastAccess = new Date().toISOString()

    const { data: updatedUser } = await supabase
      .from("system_users")
      .update({ last_access: newLastAccess })
      .eq("id", data.id)
      .select()
      .single()

    const loggedUser = mapUserFromDatabase(
      updatedUser || {
        ...data,
        last_access: newLastAccess,
      }
    )

    setCurrentUser(loggedUser)

    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(SESSION_KEY)

    if (rememberSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser))
      localStorage.setItem(REMEMBER_KEY, "true")
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser))
    }

    return { ok: true }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(SESSION_KEY)
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
