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
import { Search, Package, ChevronRight, Trash2, TrendingUp, List, Info } from "lucide-react"
import { deleteProduct, deleteProducts } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

type Product = {
  id: string; name: string; sku: string; status: string
  currentStock: number; salePrice: number; costPrice: number
  freightCost: number; taxCost: number; commission: number
  packaging: number; otherCosts: number
  category: string | null; images: { url: string }[]
}

type Expense = { description: string; amount: number; category: string }

type Props = {
  products: Product[]
  totalExpenses: number
  activeProducts: number
  expenses: Expense[]
}

export function ProductsPricing({ products, totalExpenses, activeProducts, expenses }: Props) {
  const [tab, setTab] = useState<"list" | "pricing">("list")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [marginFilter, setMarginFilter] = useState<"all" | "low" | "ok" | "good">("all")
  const [targetMargin, setTargetMargin] = useState(40)
  const [showExpenses, setShowExpenses] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const overheadPerProduct = activeProducts > 0 ? totalExpenses / activeProducts : 0

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    if (tab === "list") return matchSearch
    const totalCost = p.costPrice + p.freightCost + p.taxCost + p.commission + p.packaging + p.otherCosts + overheadPerProduct
    const margin = p.salePrice > 0 ? ((p.salePrice - totalCost) / p.salePrice) * 100 : 0
    const matchMargin = marginFilter === "all"
      || (marginFilter === "low" && margin < 15)
      || (marginFilter === "ok" && margin >= 15 && margin < 30)
      || (marginFilter === "good" && margin >= 30)
    return matchSearch && matchMargin
  })

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id))) }
  function toggleOne(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function refresh() { startTransition(() => router.refresh()) }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    if (!confirm("Excluir este produto?")) return
    setDeletingId(id)
    await deleteProduct(id)
    setDeletingId(null)
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    refresh()
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selected)
    if (!confirm(`Excluir ${ids.length} produto${ids.length > 1 ? "s" : ""}?`)) return
    setDeletingBulk(true)
    await deleteProducts(ids)
    setSelected(new Set())
    setDeletingBulk(false)
    refresh()
  }

  return (
    <div className="space-y-3">
      {/* Tabs + search + actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          <button onClick={() => setTab("list")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <List className="w-3.5 h-3.5" /> Lista
          </button>
          <button onClick={() => setTab("pricing")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === "pricing" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <TrendingUp className="w-3.5 h-3.5" /> Precificação
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={deletingBulk}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {deletingBulk ? "Excluindo..." : `Excluir ${selected.size}`}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
        {selected.size > 0 && ` · ${selected.size} selecionado${selected.size > 1 ? "s" : ""}`}
      </p>

      {/* PRICING TAB */}
      {tab === "pricing" && (
        <div className="space-y-3">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 rounded-lg bg-muted">
              {(["all", "low", "ok", "good"] as const).map((f) => (
                <button key={f} onClick={() => setMarginFilter(f)}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    marginFilter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {f === "all" ? "Todos" : f === "low" ? "🔴 < 15%" : f === "ok" ? "🟡 15–30%" : "🟢 > 30%"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Margem alvo:</span>
              <Input type="number" min={1} max={99} value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="w-16 h-7 text-xs text-center" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>

          {/* Overhead banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Rateio de despesas fixas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(totalExpenses)} de gastos este mês ÷ {activeProducts} produtos ativos
                      = <span className="font-semibold text-foreground">{formatCurrency(overheadPerProduct)}/produto</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowExpenses(!showExpenses)}
                    className="text-xs text-primary underline underline-offset-2">
                    {showExpenses ? "Ocultar" : "Ver detalhes"}
                  </button>
                  <Link href="/finance" className="text-xs text-muted-foreground underline underline-offset-2">
                    Gerenciar despesas →
                  </Link>
                </div>
              </div>

              {showExpenses && expenses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {expenses.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{e.description} <span className="opacity-60">({e.category})</span></span>
                      <span className="font-medium ml-2 shrink-0">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-xs text-muted-foreground col-span-2">Nenhuma despesa lançada este mês. <Link href="/finance" className="text-primary underline">Lançar agora →</Link></p>
                  )}
                </div>
              )}

              {totalExpenses === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma despesa lançada este mês. <Link href="/finance" className="underline">Lance suas despesas fixas</Link> para o cálculo ficar completo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pricing table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo prod.</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frete</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impostos</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comissão</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Embalagem</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outros</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-primary/5">Overhead</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-orange-50">Custo total</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço atual</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-emerald-50">Sugestão {targetMargin}%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</td></tr>
                  )}
                  {filtered.map((p) => {
                    const totalCost = p.costPrice + p.freightCost + p.taxCost + p.commission + p.packaging + p.otherCosts + overheadPerProduct
                    const margin = p.salePrice > 0 ? ((p.salePrice - totalCost) / p.salePrice) * 100 : 0
                    const suggested = totalCost > 0 ? totalCost / (1 - targetMargin / 100) : 0
                    const below = suggested > 0 && p.salePrice > 0 && p.salePrice < suggested
                    const marginVariant = margin >= 30 ? "success" : margin >= 15 ? "warning" : "destructive"

                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/products/${p.id}`} className="hover:text-primary transition-colors">
                            <p className="text-sm font-medium truncate max-w-[180px]">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm">{formatCurrency(p.costPrice)}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{p.freightCost > 0 ? formatCurrency(p.freightCost) : "—"}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{p.taxCost > 0 ? formatCurrency(p.taxCost) : "—"}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{p.commission > 0 ? formatCurrency(p.commission) : "—"}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{p.packaging > 0 ? formatCurrency(p.packaging) : "—"}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{p.otherCosts > 0 ? formatCurrency(p.otherCosts) : "—"}</td>
                        <td className="px-3 py-2.5 text-right text-sm bg-primary/5 text-primary font-medium">{formatCurrency(overheadPerProduct)}</td>
                        <td className="px-3 py-2.5 text-right text-sm bg-orange-50 font-semibold">{formatCurrency(totalCost)}</td>
                        <td className="px-3 py-2.5 text-right text-sm font-semibold">{p.salePrice > 0 ? formatCurrency(p.salePrice) : "—"}</td>
                        <td className="px-3 py-2.5 text-right">
                          {p.salePrice > 0
                            ? <Badge variant={marginVariant} className="text-xs">{margin.toFixed(1)}%</Badge>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right bg-emerald-50">
                          <p className={cn("text-sm font-semibold", below ? "text-amber-600" : "text-emerald-700")}>
                            {suggested > 0 ? formatCurrency(suggested) : "—"}
                          </p>
                          {below && <p className="text-[10px] text-amber-600">↑ preço baixo</p>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/40">
                      <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">TOTAL ({filtered.length} produtos)</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold">{formatCurrency(filtered.reduce((s, p) => s + p.costPrice, 0))}</td>
                      <td colSpan={5} />
                      <td className="px-3 py-2.5 text-right text-xs font-semibold bg-primary/5">{formatCurrency(overheadPerProduct * filtered.length)}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold bg-orange-50">
                        {formatCurrency(filtered.reduce((s, p) => s + p.costPrice + p.freightCost + p.taxCost + p.commission + p.packaging + p.otherCosts + overheadPerProduct, 0))}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LIST TAB */}
      {tab === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[auto_auto_2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl items-center">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className="w-10" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço venda</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estoque</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
              )}
              {filtered.map((product) => {
                const primaryImage = product.images[0]
                const totalCost = product.costPrice + product.freightCost + product.taxCost + product.commission + product.packaging + product.otherCosts
                const margin = product.salePrice > 0 ? Math.round(((product.salePrice - totalCost) / product.salePrice) * 100) : null
                const lowStock = product.currentStock <= 3
                const isSelected = selected.has(product.id)

                return (
                  <div key={product.id} className={`group flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(product.id)}
                      onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0" />

                    <Link href={`/products/${product.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {primaryImage ? (
                          <Image src={primaryImage.url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                      </div>
                      <div className="hidden md:block w-24 shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(product.salePrice)}</p>
                      </div>
                      <div className="hidden md:block w-20 shrink-0">
                        {margin !== null ? (
                          <Badge variant={margin >= 30 ? "success" : margin >= 15 ? "warning" : "destructive"} className="text-xs">{margin}%</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                      <div className="hidden md:block w-20 shrink-0">
                        <Badge variant={lowStock ? "warning" : "secondary"} className="text-xs">{product.currentStock} un</Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"} className="hidden sm:inline-flex text-xs">
                          {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </Link>

                    <button onClick={(e) => handleDelete(e, product.id)} disabled={deletingId === product.id}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                      title="Excluir produto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
