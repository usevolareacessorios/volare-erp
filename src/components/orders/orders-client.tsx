"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, FileText, CheckCircle2, XCircle, ShoppingBag, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { convertOrderToSale, cancelOrder } from "@/lib/actions/orders"

type Order = {
  id: string; number: string; status: string; total: unknown; createdAt: Date
  customer: { name: string; phone: string | null; whatsapp: string | null } | null
  seller: { name: string } | null
  items: { id: string; quantity: number; product: { name: string; salePrice: unknown } }[]
  payments: { method: string; amount: unknown }[]
}

const STATUS_LABELS: Record<string, string> = {
  QUOTE: "Orçamento", ORDER: "Pedido", PRESALE: "Pré-venda", PENDING: "Pendente",
}
const STATUS_VARIANTS: Record<string, string> = {
  QUOTE: "secondary", ORDER: "default", PRESALE: "warning", PENDING: "secondary",
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return o.number.includes(q) ||
      o.customer?.name.toLowerCase().includes(q) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(q))
  })

  async function handleConfirm(id: string) {
    setLoading(id + "_confirm")
    await convertOrderToSale(id)
    setLoading(null)
    startTransition(() => router.refresh())
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancelar este orçamento/pedido?")) return
    setLoading(id + "_cancel")
    await cancelOrder(id)
    setLoading(null)
    startTransition(() => router.refresh())
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="p-3 rounded-full bg-muted"><FileText className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-medium">Nenhum orçamento ou pedido em aberto</p>
          <p className="text-sm text-muted-foreground">Crie um novo orçamento pelo PDV.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nº, cliente ou produto..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {filtered.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold">#{order.number}</span>
                  <Badge variant={STATUS_VARIANTS[order.status] as "default" | "secondary" | "warning"}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                </div>
                <span className="font-bold shrink-0">{formatCurrency(Number(order.total))}</span>
              </div>

              {order.customer && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{order.customer.name}</span>
                  {(order.customer.whatsapp || order.customer.phone) && (
                    <a
                      href={`https://wa.me/55${(order.customer.whatsapp || order.customer.phone)?.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {order.items.map((item) => (
                  <span key={item.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {item.quantity}x {item.product.name}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleConfirm(order.id)}
                  disabled={loading === order.id + "_confirm"}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar venda
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => {
                    const phone = (order.customer?.whatsapp || order.customer?.phone)?.replace(/\D/g, "")
                    const items = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")
                    const text = `Olá ${order.customer?.name ?? ""}! Segue seu orçamento:\n${items}\nTotal: ${formatCurrency(Number(order.total))}`
                    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank")
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Enviar orçamento
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(order.id)} disabled={loading === order.id + "_cancel"}>
                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
