import { useEffect, useMemo, useState } from "react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  AlertTriangle,
  Edit,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { useAuth } from "../AuthContext"

type UserRole = "Administrador" | "Coordinador" | "Chofer"
type UserStatus = "Activo" | "Inactivo"

interface SystemUser {
  id: string
  userCode: string
  name: string
  username: string
  email: string
  role: UserRole
  status: UserStatus
  temporaryPassword: string
  lastAccess: string | null
}

interface DbSystemUser {
  id: string
  user_code: string
  name: string
  username: string
  email: string | null
  role: UserRole
  status: UserStatus
  temporary_password: string
  last_access: string | null
}

interface UserForm {
  originalId: string
  userCode: string
  name: string
  username: string
  email: string
  role: UserRole
  status: UserStatus
  temporaryPassword: string
}

interface PendingUserChange {
  type: "crear" | "editar" | "eliminar" | "restablecer"
  original?: SystemUser
  updated?: SystemUser
  changes: string[]
}

const emptyUserForm: UserForm = {
  originalId: "",
  userCode: "",
  name: "",
  username: "",
  email: "",
  role: "Chofer",
  status: "Activo",
  temporaryPassword: "",
}

const roleBadgeClass: Record<UserRole, string> = {
  Administrador: "bg-red-100 text-red-700 border-red-200",
  Coordinador: "bg-blue-100 text-blue-700 border-blue-200",
  Chofer: "bg-green-100 text-green-700 border-green-200",
}

const statusBadgeClass: Record<UserStatus, string> = {
  Activo: "bg-green-100 text-green-700 border-green-200",
  Inactivo: "bg-gray-100 text-gray-700 border-gray-200",
}

const roleOrder: Record<UserRole, number> = {
  Administrador: 1,
  Coordinador: 2,
  Chofer: 3,
}

const userSelect = `
  id,
  user_code,
  name,
  username,
  email,
  role,
  status,
  temporary_password,
  last_access
`

const mapFromDatabase = (user: DbSystemUser): SystemUser => ({
  id: user.id,
  userCode: user.user_code,
  name: user.name,
  username: user.username,
  email: user.email || "",
  role: user.role,
  status: user.status,
  temporaryPassword: user.temporary_password,
  lastAccess: user.last_access,
})

const mapToDatabase = (user: SystemUser) => {
  const cleanEmail = user.email.trim().toLowerCase()

  return {
    user_code: user.userCode,
    name: user.name.trim(),
    username: user.username.trim(),
    email: cleanEmail || null,
    role: user.role,
    status: user.status,
    temporary_password: user.temporaryPassword.trim(),
    last_access:
      user.lastAccess && user.lastAccess !== "Sin ingreso registrado"
        ? user.lastAccess
        : null,
  }
}

const getCurrentAccessValue = () => new Date().toISOString()

const formatLastAccess = (value: string | null) => {
  if (!value) return "Sin ingreso registrado"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Sin ingreso registrado"

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export function AlertsTab() {
  const { currentUser } = useAuth()

  const [users, setUsers] = useState<SystemUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "todos">("todos")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "todos">("todos")
  const [editingForm, setEditingForm] = useState<UserForm | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingChange, setPendingChange] = useState<PendingUserChange | null>(
    null
  )

  const isProtectedAdmin = (user: {
    username?: string
    userCode?: string
    name?: string
  }) => {
    return (
      user.username === "admin.general" ||
      user.userCode === "USR-001" ||
      user.name === "Administrador General"
    )
  }

  const canModifyUser = (user: {
    username?: string
    userCode?: string
    name?: string
  }) => {
    if (!isProtectedAdmin(user)) return true

    return currentUser?.username === "admin.general"
  }

  const loadUsers = async () => {
    setIsLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("system_users")
      .select(userSelect)
      .order("user_code", { ascending: true })

    if (error) {
      setError(error.message)
      setUsers([])
      setIsLoading(false)
      return
    }

    setUsers((data || []).map(mapFromDatabase))
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const activeUsers = users.filter((user) => user.status === "Activo")
  const inactiveUsers = users.filter((user) => user.status === "Inactivo")
  const adminUsers = users.filter((user) => user.role === "Administrador")
  const coordinatorUsers = users.filter((user) => user.role === "Coordinador")
  const driverUsers = users.filter((user) => user.role === "Chofer")

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return users
      .filter((user) => {
      const emailText = user.email || "sin correo registrado"

      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        emailText.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.status.toLowerCase().includes(term) ||
        user.userCode.toLowerCase().includes(term)

      const matchesRole = roleFilter === "todos" || user.role === roleFilter
      const matchesStatus =
        statusFilter === "todos" || user.status === statusFilter

        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((a, b) => {
        const roleDifference = roleOrder[a.role] - roleOrder[b.role]

        if (roleDifference !== 0) return roleDifference

        return a.name.localeCompare(b.name, "es-CL", { sensitivity: "base" })
      })
  }, [users, searchTerm, roleFilter, statusFilter])

  const generateUserCode = () => {
    const existingNumbers = users
      .map((user) => Number(user.userCode.replace("USR-", "")))
      .filter((number) => !Number.isNaN(number))

    const nextNumber = Math.max(...existingNumbers, 0) + 1

    return `USR-${String(nextNumber).padStart(3, "0")}`
  }

  const buildPasswordFromUsername = (username: string) => {
    return `${username.trim()}123`
  }

  const iniciarCreacion = () => {
    const userCode = generateUserCode()

    setIsCreating(true)
    setPendingChange(null)
    setEditingForm({
      ...emptyUserForm,
      userCode,
    })
  }

  const iniciarEdicion = (user: SystemUser) => {
    if (!canModifyUser(user)) {
      window.alert(
        "El perfil Administrador General solo puede ser editado por el propio admin.general."
      )
      return
    }

    setIsCreating(false)
    setPendingChange(null)
    setEditingForm({
      originalId: user.id,
      userCode: user.userCode,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      temporaryPassword: user.temporaryPassword,
    })
  }

  const crearUsuarioDesdeFormulario = (form: UserForm): SystemUser => {
    return {
      id: isCreating ? "" : form.originalId,
      userCode: form.userCode,
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      status: form.status,
      temporaryPassword: form.temporaryPassword.trim(),
      lastAccess: isCreating ? null : getCurrentAccessValue(),
    }
  }

  const guardarFormulario = async () => {
    if (!editingForm) return

    if (
      !editingForm.name.trim() ||
      !editingForm.username.trim() ||
      !editingForm.temporaryPassword.trim()
    ) {
      window.alert("Debes completar nombre, nickname y contraseña.")
      return
    }

    const updated = crearUsuarioDesdeFormulario(editingForm)

    const usernameExists = users.some(
      (user) =>
        user.username.toLowerCase() === updated.username.toLowerCase() &&
        user.id !== updated.id &&
        user.id !== editingForm.originalId
    )

    if (usernameExists) {
      window.alert("Ya existe un usuario con ese nickname.")
      return
    }

    if (updated.email.trim()) {
      const emailExists = users.some(
        (user) =>
          user.email.toLowerCase() === updated.email.toLowerCase() &&
          user.id !== updated.id &&
          user.id !== editingForm.originalId
      )

      if (emailExists) {
        window.alert("Ya existe un usuario con ese correo.")
        return
      }
    }

    if (!isCreating) {
      const originalUser = users.find((user) => user.id === editingForm.originalId)

      if (originalUser && !canModifyUser(originalUser)) {
        window.alert(
          "El perfil Administrador General solo puede ser editado por el propio admin.general."
        )
        return
      }
    }

    if (isCreating) {
      setPendingChange({
        type: "crear",
        updated,
        changes: [
          `Código: ${updated.userCode}`,
          `Nombre: ${updated.name}`,
          `Nickname: ${updated.username}`,
          `Correo: ${updated.email || "Sin correo registrado"}`,
          `Rol: ${updated.role}`,
          `Estado: ${updated.status}`,
          "Contraseña: protegida",
        ],
      })

      setEditingForm(null)
      return
    }

    const original = users.find((user) => user.id === editingForm.originalId)

    if (!original) return

    const changes: string[] = []

    const addChange = (label: string, before: string, after: string) => {
      if (before !== after) {
        changes.push(`${label}: ${before} → ${after}`)
      }
    }

    addChange("Nombre", original.name, updated.name)
    addChange("Nickname", original.username, updated.username)
    addChange(
      "Correo",
      original.email || "Sin correo registrado",
      updated.email || "Sin correo registrado"
    )
    addChange("Rol", original.role, updated.role)
    addChange("Estado", original.status, updated.status)

    if (original.temporaryPassword !== updated.temporaryPassword) {
      changes.push("Contraseña: actualizada")
    }

    if (changes.length === 0) {
      setEditingForm(null)
      return
    }

    setPendingChange({
      type: "editar",
      original,
      updated,
      changes,
    })

    setEditingForm(null)
  }

  const solicitarEliminacion = (user: SystemUser) => {
    if (!canModifyUser(user)) {
      window.alert(
        "El perfil Administrador General no puede ser eliminado ni modificado por otro administrador."
      )
      return
    }

    if (currentUser?.id === user.id) {
      window.alert("No puedes eliminar el usuario con el que tienes la sesión iniciada.")
      return
    }

    setPendingChange({
      type: "eliminar",
      original: user,
      changes: [
        `Usuario: ${user.name}`,
        `Nickname: ${user.username}`,
        `Correo: ${user.email || "Sin correo registrado"}`,
        `Rol: ${user.role}`,
        `Estado actual: ${user.status}`,
      ],
    })
  }

  const restablecerContrasena = (user: SystemUser) => {
    if (!canModifyUser(user)) {
      window.alert(
        "La contraseña del Administrador General solo puede ser restablecida por el propio admin.general."
      )
      return
    }

    const newPassword = buildPasswordFromUsername(user.username)

    const updated: SystemUser = {
      ...user,
      temporaryPassword: newPassword,
      lastAccess: getCurrentAccessValue(),
    }

    setPendingChange({
      type: "restablecer",
      original: user,
      updated,
      changes: [
        `Usuario: ${user.name}`,
        `Nickname: ${user.username}`,
        "Contraseña temporal: restablecida",
      ],
    })
  }

  const confirmarCambioUsuario = async () => {
    if (!pendingChange) return

    if (
      pendingChange.original &&
      !canModifyUser(pendingChange.original) &&
      pendingChange.type !== "crear"
    ) {
      window.alert(
        "El perfil Administrador General solo puede ser modificado por el propio admin.general."
      )
      return
    }

    if (pendingChange.type === "crear" && pendingChange.updated) {
      const { data, error } = await supabase
        .from("system_users")
        .insert(mapToDatabase(pendingChange.updated))
        .select(userSelect)
        .single()

      if (error) {
        window.alert(`No se pudo crear el usuario: ${error.message}`)
        return
      }

      const savedUser = mapFromDatabase(data)

      setUsers((prev) =>
        [...prev, savedUser].sort((a, b) =>
          a.userCode.localeCompare(b.userCode)
        )
      )
    }

    if (
      (pendingChange.type === "editar" ||
        pendingChange.type === "restablecer") &&
      pendingChange.original &&
      pendingChange.updated
    ) {
      const { data, error } = await supabase
        .from("system_users")
        .update(mapToDatabase(pendingChange.updated))
        .eq("id", pendingChange.original.id)
        .select(userSelect)
        .single()

      if (error) {
        window.alert(`No se pudo actualizar el usuario: ${error.message}`)
        return
      }

      const savedUser = mapFromDatabase(data)

      setUsers((prev) =>
        prev
          .map((user) =>
            user.id === pendingChange.original!.id ? savedUser : user
          )
          .sort((a, b) => a.userCode.localeCompare(b.userCode))
      )
    }

    if (pendingChange.type === "eliminar" && pendingChange.original) {
      const { error } = await supabase
        .from("system_users")
        .delete()
        .eq("id", pendingChange.original.id)

      if (error) {
        window.alert(`No se pudo eliminar el usuario: ${error.message}`)
        return
      }

      setUsers((prev) =>
        prev.filter((user) => user.id !== pendingChange.original!.id)
      )
    }

    setPendingChange(null)
    setIsCreating(false)
  }

  const volverAEditar = () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear" && pendingChange.updated) {
      setIsCreating(true)
      setEditingForm({
        originalId: "",
        userCode: pendingChange.updated.userCode,
        name: pendingChange.updated.name,
        username: pendingChange.updated.username,
        email: pendingChange.updated.email,
        role: pendingChange.updated.role,
        status: pendingChange.updated.status,
        temporaryPassword: pendingChange.updated.temporaryPassword,
      })
    }

    if (
      pendingChange.type === "editar" &&
      pendingChange.updated &&
      pendingChange.original
    ) {
      if (!canModifyUser(pendingChange.original)) {
        window.alert(
          "El perfil Administrador General solo puede ser editado por el propio admin.general."
        )
        return
      }

      setIsCreating(false)
      setEditingForm({
        originalId: pendingChange.original.id,
        userCode: pendingChange.updated.userCode,
        name: pendingChange.updated.name,
        username: pendingChange.updated.username,
        email: pendingChange.updated.email,
        role: pendingChange.updated.role,
        status: pendingChange.updated.status,
        temporaryPassword: pendingChange.updated.temporaryPassword,
      })
    }

    setPendingChange(null)
  }

  const limpiarFiltros = () => {
    setSearchTerm("")
    setRoleFilter("todos")
    setStatusFilter("todos")
  }

  const renderRoleButton = (role: UserRole | "todos", label: string) => (
    <Button
      variant={roleFilter === role ? "default" : "outline"}
      size="sm"
      className="font-inter"
      onClick={() => setRoleFilter(role)}
    >
      {label}
    </Button>
  )

  const handleNameChange = (value: string) => {
    if (!editingForm) return

    setEditingForm({
      ...editingForm,
      name: value,
    })
  }

  const handleUsernameChange = (value: string) => {
    if (!editingForm) return

    setEditingForm({
      ...editingForm,
      username: value.trim(),
    })
  }

  const generarContrasenaDesdeNickname = () => {
    if (!editingForm) return

    if (!editingForm.username.trim()) {
      window.alert("Primero debes ingresar un nickname para generar la contraseña.")
      return
    }

    setEditingForm({
      ...editingForm,
      temporaryPassword: buildPasswordFromUsername(editingForm.username),
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-6 border border-gray-200">
          <p className="text-sm font-inter text-gray-600">
            Cargando usuarios del sistema...
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border border-red-200 bg-red-50">
          <p className="text-sm font-inter text-red-700">
            No fue posible cargar los usuarios: {error}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Administración de usuarios, roles de acceso y credenciales del sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-inter" onClick={loadUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>

          <Button className="font-inter" onClick={iniciarCreacion}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Usuarios totales</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {users.length}
          </p>
          <p className="text-xs font-inter text-blue-700">
            Cuentas registradas
          </p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Activos</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {activeUsers.length}
          </p>
          <p className="text-xs font-inter text-green-700">
            Disponibles para uso
          </p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">Inactivos</p>
          <p className="text-3xl font-inter font-bold text-gray-900">
            {inactiveUsers.length}
          </p>
          <p className="text-xs font-inter text-gray-700">Sin acceso activo</p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">Administradores</p>
          <p className="text-3xl font-inter font-bold text-red-900">
            {adminUsers.length}
          </p>
          <p className="text-xs font-inter text-red-700">Permiso completo</p>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Coordinadores</p>
          <p className="text-3xl font-inter font-bold text-blue-900">
            {coordinatorUsers.length}
          </p>
          <p className="text-xs font-inter text-blue-700">Gestión operativa</p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Choferes</p>
          <p className="text-3xl font-inter font-bold text-green-900">
            {driverUsers.length}
          </p>
          <p className="text-xs font-inter text-green-700">Registro en terreno</p>
        </Card>
      </div>

      <Card className="p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <UserCog className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-inter font-bold text-gray-900">
            Usuarios del sistema
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative lg:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, nickname, correo o rol..."
              className="pl-10 font-inter"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as UserRole | "todos")
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
          >
            <option value="todos">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Coordinador">Coordinador</option>
            <option value="Chofer">Chofer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatus | "todos")
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
          >
            <option value="todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {renderRoleButton("todos", "Todos")}
          {renderRoleButton("Administrador", "Administradores")}
          {renderRoleButton("Coordinador", "Coordinadores")}
          {renderRoleButton("Chofer", "Choferes")}
        </div>

        {(searchTerm || roleFilter !== "todos" || statusFilter !== "todos") && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              className="font-inter"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm font-inter">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Usuario
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Nickname
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Correo
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Rol
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Contraseña
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Último acceso
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const protectedUser = isProtectedAdmin(user)
                const canModify = canModifyUser(user)
                const canDelete = canModify && currentUser?.id !== user.id

                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {protectedUser && (
                          <ShieldCheck className="w-4 h-4 text-red-600" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.userCode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {user.username}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {user.email || (
                        <span className="text-gray-400">
                          Sin correo registrado
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge className={`${roleBadgeClass[user.role]} font-inter`}>
                        {user.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusBadgeClass[user.status]} font-inter`}
                      >
                        {user.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-gray-400">••••••••</span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {formatLastAccess(user.lastAccess)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          disabled={!canModify}
                          onClick={() => iniciarEdicion(user)}
                          title={
                            canModify
                              ? "Editar usuario"
                              : "Usuario protegido"
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          disabled={!canModify}
                          onClick={() => restablecerContrasena(user)}
                          title={
                            canModify
                              ? "Restablecer contraseña"
                              : "Usuario protegido"
                          }
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter text-red-600 hover:text-red-700"
                          disabled={!canDelete}
                          onClick={() => solicitarEliminacion(user)}
                          title={
                            canDelete
                              ? "Eliminar usuario"
                              : "No se puede eliminar este usuario"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-sm font-inter text-gray-500">
              No se encontraron usuarios con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      {editingForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  {isCreating ? "Agregar usuario" : "Editar usuario"}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Registra los datos del usuario, rol de acceso y credenciales protegidas.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingForm(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Código</label>
                <Input value={editingForm.userCode} disabled />
              </div>

              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <Input
                  value={editingForm.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Nickname</label>
                <Input
                  value={editingForm.username}
                  onChange={(event) => handleUsernameChange(event.target.value)}
                  placeholder="nombre.apellido"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Correo opcional</label>
                <Input
                  value={editingForm.email}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="correo@dominio.cl"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Rol</label>
                <select
                  value={editingForm.role}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      role: event.target.value as UserRole,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Chofer">Chofer</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  value={editingForm.status}
                  onChange={(event) =>
                    setEditingForm({
                      ...editingForm,
                      status: event.target.value as UserStatus,
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Contraseña</label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <Input
                    type="password"
                    value={editingForm.temporaryPassword}
                    onChange={(event) =>
                      setEditingForm({
                        ...editingForm,
                        temporaryPassword: event.target.value,
                      })
                    }
                  />

                  <Button
                    variant="outline"
                    className="font-inter"
                    onClick={generarContrasenaDesdeNickname}
                  >
                    Generar
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  La contraseña no se muestra por seguridad. Puede ser escrita o generada nuevamente por un administrador autorizado.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="font-inter"
                onClick={() => setEditingForm(null)}
              >
                Cancelar
              </Button>

              <Button className="font-inter" onClick={guardarFormulario}>
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? "Revisar usuario" : "Revisar cambios"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {pendingChange && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-amber-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>

                <div>
                  <h2 className="text-xl font-inter font-bold text-amber-900">
                    {pendingChange.type === "crear" &&
                      "Confirmar nuevo usuario"}
                    {pendingChange.type === "editar" &&
                      "Confirmar cambios de usuario"}
                    {pendingChange.type === "restablecer" &&
                      "Confirmar restablecimiento de contraseña"}
                    {pendingChange.type === "eliminar" &&
                      "Confirmar eliminación de usuario"}
                  </h2>

                  <p className="text-sm font-inter text-amber-800 mt-1">
                    {pendingChange.type === "crear" &&
                      "Revisa los datos antes de agregar el usuario al sistema."}
                    {pendingChange.type === "editar" &&
                      "Revisa los datos modificados antes de guardarlos."}
                    {pendingChange.type === "restablecer" &&
                      "Se actualizará la contraseña del usuario seleccionado."}
                    {pendingChange.type === "eliminar" &&
                      "Esta acción quitará al usuario del sistema."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChange(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 mb-4">
              <p className="text-sm font-inter">
                {pendingChange.type === "eliminar"
                  ? "Confirma solo si corresponde eliminar este usuario de forma permanente."
                  : "Si confirmas, el cambio quedará guardado en la base de datos."}
              </p>
            </div>

            <div className="space-y-2">
              {pendingChange.changes.map((change) => (
                <div
                  key={change}
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-inter text-gray-800"
                >
                  {change}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {(pendingChange.type === "crear" ||
                pendingChange.type === "editar") && (
                <Button
                  variant="outline"
                  className="font-inter"
                  onClick={volverAEditar}
                >
                  Volver a editar
                </Button>
              )}

              <Button
                variant="outline"
                className="font-inter"
                onClick={() => setPendingChange(null)}
              >
                Cancelar
              </Button>

              <Button
                className="font-inter bg-amber-600 hover:bg-amber-700"
                onClick={confirmarCambioUsuario}
              >
                Confirmar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
