"use server"

import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations/product"
import { generateSku } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getProducts() {
  return prisma.product.findMany({
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      collection: true,
      brand: true,
      supplier: true,
      images: { orderBy: { order: "asc" } },
    },
  })
}

export async function createProduct(data: unknown) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const values = parsed.data

  // Gera SKU automático
  const count = await prisma.product.count()
  const categoryName = values.categoryId
    ? (await prisma.category.findUnique({ where: { id: values.categoryId } }))?.name ?? "GRL"
    : "GRL"
  const sku = generateSku(categoryName, count + 1)

  const product = await prisma.product.create({
    data: {
      ...values,
      sku,
      weightGrams: values.weightGrams ?? null,
      lengthCm: values.lengthCm ?? null,
      promoPrice: values.promoPrice ?? null,
      wholesalePrice: values.wholesalePrice ?? null,
      marketplacePrice: values.marketplacePrice ?? null,
      resellerPrice: values.resellerPrice ?? null,
      vipPrice: values.vipPrice ?? null,
      videoUrl: values.videoUrl || null,
      warrantyMonths: values.warrantyMonths ?? null,
      warrantyType: values.warrantyType ?? null,
      warrantyConditions: values.warrantyConditions ?? null,
    },
  })

  revalidatePath("/products")
  return { data: product }
}

export async function updateProduct(id: string, data: unknown) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...parsed.data,
      weightGrams: parsed.data.weightGrams ?? null,
      lengthCm: parsed.data.lengthCm ?? null,
      promoPrice: parsed.data.promoPrice ?? null,
      wholesalePrice: parsed.data.wholesalePrice ?? null,
      marketplacePrice: parsed.data.marketplacePrice ?? null,
      resellerPrice: parsed.data.resellerPrice ?? null,
      vipPrice: parsed.data.vipPrice ?? null,
      videoUrl: parsed.data.videoUrl || null,
      warrantyMonths: parsed.data.warrantyMonths ?? null,
      warrantyType: parsed.data.warrantyType ?? null,
      warrantyConditions: parsed.data.warrantyConditions ?? null,
    },
  })

  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
  return { data: product }
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })
  revalidatePath("/products")
  return { success: true }
}

export async function deleteProducts(ids: string[]) {
  await prisma.product.deleteMany({ where: { id: { in: ids } } })
  revalidatePath("/products")
  return { success: true }
}

export async function getLookups() {
  const [categories, collections, brands, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ])
  return { categories, collections, brands, suppliers }
}

export async function createProductsBulk(items: {
  name: string
  description?: string | null
  unitCost?: number
  salePrice?: number
  currentStock?: number
  categoryId?: string | null
  material?: string | null
  referenceCode?: string | null
}[]) {
  const created = []
  const errors = []
  const count0 = await prisma.product.count()

  for (let i = 0; i < items.length; i++) {
    try {
      const item = items[i]
      const categoryName = item.categoryId
        ? (await prisma.category.findUnique({ where: { id: item.categoryId } }))?.name ?? "GRL"
        : "GRL"
      const sku = generateSku(categoryName, count0 + created.length + 1)

      const product = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description ?? null,
          sku,
          costPrice: item.unitCost ?? 0,
          salePrice: item.salePrice ?? (item.unitCost ? item.unitCost * 2.5 : 0),
          currentStock: item.currentStock ?? 0,
          minStock: 3,
          categoryId: item.categoryId ?? null,
          material: item.material ?? null,
          status: "ACTIVE" as const,
        },
      })
      created.push(product)
    } catch (err) {
      errors.push({ index: i, error: err instanceof Error ? err.message : "Erro desconhecido" })
    }
  }

  revalidatePath("/products")
  return { created: created.length, errors }
}
