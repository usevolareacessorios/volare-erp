import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ProductForm } from "@/components/products/product-form"
import { getProduct, getLookups } from "@/lib/actions/products"
import { getProductImages } from "@/lib/actions/product-images"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, lookups, images] = await Promise.all([getProduct(id), getLookups(), getProductImages(id)])

  if (!product) notFound()

  return (
    <div className="flex flex-col flex-1">
      <Header title={product.name} />
      <main className="flex-1 p-6 max-w-5xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para produtos
        </Link>
        <ProductForm
          lookups={lookups}
          productId={product.id}
          sku={product.sku}
          images={images}
          defaultValues={{
            name: product.name,
            categoryId: product.categoryId,
            collectionId: product.collectionId,
            brandId: product.brandId,
            supplierId: product.supplierId,
            material: product.material,
            plating: product.plating,
            color: product.color,
            stone: product.stone,
            weightGrams: product.weightGrams ? Number(product.weightGrams) : undefined,
            lengthCm: product.lengthCm ? Number(product.lengthCm) : undefined,
            size: product.size,
            description: product.description,
            notes: product.notes,
            status: product.status,
            isFeatured: product.isFeatured,
            isExclusive: product.isExclusive,
            costPrice: Number(product.costPrice),
            freightCost: Number(product.freightCost),
            taxCost: Number(product.taxCost),
            commission: Number(product.commission),
            packaging: Number(product.packaging),
            otherCosts: Number(product.otherCosts),
            salePrice: Number(product.salePrice),
            promoPrice: product.promoPrice ? Number(product.promoPrice) : undefined,
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined,
            marketplacePrice: product.marketplacePrice ? Number(product.marketplacePrice) : undefined,
            resellerPrice: product.resellerPrice ? Number(product.resellerPrice) : undefined,
            currentStock: product.currentStock,
            minStock: product.minStock,
            location: product.location,
            videoUrl: product.videoUrl ?? undefined,
            vipPrice: product.vipPrice ? Number(product.vipPrice) : undefined,
            warrantyMonths: product.warrantyMonths ?? undefined,
            warrantyType: product.warrantyType as "manufacturer" | "store" | "none" | undefined ?? undefined,
            warrantyConditions: product.warrantyConditions ?? undefined,
          }}
        />
      </main>
    </div>
  )
}
