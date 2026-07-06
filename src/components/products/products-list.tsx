"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Search, Package, ChevronRight, Trash2 } from "lucide-react"
import { deleteProduct } from "@/lib/actions/products"

type Product = {
  id: string; name: string; sku: string; status: string
  salePrice: unknown; costPrice: unknown; freightCost: unknown
  taxCost: unknown; commission: unknown; packaging: unknown; otherCosts: unknown
  currentStock: number; minStock: number; isFeatured: boolean
  images: { url: string }[]
}

export function ProductsList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    setDeletingId(id)
    await deleteProduct(id)
    setDeletingId(null)
    startTransition(() => router.refresh())
  }

  const filtered = products.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
        {search ? ` encontrado${filtered.length !== 1 ? "s" : ""}` : ""}
      </p>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhum produto encontrado</p>
            {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}>Limpar busca</Button>}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl">
              <span className="w-10" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço venda</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estoque</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((product) => {
                const primaryImage = product.images[0]
                const totalCost = Number(product.costPrice) + Number(product.freightCost) +
                  Number(product.taxCost) + Number(product.commission) +
                  Number(product.packaging) + Number(product.otherCosts)
                const margin = Number(product.salePrice) > 0
                  ? Math.round(((Number(product.salePrice) - totalCost) / Number(product.salePrice)) * 100)
                  : null
                const lowStock = product.currentStock <= product.minStock

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {primaryImage ? (
                        <Image src={primaryImage.url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Name + SKU */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                    </div>

                    {/* Sale price */}
                    <div className="hidden md:block w-24 shrink-0">
                      <p className="text-sm font-semibold">{formatCurrency(Number(product.salePrice))}</p>
                    </div>

                    {/* Margin */}
                    <div className="hidden md:block w-20 shrink-0">
                      {margin !== null ? (
                        <Badge variant={margin >= 30 ? "success" : margin >= 15 ? "warning" : "destructive"} className="text-xs">
                          {margin}%
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>

                    {/* Stock */}
                    <div className="hidden md:block w-20 shrink-0">
                      <Badge variant={lowStock ? "warning" : "secondary"} className="text-xs">
                        {product.currentStock} un
                      </Badge>
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"} className="hidden sm:inline-flex text-xs">
                        {product.status === "ACTIVE" ? "Ativo" : product.isFeatured ? "Destaque" : "Inativo"}
                      </Badge>
                      <button
                        onClick={(e) => handleDelete(e, product.id)}
                        disabled={deletingId === product.id}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
