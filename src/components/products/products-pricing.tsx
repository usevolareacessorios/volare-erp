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
import {
  Search, Package, ChevronRight, Trash2, TrendingUp, List,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { deleteProduct, deleteProducts, updateProductCosts } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

type Product = {
  id: string; name: string; sku: string; status: string
  currentStock: number; salePrice: number; costPrice: number
  freightCost: number; packaging: number
  category: string | null; images: { url: string }[]
}

type Props = {
  products: Product[]
}

export function ProductsPricing({ products }: Props) {
  const [tab, setTab] = useState<"list" | "pricing">("list")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [marginFilter, setMarginFilter] = useState<"all" | "low" | "ok" | "good">("all")
  const [targetMargin, setTargetMargin] = useState(40)
  const [productMargins, setProductMargins] = useState<Record<string, number>>({})
  const [pendingMargins, setPendingMargins] = useState<Record<string, string>>({})
  const [pendingFreight, setPendingFreight] = useState<Record<string, string>>({})
  const [pendingPackaging, setPendingPackaging] = useState<Record<string, string>>({})
  const [savingCosts, setSavingCosts] = useState<Record<string, boolean>>({})
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  function getMargin(id: string) { return productMargins[id] ?? targetMargin }
  function getPending(id: string) { return pendingMargins[id] ?? String(getMargin(id)) }
  function applyMargin(id: string) {
    const val = Number(pendingMargins[id])
    if (!isNaN(val) && val > 0 && val < 100) setProductMargins((prev) => ({ ...prev, [id]: val }))
  }

  async function saveCosts(p: Product) {
    setSavingCosts((prev) => ({ ...prev, [p.id]: true }))
    const freight = pendingFreight[p.id] !== undefined ? Number(pendingFreight[p.id]) : p.freightCost
    const packaging = pendingPackaging[p.id] !== undefined ? Number(pendingPackaging[p.id]) : p.packaging
    await updateProductCosts(p.id, { freightCost: freight, packaging })
    refresh()
    setSavingCosts((prev) => ({ ...prev, [p.id]: false }))
  }

  const [, startTransition] = useTransition()
  const router = useRouter()

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    if (tab === "list") return matchSearch
    const totalCost = p.costPrice + p.freightCost + p.packaging
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

      {/* ═══ PRICING TAB ═══ */}
      {tab === "pricing" && (
        <div className="space-y-3">

          {/* Controles */}
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

          {/* Tabela de precificação */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo/peça</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Embalagem</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frete</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-orange-50">Custo total</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50">
                      Sugestão {targetMargin}%
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</td></tr>
                  )}
                  {filtered.map((p) => {
                    const productMargin = getMargin(p.id)
                    const liveFreight = pendingFreight[p.id] !== undefined ? Number(pendingFreight[p.id]) : p.freightCost
                    const livePackaging = pendingPackaging[p.id] !== undefined ? Number(pendingPackaging[p.id]) : p.packaging
                    const directCost = p.costPrice + liveFreight + livePackaging
                    const margin = p.salePrice > 0 ? ((p.salePrice - directCost) / p.salePrice) * 100 : null
                    const suggested = directCost > 0 ? directCost / (1 - productMargin / 100) : 0
                    const isExpanded = expandedRow === p.id

                    return (
                      <>
                        <tr key={p.id} className={cn("transition-colors", isExpanded ? "bg-muted/30" : "hover:bg-muted/20")}>
                          <td className="px-4 py-2.5">
                            <Link href={`/products/${p.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                {p.images[0]
                                  ? <Image src={p.images[0].url} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                                  : <Package className="w-4 h-4 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[160px]">{p.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm">{formatCurrency(p.costPrice)}</td>
                          <td className="px-2 py-2.5">
                            <input
                              type="number" min={0} step={0.01}
                              value={pendingPackaging[p.id] ?? p.packaging}
                              onChange={(e) => setPendingPackaging((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="0,00"
                              className="w-20 h-7 text-xs text-right px-2 border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="number" min={0} step={0.01}
                                value={pendingFreight[p.id] ?? p.freightCost}
                                onChange={(e) => setPendingFreight((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="0,00"
                                className="w-20 h-7 text-xs text-right px-2 border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); saveCosts(p) }}
                                disabled={savingCosts[p.id]}
                                className="h-7 px-2 text-[10px] font-semibold rounded bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                {savingCosts[p.id] ? "..." : "OK"}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm bg-orange-50 font-bold">{formatCurrency(directCost)}</td>
                          <td className="px-3 py-2.5 text-right">
                            {margin !== null
                              ? <Badge variant={margin >= 30 ? "success" : margin >= 15 ? "warning" : "destructive"} className="text-xs">{margin.toFixed(1)}%</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2.5 bg-emerald-50">
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number" min={1} max={99}
                                  value={getPending(p.id)}
                                  onChange={(e) => setPendingMargins((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => { if (e.key === "Enter") applyMargin(p.id) }}
                                  className="w-12 h-6 text-xs text-center border border-emerald-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyMargin(p.id) }}
                                  className="h-6 px-1.5 text-[10px] font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                  OK
                                </button>
                              </div>
                              <p className="text-sm font-bold text-emerald-700">
                                {suggested > 0 ? formatCurrency(suggested) : "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-2.5">
                            <button onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                              title="Ver cálculo detalhado">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Linha de detalhamento do cálculo */}
                        {isExpanded && (
                          <tr key={p.id + "_detail"} className="bg-muted/10">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="max-w-sm">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                  Como foi calculado o preço sugerido de {suggested > 0 ? formatCurrency(suggested) : "—"}
                                </p>
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custo/peça (nota)</span>
                                    <span className="font-medium">{formatCurrency(p.costPrice)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">+ Embalagem</span>
                                    <span>{p.packaging > 0 ? formatCurrency(p.packaging) : "—"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">+ Frete</span>
                                    <span>{p.freightCost > 0 ? formatCurrency(p.freightCost) : "—"}</span>
                                  </div>
                                  <div className="flex justify-between font-bold pt-1.5 border-t border-border text-base">
                                    <span>= Custo total</span>
                                    <span className="text-orange-700">{formatCurrency(directCost)}</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground text-xs pt-2">
                                    <span>Fórmula do preço sugerido</span>
                                    <span className="font-mono">{formatCurrency(directCost)} ÷ (1 − {productMargin}%)</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-base text-emerald-700 pt-1 border-t border-emerald-200">
                                    <span>= Preço sugerido</span>
                                    <span>{suggested > 0 ? formatCurrency(suggested) : "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/40">
                      <td className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">TOTAL ({filtered.length} produtos)</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold">{formatCurrency(filtered.reduce((s, p) => s + p.costPrice, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold">{formatCurrency(filtered.reduce((s, p) => s + p.packaging, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold">{formatCurrency(filtered.reduce((s, p) => s + p.freightCost, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold bg-orange-50">
                        {formatCurrency(filtered.reduce((s, p) => s + p.costPrice + p.freightCost + p.packaging, 0))}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ LIST TAB ═══ */}
      {tab === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[auto_auto_2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl items-center">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className="w-10" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo prod.</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo total</span>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Sugerido</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venda atual</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estoque</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
              )}
              {filtered.map((product) => {
                const primaryImage = product.images[0]
                const directCost = product.costPrice + product.freightCost + product.packaging
                const margin = product.salePrice > 0 ? Math.round(((product.salePrice - directCost) / product.salePrice) * 100) : null
                const lowStock = product.currentStock <= 3
                const isSelected = selected.has(product.id)
                const suggested = directCost > 0 ? directCost / (1 - targetMargin / 100) : 0
                const belowSuggested = product.salePrice > 0 && suggested > 0 && product.salePrice < suggested

                return (
                  <div key={product.id} className={`group flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(product.id)}
                      onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0" />

                    <Link href={`/products/${product.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {primaryImage
                          ? <Image src={primaryImage.url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                          : <Package className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                      </div>
                      {/* Custo produto */}
                      <div className="hidden md:block w-24 shrink-0">
                        <p className="text-sm">{formatCurrency(product.costPrice)}</p>
                      </div>
                      {/* Custo total */}
                      <div className="hidden md:block w-24 shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(directCost)}</p>
                      </div>
                      {/* Preço sugerido */}
                      <div className="hidden md:block w-24 shrink-0">
                        <p className="text-sm font-semibold text-emerald-700">{suggested > 0 ? formatCurrency(suggested) : "—"}</p>
                      </div>
                      {/* Preço de venda atual */}
                      <div className="hidden md:block w-24 shrink-0">
                        <p className={`text-sm font-semibold ${belowSuggested ? "text-destructive" : "text-foreground"}`}>
                          {product.salePrice > 0 ? formatCurrency(product.salePrice) : "—"}
                        </p>
                        {belowSuggested && <p className="text-[10px] text-destructive leading-tight">abaixo do sugerido</p>}
                      </div>
                      {/* Estoque */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={lowStock ? "warning" : "secondary"} className="hidden md:inline-flex text-xs">{product.currentStock} un</Badge>
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
