import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { CatalogClient } from "@/components/catalog/catalog-client"

async function getActiveProducts() {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  })
}

export default async function CatalogPage() {
  const products = await getActiveProducts()

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    salePrice: Number(p.salePrice),
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    imageUrl: p.images[0]?.url ?? null,
  }))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Catálogo Digital" />
      <main className="flex-1 p-6">
        <CatalogClient products={serialized} />
      </main>
    </div>
  )
}
