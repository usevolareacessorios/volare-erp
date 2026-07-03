"use client"

import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { productSchema, type ProductFormData } from "@/lib/validations/product"
import { createProduct, updateProduct } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Loader2, Save } from "lucide-react"
import { ProductImageUploader } from "@/components/products/product-image-uploader"

interface Lookup { id: string; name: string }
type ProductImage = { id: string; url: string; isPrimary: boolean; order: number }

interface ProductFormProps {
  lookups: { categories: Lookup[]; collections: Lookup[]; brands: Lookup[]; suppliers: Lookup[] }
  defaultValues?: Partial<ProductFormData>
  productId?: string
  sku?: string
  images?: ProductImage[]
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function ProductForm({ lookups, defaultValues, productId, sku, images = [] }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      status: "ACTIVE",
      isFeatured: false,
      isExclusive: false,
      costPrice: 0,
      freightCost: 0,
      taxCost: 0,
      commission: 0,
      packaging: 0,
      otherCosts: 0,
      salePrice: 0,
      currentStock: 0,
      minStock: 0,
      ...defaultValues,
    },
  })

  const watched = watch()

  const totalCost = useMemo(() => {
    return (
      Number(watched.costPrice || 0) +
      Number(watched.freightCost || 0) +
      Number(watched.taxCost || 0) +
      Number(watched.commission || 0) +
      Number(watched.packaging || 0) +
      Number(watched.otherCosts || 0)
    )
  }, [watched.costPrice, watched.freightCost, watched.taxCost, watched.commission, watched.packaging, watched.otherCosts])

  const salePrice = Number(watched.salePrice || 0)
  const profit = salePrice - totalCost
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0
  const markup = totalCost > 0 ? (profit / totalCost) * 100 : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit: SubmitHandler<any> = async (data: ProductFormData) => {
    setLoading(true)
    setServerError("")
    const result = productId
      ? await updateProduct(productId, data)
      : await createProduct(data)

    if ("error" in result && result.error) {
      setServerError("Verifique os campos e tente novamente.")
      setLoading(false)
      return
    }
    router.push("/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="info">
        <TabsList className="mb-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="costs">Custos & Preços</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          {productId && <TabsTrigger value="photos">Fotos</TabsTrigger>}
        </TabsList>

        {/* ── ABA 1: INFORMAÇÕES ── */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Dados gerais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Nome do produto *" error={errors.name?.message}>
                  <Input {...register("name")} placeholder="Ex: Brinco Argola Dourado" />
                </Field>
              </div>

              {sku && (
                <Field label="SKU (gerado automaticamente)">
                  <Input value={sku} disabled className="font-mono bg-muted" />
                </Field>
              )}

              <Field label="Categoria">
                <Select onValueChange={(v) => setValue("categoryId", v)} defaultValue={defaultValues?.categoryId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {lookups.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Coleção">
                <Select onValueChange={(v) => setValue("collectionId", v)} defaultValue={defaultValues?.collectionId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {lookups.collections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Marca">
                <Select onValueChange={(v) => setValue("brandId", v)} defaultValue={defaultValues?.brandId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {lookups.brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Fornecedor">
                <Select onValueChange={(v) => setValue("supplierId", v)} defaultValue={defaultValues?.supplierId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {lookups.suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Características</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Material">
                <Select
                  onValueChange={(v) => setValue("material", v)}
                  defaultValue={defaultValues?.material ?? ""}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aço Inoxidável">Aço Inoxidável</SelectItem>
                    <SelectItem value="Prata 925">Prata 925</SelectItem>
                    <SelectItem value="Ouro">Ouro</SelectItem>
                    <SelectItem value="Banhado a Ouro">Banhado a Ouro</SelectItem>
                    <SelectItem value="Banhado a Prata">Banhado a Prata</SelectItem>
                    <SelectItem value="Banhado a Ródio">Banhado a Ródio</SelectItem>
                    <SelectItem value="Latão">Latão</SelectItem>
                    <SelectItem value="Zamac">Zamac</SelectItem>
                    <SelectItem value="Resina">Resina</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Banho"><Input {...register("plating")} placeholder="Ex: Ouro 18k" /></Field>
              <Field label="Cor"><Input {...register("color")} placeholder="Ex: Dourado" /></Field>
              <Field label="Pedra"><Input {...register("stone")} placeholder="Ex: Zircônia" /></Field>
              <Field label="Peso (g)"><Input {...register("weightGrams")} type="number" step="0.01" placeholder="0" /></Field>
              <Field label="Comprimento (cm)"><Input {...register("lengthCm")} type="number" step="0.1" placeholder="0" /></Field>
              <Field label="Tamanho"><Input {...register("size")} placeholder="Ex: P / M / G" /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Descrição">
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Descreva o produto..."
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </Field>
              <Field label="Observações internas">
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Notas internas..."
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Vídeo do produto</CardTitle></CardHeader>
            <CardContent>
              <Field label="URL do vídeo (YouTube ou outro)">
                <Input {...register("videoUrl")} placeholder="https://..." />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Garantia</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Prazo de garantia (meses)">
                <Input {...register("warrantyMonths")} type="number" min="0" placeholder="Ex: 6" />
              </Field>
              <Field label="Tipo de garantia">
                <Select onValueChange={(v) => setValue("warrantyType", v as "manufacturer" | "store" | "none")} defaultValue={defaultValues?.warrantyType ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Do fabricante</SelectItem>
                    <SelectItem value="store">Da loja</SelectItem>
                    <SelectItem value="none">Sem garantia</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-3">
                <Field label="Condições da garantia">
                  <textarea
                    {...register("warrantyConditions")}
                    rows={2}
                    placeholder="Descreva as condições..."
                    className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select onValueChange={(v) => setValue("status", v as "ACTIVE" | "INACTIVE")} defaultValue={defaultValues?.status ?? "ACTIVE"}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={watched.isFeatured}
                    onCheckedChange={(v) => setValue("isFeatured", !!v)}
                  />
                  <span className="text-sm">Produto em destaque</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={watched.isExclusive}
                    onCheckedChange={(v) => setValue("isExclusive", !!v)}
                  />
                  <span className="text-sm">Produto exclusivo</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 2: CUSTOS & PREÇOS ── */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Composição de custos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Valor pago (custo)"><Input {...register("costPrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                <Field label="Frete"><Input {...register("freightCost")} type="number" step="0.01" placeholder="0,00" /></Field>
                <Field label="Impostos"><Input {...register("taxCost")} type="number" step="0.01" placeholder="0,00" /></Field>
                <Field label="Comissão"><Input {...register("commission")} type="number" step="0.01" placeholder="0,00" /></Field>
                <Field label="Embalagem"><Input {...register("packaging")} type="number" step="0.01" placeholder="0,00" /></Field>
                <Field label="Outros custos"><Input {...register("otherCosts")} type="number" step="0.01" placeholder="0,00" /></Field>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-medium">Custo real total</span>
                  <span className="font-bold text-base">{formatCurrency(totalCost)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Preços de venda</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Preço de venda *" error={errors.salePrice?.message}>
                    <Input {...register("salePrice")} type="number" step="0.01" placeholder="0,00" />
                  </Field>
                  <Field label="Preço promocional"><Input {...register("promoPrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                  <Field label="Preço atacado"><Input {...register("wholesalePrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                  <Field label="Preço marketplace"><Input {...register("marketplacePrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                  <Field label="Preço revendedor"><Input {...register("resellerPrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                  <Field label="Preço VIP"><Input {...register("vipPrice")} type="number" step="0.01" placeholder="0,00" /></Field>
                </CardContent>
              </Card>

              {/* Indicadores calculados */}
              <Card className="bg-[var(--color-gold-50)] border-[var(--color-gold-200)]">
                <CardHeader><CardTitle className="text-sm text-[var(--color-gold-700)]">Rentabilidade</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Lucro bruto</p>
                    <p className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margem</p>
                    <p className={`font-bold ${margin >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Markup</p>
                    <p className="font-bold">{markup.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Custo real</p>
                    <p className="font-bold">{formatCurrency(totalCost)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── ABA 3: ESTOQUE ── */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Estoque inicial</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Quantidade em estoque" error={errors.currentStock?.message}>
                <Input {...register("currentStock")} type="number" placeholder="0" />
              </Field>
              <Field label="Estoque mínimo (alerta)">
                <Input {...register("minStock")} type="number" placeholder="0" />
              </Field>
              <Field label="Localização">
                <Input {...register("location")} placeholder="Ex: Prateleira A2" />
              </Field>
            </CardContent>
          </Card>

          {watched.currentStock <= watched.minStock && watched.minStock > 0 && (
            <Badge variant="warning" className="text-sm py-1.5 px-3">
              ⚠ Estoque abaixo do mínimo configurado
            </Badge>
          )}
        </TabsContent>
        {/* ── ABA 4: FOTOS (edit only) ── */}
        {productId && (
          <TabsContent value="photos">
            <ProductImageUploader productId={productId} initialImages={images} />
          </TabsContent>
        )}
      </Tabs>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {productId ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
