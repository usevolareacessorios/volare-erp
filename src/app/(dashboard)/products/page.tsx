import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getProducts } from "@/lib/actions/products"
import { ProductsList } from "@/components/products/products-list"
import { Plus, Package, FileUp } from "lucide-react"

export default async function ProductsPage() {
  const products = await getProducts()

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
          <ProductsList products={products} />
        )}
      </main>
    </div>
  )
}
