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
  Pencil, X, ChevronUp, Package, FileText, Image as ImageIcon,
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
  unit: string
  material?: string | null
  categoryHint?: string | null
  ncm?: string | null
  referenceCode?: string | null
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
    setProducts((prev) => prev.filter((p) => {
      const inv = invoices.find((i) => i.id === id)
      if (!inv) return true
      return p._invoiceIdx !== invoices.indexOf(inv)
    }))
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

        const invIdx = invoices.findIndex((i) => i.id === inv.id)

        setInvoices((prev) => prev.map((i) => i.id === inv.id ? {
          ...i,
          status: "done",
          supplier: data.supplier,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
        } : i))

        setProducts((prev) => [
          ...prev,
          ...(data.products ?? []).map((p: ExtractedProduct, pi: number) => ({
            ...p,
            _id: `${inv.id}-${pi}`,
            _editing: false,
            _selected: true,
            _invoiceIdx: invIdx,
            categoryId: matchCategory(p.categoryHint, rootCategories) ?? "",
          })),
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
      unitCost: p.unitCost,
      currentStock: p.quantity,
      categoryId: p.categoryId || null,
      material: p.material,
      referenceCode: p.referenceCode,
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

        {/* Drop zone */}
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

        {/* File list */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card",
                  inv.status === "error" && "border-destructive/40 bg-destructive/5",
                  inv.status === "done" && "border-emerald-200 bg-emerald-50/50",
                )}
              >
                {/* Thumbnail */}
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
            <h2 className="text-sm font-semibold">Revise os produtos extraídos</h2>
          </div>

          {/* Bulk select */}
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

          {/* Products grouped by invoice */}
          {invoices.filter(i => i.status === "done").map((inv, invIdx) => {
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

          {/* Save */}
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

function ProductRow({ product, categories, onChange }: {
  product: ExtractedProduct
  categories: Category[]
  onChange: (patch: Partial<ExtractedProduct>) => void
}) {
  return (
    <Card className={cn("transition-opacity", !product._selected && "opacity-50")}>
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          <input
            type="checkbox"
            checked={product._selected}
            onChange={(e) => onChange({ _selected: e.target.checked })}
            className="w-4 h-4 accent-primary shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{product.name}</span>
              {product.categoryHint && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{product.categoryHint}</Badge>}
              {product.material && <Badge variant="gold" className="text-[10px] py-0 px-1.5">{product.material}</Badge>}
            </div>
            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span>Qtd: <strong className="text-foreground">{product.quantity}</strong></span>
              <span>Custo unit.: <strong className="text-foreground">{formatCurrency(product.unitCost)}</strong></span>
              <span>Total: <strong className="text-foreground">{formatCurrency(product.totalCost)}</strong></span>
              {product.referenceCode && <span>Ref: {product.referenceCode}</span>}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="w-8 h-8 shrink-0" onClick={() => onChange({ _editing: !product._editing })}>
            {product._editing ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </Button>
        </div>

        {product._editing && (
          <div className="px-3 pb-3 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nome do produto</label>
                <Input value={product.name} onChange={(e) => onChange({ name: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Custo unitário (R$)</label>
                <Input value={product.unitCost} type="number" step="0.01" onChange={(e) => onChange({ unitCost: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                <Input value={product.quantity} type="number" onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 1 })} className="h-8 text-sm" />
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
