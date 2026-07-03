"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createManualEntry } from "@/lib/actions/inventory"
import { formatDateTime } from "@/lib/utils"
import { ArrowDown, ArrowUp, RefreshCw, Plus, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Entry = {
  id: string; type: string; quantity: number
  reason: string | null; createdAt: Date
  product: { id: string; name: string; sku: string }
}
type Product = { id: string; name: string; sku: string; currentStock: number; minStock: number }

const TYPE_ICON: Record<string, React.ReactNode> = {
  IN: <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />,
  OUT: <ArrowUp className="w-3.5 h-3.5 text-red-500" />,
  ADJUST: <RefreshCw className="w-3.5 h-3.5 text-amber-500" />,
}
const TYPE_LABEL: Record<string, string> = { IN: "Entrada", OUT: "Saída", ADJUST: "Ajuste" }
const TYPE_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  IN: "success", OUT: "destructive", ADJUST: "warning",
}

export function InventoryClient({ entries, products }: { entries: Entry[]; products: Product[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [tab, setTab] = useState<"movements" | "alerts">("movements")
  const [search, setSearch] = useState("")

  const lowStock = products.filter((p) => p.currentStock <= p.minStock)
  const filteredEntries = entries.filter((e) =>
    !search || e.product.name.toLowerCase().includes(search.toLowerCase()) || e.product.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
          {(["movements", "alerts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t === "movements" ? "Movimentações" : (
                <span className="flex items-center gap-1.5">
                  Alertas
                  {lowStock.length > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">{lowStock.length}</span>}
                </span>
              )}
            </button>
          ))}
          <Button size="sm" className="ml-2" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Ajuste manual
          </Button>
        </div>

        {tab === "movements" && (
          <div className="space-y-3">
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            {filteredEntries.length === 0
              ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada.</CardContent></Card>
              : (
                <Card><CardContent className="p-0 divide-y divide-border">
                  {filteredEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        e.type === "IN" ? "bg-emerald-50" : e.type === "OUT" ? "bg-red-50" : "bg-amber-50"
                      )}>
                        {TYPE_ICON[e.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.product.name}</p>
                        <p className="text-xs text-muted-foreground">{e.reason ?? TYPE_LABEL[e.type]} · {e.product.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={TYPE_VARIANT[e.type]} className="text-xs">
                          {e.type === "IN" ? "+" : e.type === "OUT" ? "-" : "="}{Math.abs(e.quantity)}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(e.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent></Card>
              )
            }
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-2">
            {lowStock.length === 0
              ? <Card><CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Todos os produtos estão com estoque adequado.</p>
                </CardContent></Card>
              : lowStock.map((p) => (
                  <Card key={p.id} className={cn("border-l-4", p.currentStock === 0 ? "border-l-destructive" : "border-l-amber-400")}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <AlertTriangle className={cn("w-4 h-4 shrink-0", p.currentStock === 0 ? "text-destructive" : "text-amber-500")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-sm font-bold", p.currentStock === 0 ? "text-destructive" : "text-amber-600")}>
                          {p.currentStock} un
                        </p>
                        <p className="text-[11px] text-muted-foreground">mín: {p.minStock}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
            }
          </div>
        )}
      </div>

      <ManualEntryDialog
        open={showNew}
        products={products}
        onClose={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); startTransition(() => router.refresh()) }}
      />
    </>
  )
}

function ManualEntryDialog({ open, products, onClose, onCreated }: {
  open: boolean; products: Product[]; onClose: () => void; onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState("")
  const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN")
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const selectedProduct = products.find((p) => p.id === productId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) { setError("Selecione um produto."); return }
    setLoading(true); setError("")
    const res = await createManualEntry({ productId, type, quantity: parseInt(quantity) || 1, reason: reason || null })
    setLoading(false)
    if (res && "error" in res) { setError(res.error ?? "Erro"); return }
    setProductId(""); setType("IN"); setQuantity("1"); setReason("")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajuste de estoque</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Produto *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} <span className="text-muted-foreground text-xs ml-1">({p.currentStock} em estoque)</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {(["IN", "OUT", "ADJUST"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-colors",
                  type === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{type === "ADJUST" ? "Novo total em estoque" : "Quantidade"}</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              {selectedProduct && type !== "ADJUST" && (
                <p className="text-[11px] text-muted-foreground">
                  Estoque atual: {selectedProduct.currentStock} → {
                    type === "IN" ? selectedProduct.currentStock + (parseInt(quantity) || 0)
                    : selectedProduct.currentStock - (parseInt(quantity) || 0)
                  }
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Devolução, quebra..." />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Registrar
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
