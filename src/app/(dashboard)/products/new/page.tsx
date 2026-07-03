import { Header } from "@/components/layout/header"
import { ProductForm } from "@/components/products/product-form"
import { getLookups } from "@/lib/actions/products"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewProductPage() {
  const lookups = await getLookups()

  return (
    <div className="flex flex-col flex-1">
      <Header title="Novo produto" />
      <main className="flex-1 p-6 max-w-5xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para produtos
        </Link>
        <ProductForm lookups={lookups} />
      </main>
    </div>
  )
}
