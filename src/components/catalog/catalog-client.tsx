"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Share2 } from "lucide-react"

interface CatalogProduct {
  id: string
  name: string
  sku: string
  salePrice: number
  category: { id: string; name: string } | null
  imageUrl: string | null
}

interface CatalogClientProps {
  products: CatalogProduct[]
}

export function CatalogClient({ products }: CatalogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      if (p.category) map.set(p.category.id, p.category.name)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  const filtered = useMemo(
    () => selectedCategory === "all" ? products : products.filter((p) => p.category?.id === selectedCategory),
    [products, selectedCategory]
  )

  function handleShare() {
    const list = filtered.map((p) => `• ${p.name} — ${formatCurrency(p.salePrice)}`).join("\n")
    const text = encodeURIComponent(`Confira nosso catálogo Volare Acessórios:\n\n${list}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div>
      {/* Toolbar — hidden on print */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          Gerar PDF / Imprimir
        </Button>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhar no WhatsApp
        </Button>
      </div>

      {/* Print header — shown only on print */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Volare Acessórios</h1>
        <p className="text-sm text-gray-500">Catálogo de produtos — {today}</p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-3">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border border-border overflow-hidden bg-card flex flex-col print:border-gray-300"
          >
            <div className="aspect-square bg-muted relative">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sem foto
                </div>
              )}
            </div>
            <div className="p-2.5 flex flex-col gap-0.5">
              {product.category && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide print:text-gray-400">
                  {product.category.name}
                </span>
              )}
              <p className="text-xs font-medium leading-tight line-clamp-2">{product.name}</p>
              <p className="text-sm font-bold mt-1">{formatCurrency(product.salePrice)}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</p>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block *, .print\\:grid, .print\\:grid * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  )
}
