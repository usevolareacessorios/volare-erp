"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CommissionStatus } from "@prisma/client"

export async function getCommissions(filters?: {
  sellerId?: string
  status?: CommissionStatus
  month?: Date
}) {
  const now = filters?.month ?? new Date()
  const start = filters?.month
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : undefined
  const end = filters?.month
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    : undefined

  return prisma.commission.findMany({
    where: {
      ...(filters?.sellerId ? { sellerId: filters.sellerId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(start && end ? { createdAt: { gte: start, lte: end } } : {}),
    },
    include: {
      sale: { select: { number: true, total: true } },
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getSellerRanking(month?: Date) {
  const now = month ?? new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const commissions = await prisma.commission.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      sale: { select: { total: true } },
      seller: { select: { id: true, name: true } },
    },
  })

  const map = new Map<
    string,
    {
      sellerId: string
      sellerName: string
      totalSales: number
      saleCount: number
      totalCommission: number
      pendingCommission: number
    }
  >()

  for (const c of commissions) {
    const existing = map.get(c.sellerId)
    const saleTotal = Number(c.sale.total)
    const commission = Number(c.amount)
    const pending = c.status === "PENDING" ? commission : 0
    if (existing) {
      existing.totalSales += saleTotal
      existing.saleCount += 1
      existing.totalCommission += commission
      existing.pendingCommission += pending
    } else {
      map.set(c.sellerId, {
        sellerId: c.sellerId,
        sellerName: c.seller.name,
        totalSales: saleTotal,
        saleCount: 1,
        totalCommission: commission,
        pendingCommission: pending,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales)
}

export async function markCommissionPaid(id: string) {
  await prisma.commission.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  })
  revalidatePath("/commissions")
  return { success: true }
}

export async function getCommissionSummary() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [pending, paidMonth, sellers] = await Promise.all([
    prisma.commission.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.commission.groupBy({ by: ["sellerId"] }),
  ])

  return {
    totalPending: Number(pending._sum.amount ?? 0),
    totalPaidThisMonth: Number(paidMonth._sum.amount ?? 0),
    sellersCount: sellers.length,
  }
}
