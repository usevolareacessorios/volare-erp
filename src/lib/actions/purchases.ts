"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPurchases() {
  return prisma.purchase.findMany({
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function createPurchase(data: {
  supplierId: string
  invoiceNumber?: string | null
  invoiceDate?: string | null
  expectedAt?: string | null
  notes?: string | null
  items: { productId: string; quantity: number; unitCost: number }[]
}) {
  const count = await prisma.purchase.count()
  const number = `PC-${String(count + 1).padStart(4, "0")}`
  const total = data.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)

  const purchase = await prisma.purchase.create({
    data: {
      number,
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber ?? null,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      notes: data.notes ?? null,
      total,
      status: "ORDERED",
      paymentStatus: "PENDING",
      items: {
        create: data.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          total: i.quantity * i.unitCost,
        })),
      },
    },
  })

  // Create financial entry (payable)
  await prisma.financialEntry.create({
    data: {
      type: "EXPENSE",
      description: `Compra ${number}`,
      amount: total,
      dueDate: data.expectedAt ? new Date(data.expectedAt) : new Date(),
      status: "PENDING",
      referenceType: "PURCHASE",
      purchaseId: purchase.id,
    },
  })

  revalidatePath("/purchases")
  return { data: purchase }
}

export async function receivePurchase(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!purchase) return { error: "Compra não encontrada." }

  await prisma.$transaction(async (tx) => {
    // Update stock for each item
    for (const item of purchase.items) {
      const prev = (await tx.product.findUnique({ where: { id: item.productId }, select: { currentStock: true } }))?.currentStock ?? 0
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      })
      await tx.stockEntry.create({
        data: {
          productId: item.productId,
          type: "IN",
          quantity: item.quantity,
          previousQty: prev,
          newQty: prev + item.quantity,
          reason: `Recebimento compra ${purchase.number}`,
          referenceId: purchase.id,
        },
      })
    }
    // Mark purchase received
    await tx.purchase.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    })
  })

  revalidatePath("/purchases")
  revalidatePath("/inventory")
  return { success: true }
}

export async function getSuppliers() {
  return prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } })
}
