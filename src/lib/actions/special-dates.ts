"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSpecialDates(customerId: string) {
  return prisma.specialDate.findMany({
    where: { customerId },
    orderBy: { date: "asc" },
  })
}

export async function addSpecialDate(customerId: string, description: string, date: Date) {
  const specialDate = await prisma.specialDate.create({
    data: { customerId, description, date },
  })
  revalidatePath(`/customers/${customerId}`)
  return { data: specialDate }
}

export async function deleteSpecialDate(id: string, customerId: string) {
  await prisma.specialDate.delete({ where: { id } })
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}
