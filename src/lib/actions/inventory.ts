"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getStockEntries() {
  return prisma.stockEntry.findMany({
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
}

export async function getLowStockProducts() {
  return prisma.product.findMany({
    where: { status: "ACTIVE", currentStock: { lte: prisma.product.fields.minStock } },
    select: { id: true, name: true, sku: true, currentStock: true, minStock: true, category: { select: { name: true } } },
    orderBy: { currentStock: "asc" },
  })
}

export async function getStockSummary() {
  const [total, lowStock, outOfStock, movements] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "ACTIVE", currentStock: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { status: "ACTIVE", currentStock: 0 } }),
    prisma.stockEntry.count(),
  ])
  return { total, lowStock, outOfStock, movements }
}

export async function createManualEntry(data: {
  productId: string
  type: "IN" | "OUT" | "ADJUST"
  quantity: number
  reason?: string | null
}) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } })
  if (!product) return { error: "Produto não encontrado." }

  const newStock = data.type === "OUT"
    ? product.currentStock - data.quantity
    : data.type === "IN"
    ? product.currentStock + data.quantity
    : data.quantity // ADJUST sets absolute value

  if (newStock < 0) return { error: "Estoque insuficiente." }

  const entryQty = data.type === "ADJUST" ? data.quantity - product.currentStock : data.quantity
  await prisma.$transaction([
    prisma.stockEntry.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: entryQty,
        previousQty: product.currentStock,
        newQty: newStock,
        reason: data.reason ?? "Ajuste manual",
      },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data: { currentStock: newStock },
    }),
  ])

  revalidatePath("/inventory")
  revalidatePath("/products")
  return { success: true }
}
