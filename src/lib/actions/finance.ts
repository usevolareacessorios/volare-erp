"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EntryType, EntryStatus } from "@prisma/client"

export async function getFinancialEntries(filters?: {
  type?: EntryType
  status?: EntryStatus
  from?: string
  to?: string
}) {
  return prisma.financialEntry.findMany({
    where: {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.from || filters?.to
        ? {
            dueDate: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: { category: true, costCenter: true },
    orderBy: { dueDate: "asc" },
  })
}

export async function getFinancialSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [incomes, expenses, pending, overdue] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: { type: "INCOME", status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: { type: "EXPENSE", status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialEntry.aggregate({
      where: { status: "OVERDUE" },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    incomesMonth: Number(incomes._sum.amount ?? 0),
    expensesMonth: Number(expenses._sum.amount ?? 0),
    pendingAmount: Number(pending._sum.amount ?? 0),
    pendingCount: pending._count,
    overdueAmount: Number(overdue._sum.amount ?? 0),
    overdueCount: overdue._count,
  }
}

export async function getFinancialCategories() {
  return prisma.financialCategory.findMany({ orderBy: { name: "asc" } })
}

export async function createFinancialEntry(data: {
  type: EntryType
  description: string
  amount: number
  dueDate: string
  categoryId?: string | null
  notes?: string | null
}) {
  await prisma.financialEntry.create({
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      categoryId: data.categoryId || null,
      notes: data.notes || null,
      status: "PENDING",
      referenceType: "MANUAL",
    },
  })
  revalidatePath("/finance")
  return { success: true }
}

export async function markAsPaid(id: string) {
  await prisma.financialEntry.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  })
  revalidatePath("/finance")
  return { success: true }
}

export async function markAsOverdue(id: string) {
  await prisma.financialEntry.update({
    where: { id },
    data: { status: "OVERDUE" },
  })
  revalidatePath("/finance")
  return { success: true }
}

export async function deleteFinancialEntry(id: string) {
  const entry = await prisma.financialEntry.findUnique({ where: { id } })
  if (!entry || entry.referenceType !== "MANUAL") {
    return { error: "Não é possível excluir lançamentos automáticos." }
  }
  await prisma.financialEntry.delete({ where: { id } })
  revalidatePath("/finance")
  return { success: true }
}

export async function saveExpenseBatch(items: { categoryId: string; description: string; amount: number; dueDate: string }[]) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  for (const item of items) {
    // Check if there's already a MANUAL EXPENSE for this category this month
    const existing = await prisma.financialEntry.findFirst({
      where: {
        type: "EXPENSE",
        referenceType: "MANUAL",
        categoryId: item.categoryId,
        dueDate: { gte: startOfMonth, lte: endOfMonth },
      },
    })
    if (existing) {
      await prisma.financialEntry.update({
        where: { id: existing.id },
        data: { amount: item.amount, dueDate: new Date(item.dueDate), description: item.description },
      })
    } else {
      await prisma.financialEntry.create({
        data: {
          type: "EXPENSE",
          description: item.description,
          amount: item.amount,
          dueDate: new Date(item.dueDate),
          categoryId: item.categoryId,
          status: "PENDING",
          referenceType: "MANUAL",
        },
      })
    }
  }

  revalidatePath("/finance")
  return { success: true }
}

export async function createFinancialCategory(data: { name: string; type: EntryType }) {
  await prisma.financialCategory.create({ data })
  revalidatePath("/finance")
  return { success: true }
}

export async function getDRE(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const [incomeEntries, expenseEntries, salesRevenue] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { type: "INCOME", status: "PAID", paidAt: { gte: start, lte: end } },
      include: { category: { select: { name: true } } },
    }),
    prisma.financialEntry.findMany({
      where: { type: "EXPENSE", status: "PAID", paidAt: { gte: start, lte: end } },
      include: { category: { select: { name: true } } },
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: start, lte: end } },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const totalIncome = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalExpense = expenseEntries.reduce((s, e) => s + Number(e.amount), 0)
  const grossRevenue = Number(salesRevenue._sum.total ?? 0)
  const netProfit = totalIncome - totalExpense

  // Group by category
  const byCategory = (entries: typeof incomeEntries) => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      const cat = e.category?.name ?? "Sem categoria"
      map[cat] = (map[cat] ?? 0) + Number(e.amount)
    }
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  }

  return {
    grossRevenue,
    salesCount: salesRevenue._count,
    totalIncome,
    totalExpense,
    netProfit,
    incomeByCategory: byCategory(incomeEntries),
    expenseByCategory: byCategory(expenseEntries),
  }
}

export async function getCashFlow() {
  const now = new Date()
  // Last 6 months + next 3 months
  const months = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) }
  })

  const results = await Promise.all(months.map(async ({ year, month, label }) => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    const [inc, exp, pending] = await Promise.all([
      prisma.financialEntry.aggregate({ where: { type: "INCOME", status: "PAID", paidAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.financialEntry.aggregate({ where: { type: "EXPENSE", status: "PAID", paidAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.financialEntry.aggregate({ where: { status: "PENDING", dueDate: { gte: start, lte: end } }, _sum: { amount: true } }),
    ])
    return {
      label,
      income: Number(inc._sum.amount ?? 0),
      expense: Number(exp._sum.amount ?? 0),
      balance: Number(inc._sum.amount ?? 0) - Number(exp._sum.amount ?? 0),
      pending: Number(pending._sum.amount ?? 0),
    }
  }))

  return results
}
