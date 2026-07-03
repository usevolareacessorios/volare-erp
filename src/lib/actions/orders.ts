"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function convertOrderToSale(id: string) {
  await prisma.sale.update({
    where: { id },
    data: { status: "COMPLETED" },
  })
  revalidatePath("/orders")
  return { success: true }
}

export async function cancelOrder(id: string) {
  await prisma.sale.update({
    where: { id },
    data: { status: "CANCELLED" },
  })
  revalidatePath("/orders")
  return { success: true }
}
