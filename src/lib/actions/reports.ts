"use server"

import { prisma } from "@/lib/prisma"
import { StockMovementType } from "@prisma/client"

export async function getSalesReport(from: Date, to: Date) {
  const [sales, itemAgg] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" },
      select: { total: true, createdAt: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: from, lte: to }, status: "COMPLETED" } },
      select: {
        productId: true,
        quantity: true,
        total: true,
        product: { select: { name: true } },
      },
    }),
  ])

  const totalRevenue = sales.reduce((s, v) => s + Number(v.total), 0)
  const totalSales = sales.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>()
  for (const item of itemAgg) {
    const existing = productMap.get(item.productId)
    if (existing) {
      existing.revenue += Number(item.total)
      existing.quantity += item.quantity
    } else {
      productMap.set(item.productId, {
        name: item.product.name,
        revenue: Number(item.total),
        quantity: item.quantity,
      })
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const dayMap = new Map<string, number>()
  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) ?? 0) + Number(s.total))
  }
  const salesByDay = Array.from(dayMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { totalRevenue, totalSales, avgTicket, topProducts, salesByDay }
}

export async function getProductsReport() {
  const [products, saleItemAgg] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, status: true, currentStock: true, minStock: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
    }),
  ])

  const total = products.length
  const active = products.filter((p) => p.status === "ACTIVE").length
  const inactive = total - active
  const outOfStock = products.filter((p) => p.currentStock === 0).length
  const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length

  const salesMap = new Map(
    saleItemAgg.map((r) => [
      r.productId,
      { quantity: Number(r._sum.quantity ?? 0), revenue: Number(r._sum.total ?? 0) },
    ])
  )

  const withSales = products.map((p) => ({
    id: p.id,
    name: p.name,
    quantity: salesMap.get(p.id)?.quantity ?? 0,
    revenue: salesMap.get(p.id)?.revenue ?? 0,
  }))

  const topBySales = [...withSales].sort((a, b) => b.quantity - a.quantity).slice(0, 10)
  const slowMovers = [...withSales]
    .filter((p) => p.quantity === 0)
    .slice(0, 10)

  return { total, active, inactive, outOfStock, lowStock, topBySales, slowMovers }
}

export async function getCustomersReport() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [customers, salesAgg] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        isVip: true,
        createdAt: true,
        lastPurchaseAt: true,
      },
    }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const total = customers.length
  const newThisMonth = customers.filter((c) => c.createdAt >= startOfMonth).length
  const vipCount = customers.filter((c) => c.isVip).length
  const inactive = customers.filter(
    (c) => c.lastPurchaseAt && c.lastPurchaseAt < ninetyDaysAgo
  ).length

  const spendMap = new Map(
    salesAgg.map((r) => [r.customerId!, { total: Number(r._sum.total ?? 0), count: r._count }])
  )

  const allRevenue = salesAgg.reduce((s, r) => s + Number(r._sum.total ?? 0), 0)
  const allSalesCount = salesAgg.reduce((s, r) => s + r._count, 0)
  const avgTicket = allSalesCount > 0 ? allRevenue / allSalesCount : 0

  const topCustomers = customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      totalSpent: spendMap.get(c.id)?.total ?? 0,
      purchaseCount: spendMap.get(c.id)?.count ?? 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

  return { total, newThisMonth, vipCount, inactive, avgTicket, topCustomers }
}

export async function getFinancialReport(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)

  const entries = await prisma.financialEntry.findMany({
    where: { dueDate: { gte: start, lte: end } },
    include: { category: true },
  })

  const income = entries.filter((e) => e.type === "INCOME" && e.status === "PAID")
  const expense = entries.filter((e) => e.type === "EXPENSE" && e.status === "PAID")

  const totalIncome = income.reduce((s, e) => s + Number(e.amount), 0)
  const totalExpense = expense.reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalIncome - totalExpense

  const pendingReceivables = entries
    .filter((e) => e.type === "INCOME" && e.status === "PENDING")
    .reduce((s, e) => s + Number(e.amount), 0)
  const pendingPayables = entries
    .filter((e) => e.type === "EXPENSE" && e.status === "PENDING")
    .reduce((s, e) => s + Number(e.amount), 0)

  const incomeByCategory = groupByCategory(income)
  const expenseByCategory = groupByCategory(expense)

  return {
    totalIncome,
    totalExpense,
    profit,
    pendingReceivables,
    pendingPayables,
    incomeByCategory,
    expenseByCategory,
  }
}

function groupByCategory(
  entries: { category: { name: string } | null; amount: unknown }[]
) {
  const map = new Map<string, number>()
  for (const e of entries) {
    const key = e.category?.name ?? "Sem categoria"
    map.set(key, (map.get(key) ?? 0) + Number(e.amount))
  }
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export async function getStockReport() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStock: true,
        costPrice: true,
      },
    }),
    prisma.stockEntry.findMany({
      where: { createdAt: { gte: start } },
      select: { type: true, quantity: true },
    }),
  ])

  const totalProducts = products.length
  const totalStockValue = products.reduce(
    (s, p) => s + p.currentStock * Number(p.costPrice),
    0
  )
  const outOfStock = products.filter((p) => p.currentStock === 0)
  const lowStock = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStock
  )

  const movementIn = movements
    .filter((m) => m.type === StockMovementType.IN)
    .reduce((s, m) => s + m.quantity, 0)
  const movementOut = movements
    .filter((m) => m.type === StockMovementType.OUT)
    .reduce((s, m) => s + m.quantity, 0)

  return {
    totalProducts,
    totalStockValue,
    outOfStock,
    lowStock,
    movementIn,
    movementOut,
  }
}
