"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProductsBulk } from "@/lib/actions/products"
import { formatCurrency } from "@/lib/utils"
import {
  FileUp, Loader2, Sparkles, CheckCircle2, AlertCircle,
  Pencil, X, ChevronUp, Package, FileText, Image as ImageIcon, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

type Category = { id: string; name: string; parentId: string | null }

type ExtractedProduct = {
  name: string
  description?: string | null
  quantity: number
  unitCost: number
  totalCost: number
  discount: number
  ipi: number
  icmsSt: number
  freightRateio: number
  finalUnitCost: number
  unit: string
  material?: string | null
  categoryHint?: string | null
  ncm?: string | null
  referenceCode?: string | null
  // mapped to product schema
  freightCost: number
  taxCost: number
  commission: number
  packaging: number
  otherCosts: number
  salePrice: number
  categoryId?: string
  _id: string
  _editing: boolean
  _selected: boolean
  _invoiceIdx: number
}

type InvoiceFile = {
  id: string
  file: File
  preview: string | null
  status: "pending" | "analyzing" | "done" | "error"
  error?: string
  supplier?: string
  invoiceNumber?: string
  invoiceDate?: string
  totalValue?: number
  totalFreight?: number
  totalDiscount?: number
  totalIpi?: number
  totalIcmsSt?: number
  paymentTerms?: string | null
}

const MATERIALS = [
  "Aço Inoxidável", "Prata 925", "Ouro", "Banhado a Ouro",
  "Banhado a Prata", "Banhado a Ródio", "Latão", "Zamac", "Resina", "Outro",
]

interface InvoiceImporterProps {
  categories: Category[]
}

let _uid = 0
function uid() { return String(++_uid) }

export function InvoiceImporter({ categories }: InvoiceImporterProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [invoices, setInvoices] = useState<InvoiceFile[]>([])
  const [products, setProducts] = useState<ExtractedProduct[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ created: number; errors: number } | null>(null)

  const rootCategories = categories.filter((c) => !c.parentId)

  function addFiles(files: File[]) {
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024)
    const newInvoices: InvoiceFile[] = valid.map((f) => ({
      id: uid(),
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      status: "pending",
    }))
    setInvoices((prev) => [...prev, ...newInvoices])
  }

  function removeInvoice(id: string) {
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    setProducts((prev) => prev.filter((p) => !p._id.startsWith(id + "-")))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [])

  async function analyzeAll() {
    const pending = invoices.filter((i) => i.status === "pending")
    if (!pending.length) return
    setAnalyzing(true)

    await Promise.all(pending.map(async (inv) => {
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: "analyzing" } : i))

      const form = new FormData()
      form.append("file", inv.file)

      try {
        const res = await fetch("/api/analyze-invoice", { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Erro na análise")

        setInvoices((prev) => prev.map((i) => i.id === inv.id ? {
          ...i,
          status: "done",
          supplier: data.supplier,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          totalValue: data.totalValue ?? 0,
          totalFreight: data.totalFreight ?? 0,
          totalDiscount: data.totalDiscount ?? 0,
          totalIpi: data.totalIpi ?? 0,
          totalIcmsSt: data.totalIcmsSt ?? 0,
          paymentTerms: data.paymentTerms ?? null,
        } : i))

        setProducts((prev) => [
          ...prev,
          ...(data.products ?? []).map((p: any, pi: number) => {
            const finalUnitCost = p.finalUnitCost > 0 ? p.finalUnitCost : p.unitCost
            return {
              name: p.name,
              description: p.description ?? null,
              quantity: p.quantity ?? 1,
              unitCost: p.unitCost ?? 0,
              totalCost: p.totalCost ?? 0,
              discount: p.discount ?? 0,
              ipi: p.ipi ?? 0,
              icmsSt: p.icmsSt ?? 0,
              freightRateio: p.freightRateio ?? 0,
              finalUnitCost,
              unit: p.unit ?? "UN",
              material: p.material ?? null,
              categoryHint: p.categoryHint ?? null,
              ncm: p.ncm ?? null,
              referenceCode: p.referenceCode ?? null,
              // mapped fields — custo base já inclui frete/imposto no finalUnitCost
              freightCost: p.freightRateio ?? 0,
              taxCost: (p.ipi ?? 0) + (p.icmsSt ?? 0),
              commission: 0,
              packaging: 0,
              otherCosts: 0,
              salePrice: 0,
              categoryId: matchCategory(p.categoryHint, rootCategories) ?? "",
              _id: `${inv.id}-${pi}`,
              _editing: false,
              _selected: true,
              _invoiceIdx: pi,
            } as ExtractedProduct
          }),
        ])
      } catch (err) {
        setInvoices((prev) => prev.map((i) => i.id === inv.id ? {
          ...i,
          status: "error",
          error: err instanceof Error ? err.message : "Erro ao analisar",
        } : i))
      }
    }))

    setAnalyzing(false)
  }

  function updateProduct(id: string, patch: Partial<ExtractedProduct>) {
    setProducts((prev) => prev.map((p) => p._id === id ? { ...p, ...patch } : p))
  }

  function toggleAll(selected: boolean) {
    setProducts((prev) => prev.map((p) => ({ ...p, _selected: selected })))
  }

  async function save() {
    const selected = products.filter((p) => p._selected)
    if (!selected.length) return
    setSaving(true)
    const res = await createProductsBulk(selected.map((p) => ({
      name: p.name,
      description: p.description,
      unitCost: p.finalUnitCost || p.unitCost,
      salePrice: p.salePrice || undefined,
      currentStock: p.quantity,
      categoryId: p.categoryId || null,
      material: p.material,
      referenceCode: p.referenceCode,
      freightCost: p.freightCost,
      taxCost: p.taxCost,
      commission: p.commission,
      packaging: p.packaging,
      otherCosts: p.otherCosts,
    })))
    setSaving(false)
    setDone({ created: res.created, errors: res.errors.length })
  }

  const selectedCount = products.filter((p) => p._selected).length
  const hasPending = invoices.some((i) => i.status === "pending")
  const hasResults = products.length > 0

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold">{done.created} produto{done.created !== 1 ? "s" : ""} cadastrado{done.created !== 1 ? "s" : ""}!</h2>
        {done.errors > 0 && <p className="text-sm text-amber-600">{done.errors} item{done.errors !== 1 ? "s" : ""} com erro foram ignorados.</p>}
        <div className="flex gap-2 justify-center mt-4">
          <Button onClick={() => router.push("/products")}>Ver produtos</Button>
          <Button variant="outline" onClick={() => { setDone(null); setInvoices([]); setProducts([]) }}>
            Importar mais notas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Step 1 — Upload */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
          <h2 className="text-sm font-semibold">Envie as notas fiscais</h2>
          <span className="text-xs text-muted-foreground">— pode selecionar várias de uma vez</span>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-xl transition-colors cursor-pointer p-8",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
            <div className="p-4 rounded-full bg-muted">
              <FileUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Arraste as notas aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP ou PDF · múltiplos arquivos · máx. 10 MB cada</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = "" }}
          />
        </div>

        {invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {invoices.map((inv) => (
              <div key={inv.id} className={cn(
                "flex flex-col gap-2 p-3 rounded-lg border bg-card",
                inv.status === "error" && "border-destructive/40 bg-destructive/5",
                inv.status === "done" && "border-emerald-200 bg-emerald-50/50",
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {inv.preview
                      ? <Image src={inv.preview} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                      : <FileText className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{inv.file.name}</p>
                    <div className="mt-0.5">
                      {inv.status === "pending" && <span className="text-[10px] text-muted-foreground">Aguardando análise</span>}
                      {inv.status === "analyzing" && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Analisando...
                        </span>
                      )}
                      {inv.status === "done" && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {inv.supplier ?? "Concluída"}
                          {inv.invoiceNumber ? ` · Nº ${inv.invoiceNumber}` : ""}
                        </span>
                      )}
                      {inv.status === "error" && (
                        <span className="text-[10px] text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {inv.error ?? "Erro"}
                        </span>
                      )}
                    </div>
                  </div>
                  {inv.status === "pending" && (
                    <button onClick={() => removeInvoice(inv.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Invoice totals summary */}
                {inv.status === "done" && (inv.totalValue ?? 0) > 0 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-2 border-t border-border/60 text-[10px]">
                    <span className="text-muted-foreground">Valor total</span>
                    <span className="text-right font-semibold">{formatCurrency(inv.totalValue ?? 0)}</span>
                    {(inv.totalFreight ?? 0) > 0 && <>
                      <span className="text-muted-foreground">Frete</span>
                      <span className="text-right">{formatCurrency(inv.totalFreight ?? 0)}</span>
                    </>}
                    {(inv.totalDiscount ?? 0) > 0 && <>
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="text-right text-emerald-600">−{formatCurrency(inv.totalDiscount ?? 0)}</span>
                    </>}
                    {(inv.totalIpi ?? 0) > 0 && <>
                      <span className="text-muted-foreground">IPI</span>
                      <span className="text-right">{formatCurrency(inv.totalIpi ?? 0)}</span>
                    </>}
                    {(inv.totalIcmsSt ?? 0) > 0 && <>
                      <span className="text-muted-foreground">ICMS-ST</span>
                      <span className="text-right">{formatCurrency(inv.totalIcmsSt ?? 0)}</span>
                    </>}
                    {inv.paymentTerms && <>
                      <span className="text-muted-foreground">Pgto</span>
                      <span className="text-right truncate">{inv.paymentTerms}</span>
                    </>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasPending && (
          <Button onClick={analyzeAll} disabled={analyzing} className="w-full">
            {analyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando {invoices.filter(i => i.status === "analyzing").length} nota{invoices.filter(i => i.status === "analyzing").length !== 1 ? "s" : ""}...</>
              : <><Sparkles className="w-4 h-4" /> Analisar {invoices.filter(i => i.status === "pending").length} nota{invoices.filter(i => i.status === "pending").length !== 1 ? "s" : ""} com IA</>
            }
          </Button>
        )}
      </div>

      {/* Step 2 — Review */}
      {hasResults && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <h2 className="text-sm font-semibold">Revise e complete os dados de cada produto</h2>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 shrink-0" />
            A IA preencheu os custos automaticamente. Clique no lápis para corrigir ou complementar qualquer campo.
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCount === products.length && products.length > 0}
                onChange={(e) => toggleAll(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-muted-foreground">{selectedCount} de {products.length} selecionados</span>
            </div>
            <Badge variant="secondary">{products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}</Badge>
          </div>

          {invoices.filter(i => i.status === "done").map((inv) => {
            const invProducts = products.filter((p) => p._id.startsWith(inv.id + "-"))
            if (!invProducts.length) return null
            return (
              <div key={inv.id} className="space-y-2">
                <div className="flex items-center gap-2 py-1">
                  {inv.preview
                    ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {inv.file.name}
                    {inv.supplier ? ` · ${inv.supplier}` : ""}
                    {inv.invoiceNumber ? ` · Nº ${inv.invoiceNumber}` : ""}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{invProducts.length} iten{invProducts.length !== 1 ? "s" : ""}</span>
                </div>
                {invProducts.map((p) => (
                  <ProductRow
                    key={p._id}
                    product={p}
                    categories={rootCategories}
                    onChange={(patch) => updateProduct(p._id, patch)}
                  />
                ))}
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-3 border-t border-border sticky bottom-0 bg-background pb-2">
            <p className="text-sm text-muted-foreground">
              {selectedCount} produto{selectedCount !== 1 ? "s" : ""} será{selectedCount !== 1 ? "ão" : ""} cadastrado{selectedCount !== 1 ? "s" : ""}
            </p>
            <Button onClick={save} disabled={saving || selectedCount === 0}>
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
                : <><Package className="w-4 h-4" /> Cadastrar {selectedCount} produto{selectedCount !== 1 ? "s" : ""}</>
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input value={value === 0 ? "" : value} type="number" step="0.01" min="0" placeholder="0,00"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
    </div>
  )
}

function ProductRow({ product, categories, onChange }: {
  product: ExtractedProduct
  categories: Category[]
  onChange: (patch: Partial<ExtractedProduct>) => void
}) {
  const totalCostManual = product.finalUnitCost + product.freightCost + product.taxCost + product.commission + product.packaging + product.otherCosts
  const margin = product.salePrice > 0 ? ((product.salePrice - totalCostManual) / product.salePrice * 100) : null

  return (
    <Card className={cn("transition-opacity", !product._selected && "opacity-50")}>
      <CardContent className="p-0">
        {/* Summary row */}
        <div className="flex items-start gap-3 p-3">
          <input
            type="checkbox"
            checked={product._selected}
            onChange={(e) => onChange({ _selected: e.target.checked })}
            className="w-4 h-4 accent-primary shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{product.name}</span>
              {product.categoryHint && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{product.categoryHint}</Badge>}
              {product.material && <Badge variant="gold" className="text-[10px] py-0 px-1.5">{product.material}</Badge>}
            </div>
            {/* Cost summary chips */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
              <span>Qtd: <strong className="text-foreground">{product.quantity}</strong></span>
              <span>Custo NF: <strong className="text-foreground">{formatCurrency(product.unitCost)}</strong></span>
              {product.discount > 0 && <span className="text-emerald-600">Desc: −{formatCurrency(product.discount)}</span>}
              {product.ipi > 0 && <span>IPI: {formatCurrency(product.ipi)}</span>}
              {product.icmsSt > 0 && <span>ICMS-ST: {formatCurrency(product.icmsSt)}</span>}
              {product.freightRateio > 0 && <span>Frete: {formatCurrency(product.freightRateio)}</span>}
              <span className="font-semibold text-foreground">
                Custo final: {formatCurrency(product.finalUnitCost)}
              </span>
              {product.salePrice > 0 && (
                <span className={cn("font-semibold", margin !== null && margin < 15 ? "text-destructive" : margin !== null && margin < 30 ? "text-amber-600" : "text-emerald-600")}>
                  Margem: {margin?.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" onClick={() => onChange({ _editing: !product._editing })}>
            {product._editing ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </Button>
        </div>

        {/* Edit panel */}
        {product._editing && (
          <div className="px-3 pb-4 border-t border-border space-y-4 pt-3">
            {/* Basic info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Informações básicas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Nome do produto</label>
                  <Input value={product.name} onChange={(e) => onChange({ name: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                  <Input value={product.quantity} type="number" min={1} onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 1 })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Referência fornecedor</label>
                  <Input value={product.referenceCode ?? ""} onChange={(e) => onChange({ referenceCode: e.target.value || null })} className="h-8 text-sm" placeholder="ex: REF-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                  <Select value={product.categoryId ?? ""} onValueChange={(v) => onChange({ categoryId: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Material</label>
                  <Select value={product.material ?? ""} onValueChange={(v) => onChange({ material: v || null })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não identificado</SelectItem>
                      {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Costs from invoice */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custos da nota fiscal</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <CurrencyInput label="Custo unitário NF (R$)" value={product.unitCost} onChange={(v) => onChange({ unitCost: v, finalUnitCost: v - product.discount + product.ipi + product.icmsSt + product.freightRateio })} />
                <CurrencyInput label="Desconto unit. (R$)" value={product.discount} onChange={(v) => onChange({ discount: v, finalUnitCost: product.unitCost - v + product.ipi + product.icmsSt + product.freightRateio })} />
                <CurrencyInput label="IPI unit. (R$)" value={product.ipi} onChange={(v) => onChange({ ipi: v, taxCost: v + product.icmsSt, finalUnitCost: product.unitCost - product.discount + v + product.icmsSt + product.freightRateio })} />
                <CurrencyInput label="ICMS-ST unit. (R$)" value={product.icmsSt} onChange={(v) => onChange({ icmsSt: v, taxCost: product.ipi + v, finalUnitCost: product.unitCost - product.discount + product.ipi + v + product.freightRateio })} />
                <CurrencyInput label="Frete rateado (R$)" value={product.freightRateio} onChange={(v) => onChange({ freightRateio: v, freightCost: v, finalUnitCost: product.unitCost - product.discount + product.ipi + product.icmsSt + v })} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Custo final calculado</label>
                  <div className="h-8 px-3 flex items-center rounded-md border bg-muted text-sm font-semibold text-primary">
                    {formatCurrency(product.finalUnitCost)}
                  </div>
                </div>
              </div>
            </div>

            {/* Extra product costs */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Outros custos do produto</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <CurrencyInput label="Embalagem (R$)" value={product.packaging} onChange={(v) => onChange({ packaging: v })} />
                <CurrencyInput label="Comissão (R$)" value={product.commission} onChange={(v) => onChange({ commission: v })} />
                <CurrencyInput label="Outros (R$)" value={product.otherCosts} onChange={(v) => onChange({ otherCosts: v })} />
              </div>
            </div>

            {/* Sale price */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Precificação</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                <CurrencyInput label="Preço de venda (R$)" value={product.salePrice} onChange={(v) => onChange({ salePrice: v })} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Custo total</label>
                  <div className="h-8 px-3 flex items-center rounded-md border bg-muted text-sm font-semibold">
                    {formatCurrency(totalCostManual)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Margem</label>
                  <div className={cn("h-8 px-3 flex items-center rounded-md border text-sm font-semibold",
                    margin === null ? "bg-muted text-muted-foreground"
                    : margin < 15 ? "bg-destructive/10 text-destructive"
                    : margin < 30 ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700")}>
                    {margin !== null ? `${margin.toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function matchCategory(hint: string | null | undefined, categories: Category[]): string | undefined {
  if (!hint) return undefined
  const lower = hint.toLowerCase()
  return categories.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()))?.id
}
