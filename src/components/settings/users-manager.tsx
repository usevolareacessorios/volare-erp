"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserRole, toggleUserActive, createUser, deleteUser } from "@/lib/actions/users"
import { Loader2, Users, ToggleLeft, ToggleRight, UserPlus, Trash2, X } from "lucide-react"

type Profile = {
  id: string; name: string; email: string; role: string; active: boolean; phone: string | null
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", MANAGER: "Gerente", SALES: "Vendas", FINANCE: "Financeiro",
}

export function UsersManager({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES", phone: "" })

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleRoleChange(id: string, role: string) {
    setLoading(id + "_role"); setError(null)
    const res = await updateUserRole(id, role as "ADMIN" | "MANAGER" | "SALES" | "FINANCE")
    setLoading(null)
    if (res?.error) { setError(res.error); return }
    refresh()
  }

  async function handleToggle(id: string, active: boolean) {
    setLoading(id + "_toggle"); setError(null)
    const res = await toggleUserActive(id, !active)
    setLoading(null)
    if (res?.error) { setError(res.error); return }
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return
    setLoading(id + "_delete"); setError(null)
    const res = await deleteUser(id)
    setLoading(null)
    if (res?.error) { setError(res.error); return }
    refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setCreateError("Nome, e-mail e senha são obrigatórios.")
      return
    }
    if (form.password.length < 6) {
      setCreateError("A senha deve ter no mínimo 6 caracteres.")
      return
    }
    setCreating(true); setCreateError("")
    try {
      const res = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as "ADMIN" | "MANAGER" | "SALES" | "FINANCE",
        phone: form.phone || undefined,
      })
      if (res?.error) { setCreateError(res.error); return }
      setShowCreate(false)
      setForm({ name: "", email: "", password: "", role: "SALES", phone: "" })
      refresh()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Erro inesperado ao criar usuário.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create user form */}
      {showCreate ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Novo usuário</CardTitle>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Senha *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Nível de acesso *</Label>
                <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin — acesso total</SelectItem>
                    <SelectItem value="MANAGER">Gerente — gerencia equipe e estoque</SelectItem>
                    <SelectItem value="SALES">Vendas — PDV e clientes</SelectItem>
                    <SelectItem value="FINANCE">Financeiro — contas e relatórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createError && <p className="sm:col-span-2 text-xs text-destructive">{createError}</p>}

              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Criar usuário
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4" /> Novo usuário
        </Button>
      )}

      {/* Users list */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="p-3 rounded-full bg-muted"><Users className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="px-4 py-2.5 text-sm text-destructive border-b border-border">{error}</div>
              )}
              <div className="divide-y divide-border">
                {users.map((user) => {
                  const isMe = user.id === currentUserId
                  return (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{user.name}</span>
                          {isMe && <Badge variant="secondary" className="text-[10px] py-0">Você</Badge>}
                          {!user.active && <Badge variant="secondary" className="text-[10px] py-0">Inativo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                      </div>

                      {/* Role selector */}
                      <div className="shrink-0 w-36">
                        {loading === user.id + "_role" ? (
                          <div className="flex items-center gap-2 h-9 px-3">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user.id, v)}
                            disabled={isMe}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MANAGER">Gerente</SelectItem>
                              <SelectItem value="SALES">Vendas</SelectItem>
                              <SelectItem value="FINANCE">Financeiro</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Toggle active */}
                      <Button
                        size="icon" variant="ghost" className="w-8 h-8 shrink-0"
                        disabled={isMe || loading === user.id + "_toggle"}
                        onClick={() => handleToggle(user.id, user.active)}
                        title={user.active ? "Desativar" : "Ativar"}
                      >
                        {loading === user.id + "_toggle" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.active ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>

                      {/* Delete */}
                      {!isMe && (
                        <Button
                          size="icon" variant="ghost" className="w-8 h-8 shrink-0 text-destructive hover:text-destructive"
                          disabled={loading === user.id + "_delete"}
                          onClick={() => handleDelete(user.id)}
                          title="Excluir usuário"
                        >
                          {loading === user.id + "_delete" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role legend */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Níveis de acesso:</p>
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <p key={key}><span className="font-medium">{label}</span> — {
            key === "ADMIN" ? "acesso total ao sistema" :
            key === "MANAGER" ? "gerencia equipe, estoque e compras" :
            key === "SALES" ? "PDV, clientes e catálogo" :
            "módulo financeiro e relatórios"
          }</p>
        ))}
      </div>
    </div>
  )
}
