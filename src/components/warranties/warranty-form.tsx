"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWarranty } from "@/lib/actions/warranties"
import { searchCustomers, searchProducts } from "@/lib/actions/service"
import { Loader2 } from "lucide-react"

type CustomerResult = { id: string; name: string; phone: string | null }
type ProductResult = { id: string; name: string; sku: string }

export function WarrantyForm() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null)

  const [productQuery, setProductQuery] = useState("")
  const [productResults, setProductResults] = useState<ProductResult[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null)

  const [form, setForm] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    saleId: "",
    notes: "",
  })

  useEffect(() => {
    const t = setTimeout(async () => {
      if (customerQuery.length >= 2 && !selectedCustomer) {
        const res = await searchCustomers(customerQuery)
        setCustomerResults(res)
      } else {
        setCustomerResults([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [customerQuery, selectedCustomer])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (productQuery.length >= 2 && !selectedProduct) {
        const res = await searchProducts(productQuery)
        setProductResults(res)
      } else {
        setProductResults([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [productQuery, selectedProduct])

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!selectedCustomer || !selectedProduct || !form.expiryDate) {
      setError("Preencha cliente, produto e data de expiração.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await createWarranty({
      customerId: selectedCustomer.id,
      productId: selectedProduct.id,
      saleId: form.saleId || undefined,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate,
      notes: form.notes || undefined,
    })
    setLoading(false)
    if ("error" in result) {
      setError(result.error as string)
    } else {
      startTransition(() => router.push("/warranties"))
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer */}
          <div className="space-y-1.5 relative">
            <Label>Cliente *</Label>
            {selectedCustomer ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                <span className="flex-1 text-sm font-medium">{selectedCustomer.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedCustomer(null); setCustomerQuery("") }}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Buscar cliente por nome, CPF ou telefone"
                />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-popover border rounded-lg shadow-md mt-1 divide-y divide-border">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => { setSelectedCustomer(c); setCustomerQuery(c.name); setCustomerResults([]) }}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-muted-foreground ml-2">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product */}
          <div className="space-y-1.5 relative">
            <Label>Produto *</Label>
            {selectedProduct ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <span className="text-sm font-medium">{selectedProduct.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{selectedProduct.sku}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedProduct(null); setProductQuery("") }}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar produto por nome ou SKU"
                />
                {productResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-popover border rounded-lg shadow-md mt-1 divide-y divide-border">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => { setSelectedProduct(p); setProductQuery(p.name); setProductResults([]) }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de emissão *</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de expiração *</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Venda relacionada (opcional)</Label>
            <Input
              value={form.saleId}
              onChange={(e) => setForm((f) => ({ ...f, saleId: e.target.value }))}
              placeholder="ID da venda (opcional)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Condições da garantia, observações"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar Garantia
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
