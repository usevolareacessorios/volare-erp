"use server"

import { prisma } from "@/lib/prisma"
import { customerSchema } from "@/lib/validations/customer"
import { revalidatePath } from "next/cache"

export async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      _count: { select: { sales: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      wishlistItems: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, salePrice: true, images: { where: { isPrimary: true }, take: 1 } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      specialDates: { orderBy: { date: "asc" } },
      _count: { select: { sales: true } },
    },
  })
}

export async function createCustomer(data: unknown) {
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { birthDate, ...rest } = parsed.data
  const customer = await prisma.customer.create({
    data: {
      ...rest,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  })
  revalidatePath("/customers")
  return { data: customer }
}

export async function updateCustomer(id: string, data: unknown) {
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { birthDate, ...rest } = parsed.data
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...rest,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  })
  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
  return { data: customer }
}

export async function getCustomerStats() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [total, newThisMonth, birthdays] = await Promise.all([
    prisma.customer.count({ where: { active: true } }),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.customer.findMany({
      where: {
        active: true,
        birthDate: { not: null },
      },
      select: { id: true, name: true, birthDate: true, whatsapp: true, phone: true },
    }),
  ])

  const thisMonthBirthdays = birthdays.filter((c) => {
    if (!c.birthDate) return false
    const bd = new Date(c.birthDate)
    return bd.getMonth() === today.getMonth()
  })

  return { total, newThisMonth, birthdays: thisMonthBirthdays }
}
