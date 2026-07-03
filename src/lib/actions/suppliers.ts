"use server"

import { prisma } from "@/lib/prisma"
import { supplierSchema } from "@/lib/validations/supplier"
import { revalidatePath } from "next/cache"

export async function getSuppliers() {
  return prisma.supplier.findMany({
    include: {
      _count: { select: { products: true, purchases: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, sku: true, currentStock: true, salePrice: true },
        orderBy: { name: "asc" },
      },
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { products: true, purchases: true } },
    },
  })
}

export async function createSupplier(data: unknown) {
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supplier = await prisma.supplier.create({ data: parsed.data })
  revalidatePath("/suppliers")
  return { data: supplier }
}

export async function updateSupplier(id: string, data: unknown) {
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })
  revalidatePath("/suppliers")
  revalidatePath(`/suppliers/${id}`)
  return { data: supplier }
}

export async function toggleSupplierActive(id: string, active: boolean) {
  await prisma.supplier.update({ where: { id }, data: { active } })
  revalidatePath("/suppliers")
}
