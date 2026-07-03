"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchProducts, searchCustomers, createSale } from "@/lib/actions/sales"
import { validateCoupon } from "@/lib/actions/coupons"
import { formatCurrency } from "@/lib/utils"
import {
  Search, Plus, Minus, Trash2, User, X, UserPlus,
  CreditCard, Banknote, QrCode, ShoppingBag, CheckCircle, Loader2, Ticket,
} from "lucide-react"
import { NewCustomerDialog } from "./new-customer-dialog"

type Product = {
  id: string; name: string; sku: string
  salePrice: { toString(): string }; currentStock: number
  images: { url: string }[]
}

type Customer = { id: string; name: string; phone: string | null; whatsapp: string | null }

type CartItem = {
  productId: string; name: string; sku: string
  unitPrice: number; quantity: number; discount: number; stock: number
}

type PaymentMethod = "PIX" | "CASH" | "CREDIT" | "DEBIT" | "OTHER"

type Payment = { method: PaymentMethod; amount: number; installments: number; cardBrand?: string }

const METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix", CASH: "Dinheiro", CREDIT: "Crédito", DEBIT: "Débito", OTHER: "Outro",
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  PIX: <QrCode className="w-4 h-4" />,
  CASH: <Banknote className="w-4 h-4" />,
  CREDIT: <CreditCard className="w-4 h-4" />,
  DEBIT: <CreditCard className="w-4 h-4" />,
  OTHER: <ShoppingBag className="w-4 h-4" />,
}

export function PosTerminal() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Busca de produtos
  const [productQuery, setProductQuery] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [searchingProduct, setSearchingProduct] = useState(false)
  const productRef = useRef<HTMLInputElement>(null)

  // Busca de cliente
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartDiscount, setCartDiscount] = useState(0)
  const [freight, setFreight] = useState(0)
  const [notes, setNotes] = useState("")

  // Cupom
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState<string | null>(null)
  const [couponError, setCouponError] = useState("")

  // Pagamentos
  const [payments, setPayments] = useState<Payment[]>([])
  const [payMethod, setPayMethod] = useState<PaymentMethod>("PIX")
  const [payAmount, setPayAmount] = useState("")
  const [payInstallments, setPayInstallments] = useState(1)
  const [payCardBrand, setPayCardBrand] = useState("")

  // Estado
  const [step, setStep] = useState<"cart" | "payment" | "done">("cart")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [completedSaleNumber, setCompletedSaleNumber] = useState("")

  // Cálculos
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0)
  const total = Math.max(0, subtotal - cartDiscount - couponDiscount + freight)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = total - totalPaid

  // Busca produto
  useEffect(() => {
    if (productQuery.length < 2) { setProductResults([]); return }
    const t = setTimeout(async () => {
      setSearchingProduct(true)
      const r = await searchProducts(productQuery)
      setProductResults(r as Product[])
      setSearchingProduct(false)
    }, 300)
    return () => clearTimeout(t)
  }, [productQuery])

  // Busca cliente
  useEffect(() => {
    if (customerQuery.length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      const r = await searchCustomers(customerQuery)
      setCustomerResults(r)
    }, 300)
    return () => clearTimeout(t)
  }, [customerQuery])

  function addToCart(product: Product) {
    const price = Number(product.salePrice.toString())
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.currentStock) return prev
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, unitPrice: price, quantity: 1, discount: 0, stock: product.currentStock }]
    })
    setProductQuery("")
    setProductResults([])
    productRef.current?.focus()
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i
      const newQty = Math.max(1, Math.min(i.stock, i.quantity + delta))
      return { ...i, quantity: newQty }
    }))
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function updateItemDiscount(productId: string, discount: number) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, discount: Math.max(0, discount) } : i))
  }

  function addPayment() {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    setPayments((prev) => [...prev, {
      method: payMethod,
      amount,
      installments: payInstallments,
      cardBrand: payCardBrand || undefined,
    }])
    setPayAmount("")
    setPayInstallments(1)
    setPayCardBrand("")
  }

  function fillRemaining() {
    if (remaining > 0) setPayAmount(remaining.toFixed(2))
  }

  async function finalizeSale() {
    if (cart.length === 0 || remaining > 0.01) return
    startTransition(async () => {
      const result = await createSale({
        customerId: selectedCustomer?.id || null,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
        payments,
        discount: cartDiscount + couponDiscount,
        freight,
        notes: notes || null,
        couponCode: couponApplied || undefined,
      })
      if ("data" in result) {
        setCompletedSaleNumber((result.data as any).number)
        setStep("done")
      }
    })
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError("")
    const res = await validateCoupon(couponCode.trim(), subtotal - cartDiscount)
    setCouponLoading(false)
    if ("error" in res) { setCouponError(res.error ?? "Erro"); return }
    setCouponDiscount(res.discount!)
    setCouponApplied(couponCode.toUpperCase())
  }

  function removeCoupon() {
    setCouponCode(""); setCouponDiscount(0); setCouponApplied(null); setCouponError("")
  }

  function newSale() {
    setCart([]); setCartDiscount(0); setFreight(0); setNotes("")
    setPayments([]); setPayAmount(""); setSelectedCustomer(null)
    setCustomerQuery(""); setStep("cart")
    setCouponCode(""); setCouponDiscount(0); setCouponApplied(null); setCouponError("")
    productRef.current?.focus()
  }

  // ── TELA CONCLUÍDA ──
  if (step === "done") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Venda concluída!</h2>
          <p className="text-muted-foreground mt-1">Venda <span className="font-mono font-medium">#{completedSaleNumber}</span> registrada com sucesso.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={newSale} size="lg">Nova venda</Button>
          <Button variant="outline" onClick={() => router.push("/sales")}>Ver vendas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 gap-0 h-[calc(100vh-56px)]">
      {/* ── COLUNA ESQUERDA: produtos + carrinho ── */}
      <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
        {/* Busca produto */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={productRef}
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar produto por nome, SKU ou código de barras..."
              className="pl-9"
              autoFocus
            />
            {searchingProduct && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Resultados da busca */}
          {productResults.length > 0 && (
            <div className="mt-2 border border-border rounded-lg bg-popover shadow-md overflow-hidden">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded bg-muted shrink-0 overflow-hidden">
                    {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-4 h-4 m-2 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(Number(p.salePrice.toString()))}</p>
                    <p className="text-xs text-muted-foreground">{p.currentStock} em estoque</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <ShoppingBag className="w-10 h-10 opacity-20" />
              <p className="text-sm">Adicione produtos ao carrinho</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">Desc. R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount || ""}
                    onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                    className="w-20 h-6 text-xs border border-input rounded px-2 bg-transparent"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-lg border border-input flex items-center justify-center hover:bg-muted">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 rounded-lg border border-input flex items-center justify-center hover:bg-muted disabled:opacity-40">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="text-right shrink-0 w-20">
                <p className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity - item.discount)}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} / un</p>
              </div>

              <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Totais */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-2 bg-card">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Desconto geral R$</span>
              <input
                type="number" min="0" step="0.01"
                value={cartDiscount || ""}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 h-7 text-sm border border-input rounded px-2 bg-transparent text-right"
                placeholder="0,00"
              />
            </div>
            {couponApplied && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Ticket className="w-3 h-3" /> {couponApplied}</span>
                <span className="text-emerald-600">-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Frete R$</span>
              <input
                type="number" min="0" step="0.01"
                value={freight || ""}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                className="w-24 h-7 text-sm border border-input rounded px-2 bg-transparent text-right"
                placeholder="0,00"
              />
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── COLUNA DIREITA: cliente + pagamento ── */}
      <div className="w-80 flex flex-col bg-card overflow-y-auto">
        {/* Dialog de novo cliente */}
        <NewCustomerDialog
          open={showNewCustomer}
          onClose={() => setShowNewCustomer(false)}
          onCreated={(c) => { setSelectedCustomer(c); setCustomerQuery(""); setCustomerResults([]) }}
        />

        {/* Cliente */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
            {!selectedCustomer && (
              <button
                onClick={() => setShowNewCustomer(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <UserPlus className="w-3 h-3" /> Novo cliente
              </button>
            )}
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-[var(--color-gold-50)] border border-[var(--color-gold-200)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-gold-600)]" />
                <span className="text-sm font-medium">{selectedCustomer.name}</span>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerQuery("") }}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-8 h-8 text-sm"
              />
              {customerResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-popover shadow-md z-10 overflow-hidden">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerQuery(""); setCustomerResults([]) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent border-b border-border last:border-0"
                    >
                      <p className="font-medium">{c.name}</p>
                      {(c.phone || c.whatsapp) && <p className="text-xs text-muted-foreground">{c.phone || c.whatsapp}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Observações</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Obs. da venda..."
            className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Cupom */}
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cupom de desconto</p>
          {couponApplied ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-mono font-semibold text-emerald-700">{couponApplied}</span>
                <span className="text-sm text-emerald-600">-{formatCurrency(couponDiscount)}</span>
              </div>
              <button onClick={removeCoupon}><X className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError("") }}
                    placeholder="CÓDIGO"
                    className="pl-8 h-8 text-sm font-mono uppercase"
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={applyCoupon} disabled={couponLoading || !couponCode}>
                  {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Pagamentos */}
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pagamento</p>

          {/* Métodos */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {(["PIX", "CASH", "CREDIT", "DEBIT", "OTHER"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPayMethod(m)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${payMethod === m ? "border-primary bg-[var(--color-gold-50)] text-primary" : "border-input hover:bg-muted"}`}
              >
                {METHOD_ICONS[m]}
                {METHOD_LABELS[m]}
              </button>
            ))}
          </div>

          {(payMethod === "CREDIT" || payMethod === "DEBIT") && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input value={payCardBrand} onChange={(e) => setPayCardBrand(e.target.value)} placeholder="Bandeira" className="h-8 text-sm" />
              {payMethod === "CREDIT" && (
                <select
                  value={payInstallments}
                  onChange={(e) => setPayInstallments(Number(e.target.value))}
                  className="h-8 text-sm border border-input rounded-lg px-2 bg-transparent"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0,00"
                type="number"
                step="0.01"
                className="pl-8 h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addPayment()}
              />
            </div>
            {remaining > 0.01 && (
              <Button variant="outline" size="sm" onClick={fillRemaining} className="text-xs h-8 shrink-0">
                {formatCurrency(remaining)}
              </Button>
            )}
            <Button size="sm" onClick={addPayment} className="h-8 shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Pagamentos adicionados */}
          {payments.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {METHOD_ICONS[p.method]}
                    <span>{METHOD_LABELS[p.method]}</span>
                    {p.installments > 1 && <span className="text-xs text-muted-foreground">{p.installments}x</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                    <button onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumo pagamento */}
          {cart.length > 0 && (
            <div className="space-y-1 text-sm border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago</span>
                <span className="text-emerald-600 font-semibold">{formatCurrency(totalPaid)}</span>
              </div>
              {remaining > 0.01 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restante</span>
                  <span className="text-destructive font-semibold">{formatCurrency(remaining)}</span>
                </div>
              )}
              {totalPaid > total + 0.01 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Troco</span>
                  <span className="font-semibold">{formatCurrency(totalPaid - total)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão finalizar */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || remaining > 0.01 || pending}
            onClick={finalizeSale}
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {pending ? "Processando..." : `Finalizar · ${formatCurrency(total)}`}
          </Button>
          {cart.length > 0 && remaining > 0.01 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Adicione pagamento de {formatCurrency(remaining)} para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
