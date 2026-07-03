"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Search, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

type Sale = {
  id: string; number: string; total: unknown; createdAt: Date
  customer: { name: string } | null
  items: { id: string; quantity: number; product: { name: string } }[]
  payments: { method: string }[]
}

const METHOD_LABELS: Record<string, string> = {
  PIX: "Pix", CASH: "Dinheiro", CREDIT: "Crédito", DEBIT: "Débito", OTHER: "Outro",
}

export function SalesList({ sales }: { sales: Sale[] }) {
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("all")

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      String(s.number).includes(q) ||
      s.customer?.name.toLowerCase().includes(q) ||
      s.items.some((i) => i.product.name.toLowerCase().includes(q))
    const matchMethod = method === "all" || s.payments.some((p) => p.method === method)
    return matchSearch && matchMethod
  })

  const totalFiltered = filtered.reduce((s, v) => s + Number(v.total), 0)

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, cliente ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos pagamentos</SelectItem>
            <SelectItem value="PIX">Pix</SelectItem>
            <SelectItem value="CASH">Dinheiro</SelectItem>
            <SelectItem value="CREDIT">Crédito</SelectItem>
            <SelectItem value="DEBIT">Débito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} venda{filtered.length !== 1 ? "s" : ""}
          {(search || method !== "all") ? " encontrada" + (filtered.length !== 1 ? "s" : "") : ""}
        </p>
        {filtered.length > 0 && (
          <p className="text-sm font-semibold">{formatCurrency(totalFiltered)}</p>
        )}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="p-3 rounded-full bg-muted">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhuma venda encontrada</p>
            {(search || method !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setMethod("all") }}>
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filtered.map((sale) => (
              <div key={sale.id} className="flex items-start justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-gold-100)] flex items-center justify-center shrink-0 mt-0.5">
                    <ShoppingBag className="w-4 h-4 text-[var(--color-gold-600)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono">#{String(sale.number)}</span>
                      <Badge variant="success" className="text-xs py-0">Concluída</Badge>
                    </div>
                    {sale.customer && (
                      <p className="text-xs text-muted-foreground mt-0.5">{sale.customer.name}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sale.items.map((item) => (
                        <span key={item.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {item.quantity}x {item.product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatCurrency(Number(sale.total))}</p>
                  <div className="flex gap-1 justify-end mt-1 flex-wrap">
                    {sale.payments.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs py-0">{METHOD_LABELS[p.method]}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(sale.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
