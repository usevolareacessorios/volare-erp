"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

interface PaymentEntry {
  method: "PIX" | "CASH" | "CREDIT" | "DEBIT" | "OTHER"
  amount: number
  installments: number
  cardBrand?: string
}

interface CreateSaleInput {
  customerId?: string | null
  sellerId?: string | null
  items: SaleItem[]
  payments: PaymentEntry[]
  discount: number
  freight: number
  couponCode?: string | null
  notes?: string | null
}

async function getNextSaleNumber(): Promise<string> {
  const count = await prisma.sale.count()
  return `V${String(count + 1).padStart(5, "0")}`
}

export async function createSale(input: CreateSaleInput) {
  const subtotal = input.items.reduce((sum, i) => {
    return sum + (i.unitPrice * i.quantity) - i.discount
  }, 0)

  const total = subtotal - input.discount + input.freight
  const number = await getNextSaleNumber()

  const sale = await prisma.$transaction(async (tx) => {
    // 1. Criar venda
    const sale = await tx.sale.create({
      data: {
        number,
        customerId: input.customerId || null,
        sellerId: input.sellerId || null,
        status: "COMPLETED",
        subtotal,
        discount: input.discount,
        freight: input.freight,
        total,
        couponCode: input.couponCode || null,
        notes: input.notes || null,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            total: (i.unitPrice * i.quantity) - i.discount,
          })),
        },
        payments: {
          create: input.payments.map((p) => ({
            method: p.method,
            amount: p.amount,
            installments: p.installments,
            cardBrand: p.cardBrand || null,
          })),
        },
      },
    })

    // 2. Baixar estoque + registrar movimentação
    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { currentStock: true },
      })
      const previousQty = product?.currentStock ?? 0
      const newQty = Math.max(0, previousQty - item.quantity)

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: newQty },
      })

      await tx.stockEntry.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          previousQty,
          newQty,
          reason: `Venda #${number}`,
          referenceId: sale.id,
        },
      })
    }

    // 3. Criar lançamento financeiro
    await tx.financialEntry.create({
      data: {
        type: "INCOME",
        description: `Venda #${number}`,
        amount: total,
        dueDate: new Date(),
        paidAt: new Date(),
        status: "PAID",
        referenceType: "SALE",
        referenceId: sale.id,
        saleId: sale.id,
      },
    })

    // 4. Atualizar cliente
    if (input.customerId) {
      await tx.customer.update({
        where: { id: input.customerId },
        data: { lastPurchaseAt: new Date() },
      })
    }

    // 5. Incrementar uso do cupom
    if (input.couponCode) {
      await tx.coupon.update({
        where: { code: input.couponCode },
        data: { usedCount: { increment: 1 } },
      })
    }

    return sale
  })

  revalidatePath("/sales")
  revalidatePath("/")
  revalidatePath("/finance")
  return { data: sale }
}

export async function getSales() {
  return prisma.sale.findMany({
    include: {
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    take: 20,
  })
}

export async function searchCustomers(query: string) {
  return prisma.customer.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { whatsapp: { contains: query, mode: "insensitive" } },
        { cpf: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, phone: true, whatsapp: true },
    take: 10,
  })
}
