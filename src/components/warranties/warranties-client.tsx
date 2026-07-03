"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { updateWarrantyStatus } from "@/lib/actions/warranties"
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Warranty = {
  id: string
  issueDate: Date
  expiryDate: Date
  status: "ACTIVE" | "CLAIMED" | "EXPIRED" | "VOIDED"
  defectDesc: string | null
  resolution: string | null
  notes: string | null
  product: { id: string; name: string; sku: string }
  customer: { id: string; name: string; phone: string | null }
}

interface WarrantiesClientProps {
  warranties: Warranty[]
  stats: { active: number; expiring: number; claimed: number; expired: number }
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  CLAIMED: "Reclamada",
  EXPIRED: "Expirada",
  VOIDED: "Anulada",
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "warning"> = {
  ACTIVE: "success",
  CLAIMED: "warning",
  EXPIRED: "destructive",
  VOIDED: "secondary",
}

export function WarrantiesClient({ warranties, stats }: WarrantiesClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Warranty | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [defectDesc, setDefectDesc] = useState("")
  const [resolution, setResolution] = useState("")
  const [loading, setLoading] = useState(false)

  const filtered = warranties.filter((w) => statusFilter === "all" || w.status === statusFilter)

  async function handleUpdateStatus(evt: React.FormEvent) {
    evt.preventDefault()
    if (!selected || !newStatus) return
    setLoading(true)
    await updateWarrantyStatus(
      selected.id,
      newStatus as "ACTIVE" | "CLAIMED" | "EXPIRED" | "VOIDED",
      defectDesc || undefined,
      resolution || undefined
    )
    setLoading(false)
    setSelected(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total ativas</p>
              <p className="text-xl font-bold mt-1 text-emerald-600">{stats.active}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expiram em 30 dias</p>
              <p className="text-xl font-bold mt-1 text-amber-500">{stats.expiring}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Reclamadas</p>
              <p className="text-xl font-bold mt-1 text-orange-500">{stats.claimed}</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-50">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expiradas</p>
              <p className="text-xl font-bold mt-1 text-muted-foreground">{stats.expired}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <ShieldOff className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="ACTIVE">Ativas</SelectItem>
            <SelectItem value="CLAIMED">Reclamadas</SelectItem>
            <SelectItem value="EXPIRED">Expiradas</SelectItem>
            <SelectItem value="VOIDED">Anuladas</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" asChild>
          <Link href="/warranties/new">
            <Plus className="w-4 h-4" /> Nova Garantia
          </Link>
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Shield className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhuma garantia encontrada</p>
            <Button size="sm" asChild>
              <Link href="/warranties/new">
                <Plus className="w-4 h-4" /> Nova Garantia
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filtered.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelected(w)
                  setNewStatus(w.status)
                  setDefectDesc(w.defectDesc ?? "")
                  setResolution(w.resolution ?? "")
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{w.product.name}</span>
                    <Badge variant={STATUS_VARIANTS[w.status]} className="text-[10px] py-0 px-1.5">
                      {STATUS_LABELS[w.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{w.customer.name}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0 space-y-0.5">
                  <p>Emitida: {formatDate(w.issueDate)}</p>
                  <p className={cn(
                    "font-medium",
                    w.status === "ACTIVE" && new Date(w.expiryDate) < new Date(Date.now() + 30 * 86400000)
                      ? "text-amber-500"
                      : ""
                  )}>
                    Expira: {formatDate(w.expiryDate)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detail / Edit dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Garantia — {selected?.product.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>Cliente: <span className="font-medium">{selected.customer.name}</span></p>
                <p>SKU: <span className="font-medium">{selected.product.sku}</span></p>
                <p>Emitida: <span className="font-medium">{formatDate(selected.issueDate)}</span></p>
                <p>Expira: <span className="font-medium">{formatDate(selected.expiryDate)}</span></p>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                    <SelectItem value="CLAIMED">Reclamada</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                    <SelectItem value="VOIDED">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newStatus === "CLAIMED") && (
                <div className="space-y-1.5">
                  <Label>Descrição do defeito</Label>
                  <Input
                    value={defectDesc}
                    onChange={(e) => setDefectDesc(e.target.value)}
                    placeholder="Descreva o defeito relatado"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Resolução</Label>
                <Input
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Como foi resolvido"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
