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
import { createPurchase, receivePurchase, getSuppliers } from "@/lib/actions/purchases"
import { searchProducts } from "@/lib/actions/sales"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Loader2, ShoppingCart, CheckCircle2, Truck, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Purchase = {
  id: string; number: string; status: string; paymentStatus: string
  total: unknown; invoiceNumber: string | null; invoiceDate: Date | null
  expectedAt: Date | null; receivedAt: Date | null; notes: string | null
  createdAt: Date
  supplier: { id: string; name: string }
  items: { id: string; quantity: number; unitCost: unknown; product: { name: string; sku: string } }[]
}

const STATUS_LABEL: Record<string, string> = { ORDERED: "Pedido", RECEIVED: "Recebido", CANCELLED: "Cancelado" }
const STATUS_VARIANT: Record<string, "secondary" | "success" | "destructive" | "warning"> = {
  ORDERED: "warning", RECEIVED: "success", CANCELLED: "destructive",
}

export function PurchasesClient({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [receiving, setReceiving] = useState<string | null>(null)

  async function handleReceive(id: string) {
    setReceiving(id)
    await receivePurchase(id)
    setReceiving(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{purchases.length} compra{purchases.length !== 1 ? "s" : ""}</p>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Nova compra
          </Button>
        </div>

        {purchases.length === 0 && (
          <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="p-3 rounded-full bg-primary/10"><ShoppingCart className="w-6 h-6 text-primary" /></div>
            <p className="font-medium">Nenhuma compra registrada</p>
            <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Nova compra</Button>
          </CardContent></Card>
        )}

        {purchases.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <button
              className="w-full text-left"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold font-mono text-sm">{p.number}</span>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    {p.invoiceNumber && <span className="text-xs text-muted-foreground">NF {p.invoiceNumber}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.supplier.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {p.expectedAt && <span>Prev. chegada: {formatDate(p.expectedAt)}</span>}
                    {p.receivedAt && <span className="text-emerald-600">Recebido: {formatDate(p.receivedAt)}</span>}
                    <span>{p.items.length} iten{p.items.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatCurrency(Number(p.total))}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.createdAt)}</p>
                </div>
              </CardContent>
            </button>

            {expanded === p.id && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {p.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm bg-muted/30">
                      <div>
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.product.sku}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span>{item.quantity}x {formatCurrency(Number(item.unitCost))}</span>
                        <span className="text-muted-foreground ml-2">= {formatCurrency(item.quantity * Number(item.unitCost))}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                {p.status === "ORDERED" && (
                  <Button size="sm" onClick={() => handleReceive(p.id)} disabled={receiving === p.id}>
                    {receiving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Confirmar recebimento
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <NewPurchaseDialog open={showNew} onClose={() => setShowNew(false)} onCreated={() => {
        setShowNew(false)
        startTransition(() => router.refresh())
      }} />
    </>
  )
}

type CartItem = { productId: string; name: string; sku: string; quantity: number; unitCost: number }
type Supplier = { id: string; name: string }
type ProductResult = { id: string; name: string; sku: string; costPrice: unknown }

function NewPurchaseDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [expectedAt, setExpectedAt] = useState("")
  const [notes, setNotes] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")

  async function loadSuppliers() {
    if (suppliers.length > 0) return
    const data = await getSuppliers()
    setSuppliers(data)
  }

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const data = await searchProducts(q)
    setResults(data as ProductResult[])
    setSearching(false)
  }

  function addToCart(p: ProductResult) {
    setCart((prev) => {
      const exists = prev.find((i) => i.productId === p.id)
      if (exists) return prev.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: p.id, name: p.name, sku: p.sku, quantity: 1, unitCost: Number(p.costPrice) || 0 }]
    })
    setSearch(""); setResults([])
  }

  function updateItem(id: string, field: "quantity" | "unitCost", val: number) {
    setCart((prev) => prev.map((i) => i.productId === id ? { ...i, [field]: val } : i))
  }

  const total = cart.reduce((s, i) => s + i.quantity * i.unitCost, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId) { setError("Selecione um fornecedor."); return }
    if (!cart.length) { setError("Adicione ao menos um produto."); return }
    setLoading(true); setError("")
    const res = await createPurchase({ supplierId, invoiceNumber: invoiceNumber || null, invoiceDate: invoiceDate || null, expectedAt: expectedAt || null, notes: notes || null, items: cart })
    setLoading(false)
    if ("error" in res) { setError(String(res.error)); return }
    setCart([]); setSupplierId(""); setInvoiceNumber(""); setInvoiceDate(""); setExpectedAt(""); setNotes("")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova compra</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier + meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Fornecedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} onOpenChange={(o) => o && loadSuppliers()}>
                <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nº da nota fiscal</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="00000" />
            </div>
            <div className="space-y-1.5">
              <Label>Data da nota</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Previsão de chegada</Label>
              <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {/* Product search */}
          <div className="space-y-1.5">
            <Label>Adicionar produto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => handleSearch(e.target.value)} />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {results.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {results.map((p) => (
                  <button key={p.id} type="button" onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{p.sku}</span>
                    <span className="text-xs">{formatCurrency(Number(p.costPrice))}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <Label>Itens da compra</Label>
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.productId, "quantity", parseInt(e.target.value) || 1)} className="w-16 h-7 text-sm text-center px-1" />
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input type="number" min={0} step={0.01} value={item.unitCost} onChange={(e) => updateItem(item.productId, "unitCost", parseFloat(e.target.value) || 0)} className="w-24 h-7 text-sm px-2" />
                    <span className="text-xs w-20 text-right shrink-0">{formatCurrency(item.quantity * item.unitCost)}</span>
                    <button type="button" onClick={() => setCart((p) => p.filter((i) => i.productId !== item.productId))} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end px-3 py-2 bg-muted/30">
                  <span className="text-sm font-semibold">Total: {formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Registrar compra
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
