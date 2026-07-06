import { Header } from "@/components/layout/header"
import { getStockEntries, getStockSummary } from "@/lib/actions/inventory"
import { getProducts } from "@/lib/actions/products"
import { InventoryClient } from "@/components/inventory/inventory-client"
import { Card, CardContent } from "@/components/ui/card"
import { Package, AlertTriangle, XCircle, ArrowLeftRight } from "lucide-react"

export default async function InventoryPage() {
  const [entries, summary, allProducts] = await Promise.all([
    getStockEntries(),
    getStockSummary(),
    getProducts(),
  ])

  const products = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    currentStock: p.currentStock,
    minStock: p.minStock,
    salePrice: Number(p.salePrice),
    costPrice: Number(p.costPrice),
    freightCost: Number((p as any).freightCost ?? 0),
    taxCost: Number((p as any).taxCost ?? 0),
    commission: Number((p as any).commission ?? 0),
    packaging: Number((p as any).packaging ?? 0),
    otherCosts: Number((p as any).otherCosts ?? 0),
    category: (p as any).category?.name ?? null,
  }))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Estoque" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Produtos ativos</p>
              <p className="text-2xl font-bold mt-1">{summary.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10"><Package className="w-4 h-4 text-primary" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estoque baixo</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{summary.lowStock}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Sem estoque</p>
              <p className="text-2xl font-bold mt-1 text-destructive">{summary.outOfStock}</p>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="w-4 h-4 text-destructive" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Movimentações</p>
              <p className="text-2xl font-bold mt-1">{summary.movements}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50"><ArrowLeftRight className="w-4 h-4 text-emerald-600" /></div>
          </CardContent></Card>
        </div>

        <InventoryClient entries={entries} products={products} pricingProducts={products} />
      </main>
    </div>
  )
}
