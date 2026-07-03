"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ServiceStatus, ServiceType } from "@prisma/client"

export async function getServiceOrders(filters?: {
  status?: ServiceStatus
  customerId?: string
}) {
  return prisma.serviceOrder.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      product: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getServiceOrder(id: string) {
  return prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      photos: true,
    },
  })
}

export async function createServiceOrder(data: {
  customerId: string
  productId?: string
  productName?: string
  type: ServiceType
  description: string
  estimatedDate?: string
  price?: number
  notes?: string
}) {
  await prisma.serviceOrder.create({
    data: {
      customerId: data.customerId,
      productId: data.productId || null,
      productName: data.productName || null,
      type: data.type,
      description: data.description,
      estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
      price: data.price ?? null,
      notes: data.notes || null,
      status: "RECEIVED",
    },
  })
  revalidatePath("/service")
  return { success: true }
}

export async function updateServiceStatus(
  id: string,
  status: ServiceStatus,
  notes?: string,
  price?: number,
  completedDate?: Date
) {
  await prisma.serviceOrder.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(completedDate !== undefined
        ? { completedDate }
        : status === "DELIVERED"
        ? { completedDate: new Date() }
        : {}),
    },
  })
  revalidatePath("/service")
  return { success: true }
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 2) return []
  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { cpf: { contains: query } },
      ],
      active: true,
    },
    select: { id: true, name: true, phone: true },
    take: 10,
  })
}

export async function searchProducts(query: string) {
  if (!query || query.length < 2) return []
  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
      status: "ACTIVE",
    },
    select: { id: true, name: true, sku: true },
    take: 10,
  })
}

export async function getServiceStats() {
  const [received, inProgress, ready, delivered] = await Promise.all([
    prisma.serviceOrder.count({ where: { status: "RECEIVED" } }),
    prisma.serviceOrder.count({ where: { status: "IN_PROGRESS" } }),
    prisma.serviceOrder.count({ where: { status: "READY" } }),
    prisma.serviceOrder.count({ where: { status: "DELIVERED" } }),
  ])
  return { received, inProgress, ready, delivered }
}
