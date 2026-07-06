import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getProducts } from "@/lib/actions/products"
import { ProductsList } from "@/components/products/products-list"
import { ProductsPricing } from "@/components/products/products-pricing"
import { Plus, Package, FileUp } from "lucide-react"
import { prisma } from "@/lib/prisma"

async function getMonthlyExpenses() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const entries = await prisma.financialEntry.findMany({
    where: {
      type: "EXPENSE",
      dueDate: { gte: start, lte: end },
    },
    include: { category: true },
  })
  return entries
}

export default async function ProductsPage() {
  const [products, expenses] = await Promise.all([
    getProducts(),
    getMonthlyExpenses(),
  ])

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Produtos" />
      <main className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Catálogo de produtos</h2>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/products/import">
                <FileUp className="w-4 h-4" /> Importar nota
              </Link>
            </Button>
            <Button asChild>
              <Link href="/products/new">
                <Plus className="w-4 h-4" /> Novo produto
              </Link>
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="p-3 rounded-full bg-[var(--color-gold-100)]">
                <Package className="w-6 h-6 text-[var(--color-gold-600)]" />
              </div>
              <p className="font-medium">Nenhum produto cadastrado</p>
              <p className="text-sm text-muted-foreground">Comece adicionando seu primeiro produto ao catálogo.</p>
              <Button asChild className="mt-2">
                <Link href="/products/new"><Plus className="w-4 h-4" /> Cadastrar produto</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ProductsPricing
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              status: p.status,
              currentStock: p.currentStock,
              salePrice: Number(p.salePrice),
              costPrice: Number(p.costPrice),
              freightCost: Number((p as any).freightCost ?? 0),
              taxCost: Number((p as any).taxCost ?? 0),
              commission: Number((p as any).commission ?? 0),
              packaging: Number((p as any).packaging ?? 0),
              otherCosts: Number((p as any).otherCosts ?? 0),
              category: (p as any).category?.name ?? null,
              images: (p as any).images ?? [],
            }))}
            totalExpenses={totalExpenses}
            activeProducts={activeProducts}
            expenses={expenses.map((e) => ({
              description: e.description,
              amount: Number(e.amount),
              category: e.category?.name ?? "Sem categoria",
            }))}
          />
        )}
      </main>
    </div>
  )
}
