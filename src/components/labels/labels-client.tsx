"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { searchProductsForLabel, getProductsForLabel } from "@/lib/actions/labels"
import { Search, X, Printer } from "lucide-react"

type SearchProduct = {
  id: string
  name: string
  sku: string
  barcode: string | null
  salePrice: unknown
  images: { url: string }[]
}

type FullProduct = {
  id: string
  name: string
  sku: string
  barcode: string | null
  salePrice: unknown
  brand: { name: string } | null
  images: { url: string }[]
}

type LabelSize = "small" | "medium" | "large"

const SIZE_DIMENSIONS: Record<LabelSize, { label: string; w: number; h: number }> = {
  small: { label: "Pequena (40×25mm)", w: 151, h: 94 },
  medium: { label: "Média (50×30mm)", w: 189, h: 113 },
  large: { label: "Grande (60×40mm)", w: 227, h: 151 },
}

interface LabelFields {
  name: boolean
  sku: boolean
  barcode: boolean
  price: boolean
  brand: boolean
}

function LabelCard({
  product,
  size,
  fields,
}: {
  product: FullProduct
  size: LabelSize
  fields: LabelFields
}) {
  const { w, h } = SIZE_DIMENSIONS[size]
  return (
    <div
      className="border border-gray-300 flex flex-col justify-between p-1.5 bg-white shrink-0"
      style={{ width: w, height: h, fontSize: 9 }}
    >
      {fields.name && (
        <p className="font-semibold leading-tight line-clamp-2" style={{ fontSize: 10 }}>
          {product.name}
        </p>
      )}
      {fields.brand && product.brand && (
        <p className="text-gray-500">{product.brand.name}</p>
      )}
      {fields.sku && (
        <p className="text-gray-400 font-mono">{product.sku}</p>
      )}
      {fields.barcode && product.barcode && (
        <p className="font-mono tracking-widest text-center" style={{ fontSize: 8 }}>
          {product.barcode}
        </p>
      )}
      {fields.price && (
        <p className="font-bold text-right" style={{ fontSize: 12 }}>
          {formatCurrency(Number(product.salePrice))}
        </p>
      )}
    </div>
  )
}

export function LabelsClient() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchProduct[]>([])
  const [batch, setBatch] = useState<SearchProduct[]>([])
  const [fullProducts, setFullProducts] = useState<FullProduct[]>([])
  const [size, setSize] = useState<LabelSize>("medium")
  const [fields, setFields] = useState<LabelFields>({
    name: true,
    sku: true,
    barcode: true,
    price: true,
    brand: false,
  })
  const [searching, startSearch] = useTransition()
  const [loading, startLoad] = useTransition()

  function handleSearch() {
    if (!query.trim()) return
    startSearch(async () => {
      const res = await searchProductsForLabel(query)
      setResults(res as SearchProduct[])
    })
  }

  function addToBatch(product: SearchProduct) {
    if (batch.some((p) => p.id === product.id)) return
    setBatch((prev) => [...prev, product])
  }

  function removeFromBatch(id: string) {
    setBatch((prev) => prev.filter((p) => p.id !== id))
    setFullProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function loadPreview() {
    startLoad(async () => {
      const ids = batch.map((p) => p.id)
      const res = await getProductsForLabel(ids)
      setFullProducts(res as FullProduct[])
    })
  }

  function toggleField(key: keyof LabelFields) {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-area { display: flex !important; }
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-6 print:hidden">
        {/* Left: search + batch */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome, SKU ou código..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "..." : "Buscar"}
            </Button>
          </div>

          {results.length > 0 && (
            <Card>
              <CardContent className="p-0 divide-y divide-border max-h-64 overflow-y-auto">
                {results.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => addToBatch(p)}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(Number(p.salePrice))}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Produtos selecionados ({batch.length})</h3>
            {batch.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto adicionado.</p>
            ) : (
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {batch.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                      </div>
                      <button onClick={() => removeFromBatch(p.id)}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right: controls + preview */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1">Tamanho</p>
              <Select value={size} onValueChange={(v) => setSize(v as LabelSize)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIZE_DIMENSIONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium mb-2">Conteúdo</p>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(fields) as (keyof LabelFields)[]).map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`field-${key}`}
                      checked={fields[key]}
                      onCheckedChange={() => toggleField(key)}
                    />
                    <Label htmlFor={`field-${key}`} className="text-sm capitalize">{key}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={loadPreview} disabled={loading || batch.length === 0} variant="outline">
                {loading ? "Carregando..." : "Visualizar"}
              </Button>
              <Button onClick={handlePrint} disabled={fullProducts.length === 0}>
                <Printer className="w-4 h-4 mr-1.5" />
                Imprimir
              </Button>
            </div>
          </div>

          {fullProducts.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Prévia</p>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                {fullProducts.map((p) => (
                  <LabelCard key={p.id} product={p} size={size} fields={fields} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print area */}
      <div
        id="print-area"
        className="hidden flex-wrap gap-2 p-4"
        style={{ fontFamily: "monospace" }}
      >
        {fullProducts.map((p) => (
          <LabelCard key={p.id} product={p} size={size} fields={fields} />
        ))}
      </div>
    </>
  )
}
