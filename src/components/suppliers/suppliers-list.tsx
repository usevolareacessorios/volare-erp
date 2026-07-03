"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Truck, Phone, Mail, Package, ChevronRight } from "lucide-react"

type Supplier = {
  id: string; name: string; cnpj: string | null; phone: string | null
  email: string | null; city: string | null; state: string | null
  active: boolean; paymentTerms: string | null
  _count: { products: number }
}

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState("")

  const filtered = suppliers.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.cnpj?.includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ, e-mail ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} fornecedor{filtered.length !== 1 ? "es" : ""}
        {search ? ` encontrado${filtered.length !== 1 ? "s" : ""}` : ""}
      </p>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Truck className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhum fornecedor encontrado</p>
            {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}>Limpar busca</Button>}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fornecedor</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produtos</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
              <span />
            </div>

            <div className="divide-y divide-border">
              {filtered.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/suppliers/${supplier.id}`}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-gold-100)] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-[var(--color-gold-600)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{supplier.name}</p>
                    {supplier.cnpj && <p className="text-xs text-muted-foreground font-mono">{supplier.cnpj}</p>}
                    {supplier.city && !supplier.cnpj && (
                      <p className="text-xs text-muted-foreground">{supplier.city}{supplier.state ? `, ${supplier.state}` : ""}</p>
                    )}
                  </div>

                  <div className="hidden md:flex flex-col gap-0.5 w-48 shrink-0">
                    {supplier.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />{supplier.phone}
                      </span>
                    )}
                    {supplier.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />{supplier.email}
                      </span>
                    )}
                  </div>

                  <div className="hidden md:flex items-center gap-1 w-24 shrink-0">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {supplier._count.products} produto{supplier._count.products !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={supplier.active ? "success" : "secondary"} className="hidden sm:inline-flex">
                      {supplier.active ? "Ativo" : "Inativo"}
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
