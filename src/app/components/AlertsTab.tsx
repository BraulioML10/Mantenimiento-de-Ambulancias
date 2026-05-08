import { useMemo, useState } from "react"
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

type UserRole = "Administrador" | "Coordinador" | "Conductor"
type UserStatus = "Activo" | "Inactivo"

interface SystemUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  temporaryPassword: string
  lastAccess: string
}

interface UserForm {
  originalId: string
  name: string
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

const initialUsers: SystemUser[] = [
  {
    id: "USR-001",
    name: "Administrador SAMU",
    email: "admin.samu@ssvq.cl",
    role: "Administrador",
    status: "Activo",
    temporaryPassword: "SAMU-ADMIN-01",
    lastAccess: "Hoy 15:32",
  },
  {
    id: "USR-002",
    name: "Coordinación de Flota",
    email: "coordinacion.flota@ssvq.cl",
    role: "Coordinador",
    status: "Activo",
    temporaryPassword: "TEMP-2026-01",
    lastAccess: "Hoy 14:50",
  },
  {
    id: "USR-003",
    name: "Coordinación de Mantenciones",
    email: "mantenciones.samu@ssvq.cl",
    role: "Coordinador",
    status: "Activo",
    temporaryPassword: "TEMP-2026-02",
    lastAccess: "Ayer 18:10",
  },
  {
    id: "USR-004",
    name: "Conductor Base Quillota",
    email: "conductor.quillota@ssvq.cl",
    role: "Conductor",
    status: "Activo",
    temporaryPassword: "TEMP-2026-03",
    lastAccess: "Hoy 08:15",
  },
  {
    id: "USR-005",
    name: "Conductor Base Viña del Mar",
    email: "conductor.vina@ssvq.cl",
    role: "Conductor",
    status: "Inactivo",
    temporaryPassword: "TEMP-2026-04",
    lastAccess: "Sin ingreso reciente",
  },
]

const emptyUserForm: UserForm = {
  originalId: "",
  name: "",
  email: "",
  role: "Conductor",
  status: "Activo",
  temporaryPassword: "",
}

const roleBadgeClass: Record<UserRole, string> = {
  Administrador: "bg-red-100 text-red-700 border-red-200",
  Coordinador: "bg-blue-100 text-blue-700 border-blue-200",
  Conductor: "bg-green-100 text-green-700 border-green-200",
}

const statusBadgeClass: Record<UserStatus, string> = {
  Activo: "bg-green-100 text-green-700 border-green-200",
  Inactivo: "bg-gray-100 text-gray-700 border-gray-200",
}

export function AlertsTab() {
  const [users, setUsers] = useState<SystemUser[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "todos">("todos")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "todos">("todos")
  const [editingForm, setEditingForm] = useState<UserForm | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingChange, setPendingChange] = useState<PendingUserChange | null>(null)

  const activeUsers = users.filter((user) => user.status === "Activo")
  const inactiveUsers = users.filter((user) => user.status === "Inactivo")
  const adminUsers = users.filter((user) => user.role === "Administrador")
  const coordinatorUsers = users.filter((user) => user.role === "Coordinador")
  const driverUsers = users.filter((user) => user.role === "Conductor")

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)

      const matchesRole = roleFilter === "todos" || user.role === roleFilter
      const matchesStatus = statusFilter === "todos" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const generateUserId = () => {
    const existingNumbers = users
      .map((user) => Number(user.id.replace("USR-", "")))
      .filter((number) => !Number.isNaN(number))

    const nextNumber = Math.max(...existingNumbers, 0) + 1

    return `USR-${String(nextNumber).padStart(3, "0")}`
  }

  const generateTemporaryPassword = () => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000)
    return `SAMU-${randomNumber}`
  }

  const getCurrentAccessText = () => {
    return `Hoy ${new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }

  const iniciarCreacion = () => {
    setIsCreating(true)
    setPendingChange(null)
    setEditingForm({
      ...emptyUserForm,
      temporaryPassword: generateTemporaryPassword(),
    })
  }

  const iniciarEdicion = (user: SystemUser) => {
    setIsCreating(false)
    setPendingChange(null)
    setEditingForm({
      originalId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      temporaryPassword: user.temporaryPassword,
    })
  }

  const crearUsuarioDesdeFormulario = (form: UserForm): SystemUser => {
    return {
      id: isCreating ? generateUserId() : form.originalId,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      temporaryPassword: form.temporaryPassword.trim(),
      lastAccess: isCreating ? "Sin ingreso registrado" : getCurrentAccessText(),
    }
  }

  const guardarFormulario = () => {
    if (!editingForm) return

    if (
      !editingForm.name.trim() ||
      !editingForm.email.trim() ||
      !editingForm.temporaryPassword.trim()
    ) {
      window.alert("Debes completar nombre, correo y contraseña temporal.")
      return
    }

    const updated = crearUsuarioDesdeFormulario(editingForm)

    if (isCreating) {
      const emailExists = users.some(
        (user) => user.email.toLowerCase() === updated.email.toLowerCase()
      )

      if (emailExists) {
        window.alert("Ya existe un usuario con ese correo.")
        return
      }

      setPendingChange({
        type: "crear",
        updated,
        changes: [
          `Nombre: ${updated.name}`,
          `Correo: ${updated.email}`,
          `Rol: ${updated.role}`,
          `Estado: ${updated.status}`,
          `Contraseña temporal: ${updated.temporaryPassword}`,
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
    addChange("Correo", original.email, updated.email)
    addChange("Rol", original.role, updated.role)
    addChange("Estado", original.status, updated.status)
    addChange("Contraseña temporal", original.temporaryPassword, updated.temporaryPassword)

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
    setPendingChange({
      type: "eliminar",
      original: user,
      changes: [
        `Usuario: ${user.name}`,
        `Correo: ${user.email}`,
        `Rol: ${user.role}`,
        `Estado actual: ${user.status}`,
      ],
    })
  }

  const restablecerContrasena = (user: SystemUser) => {
    const newPassword = generateTemporaryPassword()

    const updated: SystemUser = {
      ...user,
      temporaryPassword: newPassword,
      lastAccess: getCurrentAccessText(),
    }

    setPendingChange({
      type: "restablecer",
      original: user,
      updated,
      changes: [
        `Usuario: ${user.name}`,
        `Correo: ${user.email}`,
        `Contraseña temporal anterior: ${user.temporaryPassword}`,
        `Nueva contraseña temporal: ${newPassword}`,
      ],
    })
  }

  const confirmarCambioUsuario = () => {
    if (!pendingChange) return

    if (pendingChange.type === "crear" && pendingChange.updated) {
      setUsers((prev) => [...prev, pendingChange.updated!])
    }

    if (
      (pendingChange.type === "editar" || pendingChange.type === "restablecer") &&
      pendingChange.original &&
      pendingChange.updated
    ) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === pendingChange.original!.id ? pendingChange.updated! : user
        )
      )
    }

    if (pendingChange.type === "eliminar" && pendingChange.original) {
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
        name: pendingChange.updated.name,
        email: pendingChange.updated.email,
        role: pendingChange.updated.role,
        status: pendingChange.updated.status,
        temporaryPassword: pendingChange.updated.temporaryPassword,
      })
    }

    if (pendingChange.type === "editar" && pendingChange.updated && pendingChange.original) {
      setIsCreating(false)
      setEditingForm({
        originalId: pendingChange.original.id,
        name: pendingChange.updated.name,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm font-inter text-gray-600">
            Administración de usuarios del prototipo, roles de acceso y contraseñas temporales.
          </p>
        </div>

        <Button className="font-inter" onClick={iniciarCreacion}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Usuarios totales</p>
          <p className="text-3xl font-inter font-bold text-blue-900">{users.length}</p>
          <p className="text-xs font-inter text-blue-700">Cuentas registradas</p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Activos</p>
          <p className="text-3xl font-inter font-bold text-green-900">{activeUsers.length}</p>
          <p className="text-xs font-inter text-green-700">Disponibles para uso</p>
        </Card>

        <Card className="p-5 bg-gray-50 border-gray-200">
          <p className="text-sm font-inter text-gray-700">Inactivos</p>
          <p className="text-3xl font-inter font-bold text-gray-900">{inactiveUsers.length}</p>
          <p className="text-xs font-inter text-gray-700">Sin acceso activo</p>
        </Card>

        <Card className="p-5 bg-red-50 border-red-200">
          <p className="text-sm font-inter text-red-700">Administradores</p>
          <p className="text-3xl font-inter font-bold text-red-900">{adminUsers.length}</p>
          <p className="text-xs font-inter text-red-700">Permisos completos</p>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-inter text-blue-700">Coordinadores</p>
          <p className="text-3xl font-inter font-bold text-blue-900">{coordinatorUsers.length}</p>
          <p className="text-xs font-inter text-blue-700">Gestión operativa</p>
        </Card>

        <Card className="p-5 bg-green-50 border-green-200">
          <p className="text-sm font-inter text-green-700">Conductores</p>
          <p className="text-3xl font-inter font-bold text-green-900">{driverUsers.length}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="pl-10 font-inter"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as UserRole | "todos")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-inter"
          >
            <option value="todos">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Coordinador">Coordinador</option>
            <option value="Conductor">Conductor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as UserStatus | "todos")}
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
          {renderRoleButton("Conductor", "Conductores")}
        </div>

        {(searchTerm || roleFilter !== "todos" || statusFilter !== "todos") && (
          <div className="mb-4">
            <Button variant="outline" size="sm" className="font-inter" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Correo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Contraseña</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Último acceso</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-gray-700" />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{user.email}</td>

                    <td className="px-4 py-3">
                      <Badge className={`${roleBadgeClass[user.role]} font-inter`}>
                        {user.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge className={`${statusBadgeClass[user.status]} font-inter`}>
                        {user.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      <span className="font-mono">••••••••</span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{user.lastAccess}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          onClick={() => iniciarEdicion(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter"
                          onClick={() => restablecerContrasena(user)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="font-inter text-red-600 hover:text-red-700"
                          onClick={() => solicitarEliminacion(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-sm font-inter text-gray-500">
                No se encontraron usuarios con los filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </Card>

      {editingForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-inter font-bold text-gray-900">
                  {isCreating ? "Agregar usuario" : "Editar usuario"}
                </h2>
                <p className="text-sm font-inter text-gray-600">
                  Registra los datos del usuario y sus credenciales temporales de acceso.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setEditingForm(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <Input
                  value={editingForm.name}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, name: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Correo</label>
                <Input
                  type="email"
                  value={editingForm.email}
                  onChange={(event) =>
                    setEditingForm({ ...editingForm, email: event.target.value })
                  }
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
                  <option value="Conductor">Conductor</option>
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
                <label className="text-sm text-gray-600">Contraseña temporal</label>
                <div className="flex gap-2">
                  <Input
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
                    onClick={() =>
                      setEditingForm({
                        ...editingForm,
                        temporaryPassword: generateTemporaryPassword(),
                      })
                    }
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Generar
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mt-4">
              <p className="text-sm font-inter text-blue-800">
                En un sistema real, las contraseñas no deben visualizarse ni almacenarse como texto plano. En este prototipo se usan contraseñas temporales para simular la gestión del administrador.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="font-inter" onClick={() => setEditingForm(null)}>
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
          <Card
            className={`w-full max-w-2xl p-6 bg-white shadow-xl max-h-[90vh] overflow-y-auto ${
              pendingChange.type === "eliminar"
                ? "border border-red-200"
                : "border border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    pendingChange.type === "eliminar" ? "bg-red-100" : "bg-amber-100"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      pendingChange.type === "eliminar" ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                </div>

                <div>
                  <h2
                    className={`text-xl font-inter font-bold ${
                      pendingChange.type === "eliminar" ? "text-red-900" : "text-amber-900"
                    }`}
                  >
                    {pendingChange.type === "crear" && "Confirmar nuevo usuario"}
                    {pendingChange.type === "editar" && "Confirmar cambios de usuario"}
                    {pendingChange.type === "restablecer" && "Confirmar restablecimiento de contraseña"}
                    {pendingChange.type === "eliminar" && "Confirmar eliminación de usuario"}
                  </h2>

                  <p
                    className={`text-sm font-inter mt-1 ${
                      pendingChange.type === "eliminar" ? "text-red-700" : "text-amber-800"
                    }`}
                  >
                    {pendingChange.type === "crear" &&
                      "Revisa los datos antes de agregar el usuario al sistema."}
                    {pendingChange.type === "editar" &&
                      "Revisa los datos modificados antes de guardarlos."}
                    {pendingChange.type === "restablecer" &&
                      "Se generará una nueva contraseña temporal para el usuario."}
                    {pendingChange.type === "eliminar" &&
                      "Esta acción quitará al usuario del prototipo."}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setPendingChange(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div
              className={`p-4 rounded-lg border mb-4 ${
                pendingChange.type === "eliminar"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <p className="text-sm font-inter">
                {pendingChange.type === "eliminar"
                  ? "Confirma solo si corresponde eliminar este usuario de forma permanente dentro de la sesión actual."
                  : "Si confirmas, el cambio quedará aplicado en la gestión de usuarios del prototipo."}
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
              {(pendingChange.type === "crear" || pendingChange.type === "editar") && (
                <Button variant="outline" className="font-inter" onClick={volverAEditar}>
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
                className={`font-inter ${
                  pendingChange.type === "eliminar"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
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