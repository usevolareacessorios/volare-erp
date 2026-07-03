"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createServiceOrder, searchCustomers, searchProducts } from "@/lib/actions/service"
import { Loader2 } from "lucide-react"
import { ServiceType } from "@prisma/client"

type CustomerResult = { id: string; name: string; phone: string | null }
type ProductResult = { id: string; name: string; sku: string }

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "POLISHING", label: "Polimento" },
  { value: "CLASP_CHANGE", label: "Troca de fecho" },
  { value: "STONE_CHANGE", label: "Troca de pedra" },
  { value: "ADJUSTMENT", label: "Ajuste" },
  { value: "PLATING", label: "Banho" },
  { value: "REPAIR", label: "Conserto" },
  { value: "OTHER", label: "Outro" },
]

export function ServiceForm() {
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
    productName: "",
    type: "" as ServiceType | "",
    description: "",
    estimatedDate: "",
    price: "",
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
    if (!selectedCustomer || !form.type || !form.description) {
      setError("Preencha cliente, tipo de serviço e descrição.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await createServiceOrder({
      customerId: selectedCustomer.id,
      productId: selectedProduct?.id,
      productName: selectedProduct ? undefined : form.productName || undefined,
      type: form.type,
      description: form.description,
      estimatedDate: form.estimatedDate || undefined,
      price: form.price ? parseFloat(form.price.replace(",", ".")) : undefined,
      notes: form.notes || undefined,
    })
    setLoading(false)
    if ("error" in result) {
      setError(result.error as string)
    } else {
      startTransition(() => router.push("/service"))
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
                {selectedCustomer.phone && <span className="text-xs text-muted-foreground">{selectedCustomer.phone}</span>}
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
                  autoFocus
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

          {/* Product (optional search or free text) */}
          <div className="space-y-1.5 relative">
            <Label>Peça / Produto (opcional)</Label>
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
                  placeholder="Buscar produto no cadastro (opcional)"
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
                {!productQuery && (
                  <Input
                    className="mt-2"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                    placeholder="Ou descreva a peça livremente"
                  />
                )}
              </>
            )}
          </div>

          {/* Service type */}
          <div className="space-y-1.5">
            <Label>Tipo de serviço *</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as ServiceType }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição do problema *</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva o defeito ou serviço solicitado"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data prevista</Label>
              <Input
                type="date"
                value={form.estimatedDate}
                onChange={(e) => setForm((f) => ({ ...f, estimatedDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor estimado (R$)</Label>
              <Input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observações internas"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Abrir Ordem de Serviço
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
