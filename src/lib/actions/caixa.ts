"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { CashEntryType } from "@prisma/client"

export async function getCurrentRegister() {
  return prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: {
      openedBy: { select: { id: true, name: true } },
      entries: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { openedAt: "desc" },
  })
}

export async function openRegister(openingBalance: number, userId: string) {
  const existing = await prisma.cashRegister.findFirst({ where: { status: "OPEN" } })
  if (existing) return { error: "Já existe um caixa aberto." }

  await prisma.cashRegister.create({
    data: {
      openingBalance,
      openedById: userId,
      status: "OPEN",
      entries: {
        create: {
          type: "OPENING",
          amount: openingBalance,
          description: "Abertura de caixa",
          createdById: userId,
        },
      },
    },
  })
  revalidatePath("/caixa")
  return { success: true }
}

export async function closeRegister(
  registerId: string,
  closingBalance: number,
  userId: string
) {
  const register = await prisma.cashRegister.findUnique({
    where: { id: registerId },
    include: { entries: true },
  })
  if (!register) return { error: "Caixa não encontrado." }
  if (register.status === "CLOSED") return { error: "Caixa já está fechado." }

  let expected = Number(register.openingBalance)
  for (const entry of register.entries) {
    if (entry.type === "OPENING") continue
    if (
      entry.type === "SUPRIMENTO" ||
      entry.type === "SALE" ||
      entry.type === "PAYMENT_IN"
    ) {
      expected += Number(entry.amount)
    } else if (entry.type === "SANGRIA") {
      expected -= Number(entry.amount)
    }
  }

  const difference = closingBalance - expected

  await prisma.cashRegister.update({
    where: { id: registerId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: userId,
      closingBalance,
      expectedBalance: expected,
      difference,
      entries: {
        create: {
          type: "CLOSING",
          amount: closingBalance,
          description: "Fechamento de caixa",
          createdById: userId,
        },
      },
    },
  })
  revalidatePath("/caixa")
  return { success: true }
}

export async function addEntry(
  registerId: string,
  type: CashEntryType,
  amount: number,
  description: string,
  userId: string
) {
  await prisma.cashRegisterEntry.create({
    data: { registerId, type, amount, description, createdById: userId },
  })
  revalidatePath("/caixa")
  return { success: true }
}

export async function getRegisterHistory() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  return prisma.cashRegister.findMany({
    where: { openedAt: { gte: since } },
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { openedAt: "desc" },
  })
}

export async function getDailyFlow(registerId: string) {
  return prisma.cashRegisterEntry.findMany({
    where: { registerId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })
}
