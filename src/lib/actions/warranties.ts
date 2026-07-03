"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { WarrantyStatus } from "@prisma/client"

export async function getWarranties(filters?: {
  status?: WarrantyStatus
  customerId?: string
  productId?: string
}) {
  return prisma.warranty.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.productId ? { productId: filters.productId } : {}),
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getWarranty(id: string) {
  return prisma.warranty.findUnique({
    where: { id },
    include: {
      product: true,
      customer: true,
      photos: true,
    },
  })
}

export async function createWarranty(data: {
  productId: string
  customerId: string
  saleId?: string
  issueDate: string
  expiryDate: string
  notes?: string
}) {
  await prisma.warranty.create({
    data: {
      productId: data.productId,
      customerId: data.customerId,
      saleId: data.saleId || null,
      issueDate: new Date(data.issueDate),
      expiryDate: new Date(data.expiryDate),
      notes: data.notes || null,
      status: "ACTIVE",
    },
  })
  revalidatePath("/warranties")
  return { success: true }
}

export async function updateWarrantyStatus(
  id: string,
  status: WarrantyStatus,
  defectDesc?: string,
  resolution?: string
) {
  await prisma.warranty.update({
    where: { id },
    data: {
      status,
      ...(defectDesc !== undefined ? { defectDesc } : {}),
      ...(resolution !== undefined ? { resolution } : {}),
    },
  })
  revalidatePath("/warranties")
  return { success: true }
}

export async function getExpiringWarranties(days: number) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return prisma.warranty.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { gte: now, lte: future },
    },
    include: {
      product: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { expiryDate: "asc" },
  })
}

export async function getWarrantyStats() {
  const now = new Date()
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)

  const [active, expiring, claimed, expired] = await Promise.all([
    prisma.warranty.count({ where: { status: "ACTIVE" } }),
    prisma.warranty.count({
      where: { status: "ACTIVE", expiryDate: { gte: now, lte: in30Days } },
    }),
    prisma.warranty.count({ where: { status: "CLAIMED" } }),
    prisma.warranty.count({ where: { status: "EXPIRED" } }),
  ])

  return { active, expiring, claimed, expired }
}
