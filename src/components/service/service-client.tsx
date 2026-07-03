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
import { formatDate, formatCurrency } from "@/lib/utils"
import { updateServiceStatus } from "@/lib/actions/service"
import { Wrench, Plus, Loader2, InboxIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ServiceOrder = {
  id: string
  number: number
  status: "RECEIVED" | "IN_PROGRESS" | "WAITING_PARTS" | "READY" | "DELIVERED" | "CANCELLED"
  type: string
  description: string
  estimatedDate: Date | null
  completedDate: Date | null
  price: unknown | null
  notes: string | null
  customer: { id: string; name: string; phone: string | null }
  product: { id: string; name: string; sku: string } | null
  productName: string | null
}

interface ServiceClientProps {
  orders: ServiceOrder[]
  stats: { received: number; inProgress: number; ready: number; delivered: number }
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Recebido",
  IN_PROGRESS: "Em andamento",
  WAITING_PARTS: "Aguard. peças",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-200",
  WAITING_PARTS: "bg-orange-100 text-orange-700 border-orange-200",
  READY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
}

const TYPE_LABELS: Record<string, string> = {
  POLISHING: "Polimento",
  CLASP_CHANGE: "Troca de fecho",
  STONE_CHANGE: "Troca de pedra",
  ADJUSTMENT: "Ajuste",
  PLATING: "Banho",
  REPAIR: "Conserto",
  OTHER: "Outro",
}

export function ServiceClient({ orders, stats }: ServiceClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selected, setSelected] = useState<ServiceOrder | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [newNotes, setNewNotes] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [loading, setLoading] = useState(false)

  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter)

  async function handleUpdateStatus(evt: React.FormEvent) {
    evt.preventDefault()
    if (!selected || !newStatus) return
    setLoading(true)
    await updateServiceStatus(
      selected.id,
      newStatus as ServiceOrder["status"],
      newNotes || undefined,
      newPrice ? parseFloat(newPrice.replace(",", ".")) : undefined,
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
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recebidos</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{stats.received}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Em andamento</p>
            <p className="text-xl font-bold mt-1 text-yellow-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Prontos p/ retirada</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{stats.ready}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-xl font-bold mt-1 text-muted-foreground">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="RECEIVED">Recebido</SelectItem>
            <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
            <SelectItem value="WAITING_PARTS">Aguard. peças</SelectItem>
            <SelectItem value="READY">Pronto</SelectItem>
            <SelectItem value="DELIVERED">Entregue</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" asChild>
          <Link href="/service/new">
            <Plus className="w-4 h-4" /> Nova OS
          </Link>
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Wrench className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhuma ordem de serviço encontrada</p>
            <Button size="sm" asChild>
              <Link href="/service/new">
                <Plus className="w-4 h-4" /> Nova OS
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelected(order)
                  setNewStatus(order.status)
                  setNewNotes(order.notes ?? "")
                  setNewPrice(order.price ? String(Number(order.price)) : "")
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">OS#{order.number}</span>
                    <span className="text-sm font-medium truncate">{order.customer.name}</span>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      STATUS_COLORS[order.status]
                    )}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABELS[order.type]}
                    {(order.productName || order.product?.name) && ` · ${order.productName ?? order.product?.name}`}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0 space-y-0.5">
                  {order.estimatedDate && <p>Prev: {formatDate(order.estimatedDate)}</p>}
                  {order.price != null && <p className="font-medium text-foreground">{formatCurrency(Number(order.price))}</p>}
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
            <DialogTitle>OS#{selected?.number} — {selected?.customer.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>Serviço: <span className="font-medium">{TYPE_LABELS[selected.type]}</span></p>
                <p>Descrição: <span className="font-medium">{selected.description}</span></p>
                {(selected.productName || selected.product?.name) && (
                  <p>Peça: <span className="font-medium">{selected.productName ?? selected.product?.name}</span></p>
                )}
                {selected.estimatedDate && (
                  <p>Previsão: <span className="font-medium">{formatDate(selected.estimatedDate)}</span></p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">Recebido</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                    <SelectItem value="WAITING_PARTS">Aguardando peças</SelectItem>
                    <SelectItem value="READY">Pronto</SelectItem>
                    <SelectItem value="DELIVERED">Entregue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Observações internas"
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
