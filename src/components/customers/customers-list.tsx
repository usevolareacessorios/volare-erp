"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Search, Phone, Mail, Cake, ShoppingBag, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

type Customer = {
  id: string; name: string; phone: string | null; email: string | null
  city: string | null; state: string | null; birthDate: Date | null
  active: boolean; lastPurchaseAt: Date | null
  _count: { sales: number }
}

export function CustomersList({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("")

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, e-mail ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        {search ? ` encontrado${filtered.length !== 1 ? "s" : ""}` : ""}
      </p>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhum cliente encontrado</p>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>Limpar busca</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.2fr_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aniversário</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compras</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-gold-100)] flex items-center justify-center shrink-0 text-[var(--color-gold-700)] font-semibold text-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{customer.name}</p>
                    {customer.city && (
                      <p className="text-xs text-muted-foreground truncate">
                        {customer.city}{customer.state ? `, ${customer.state}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="hidden md:flex flex-col gap-0.5 w-40 shrink-0">
                    {customer.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 shrink-0" />{customer.phone}
                      </span>
                    )}
                    {customer.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />{customer.email}
                      </span>
                    )}
                  </div>

                  <div className="hidden md:block w-28 shrink-0">
                    {customer.birthDate ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Cake className="w-3 h-3 shrink-0" />{formatDate(customer.birthDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>

                  <div className="hidden md:block w-20 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 shrink-0" />
                      {customer._count.sales} compra{customer._count.sales !== 1 ? "s" : ""}
                    </span>
                    {customer.lastPurchaseAt && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(customer.lastPurchaseAt)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={customer.active ? "success" : "secondary"} className="hidden sm:inline-flex">
                      {customer.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
