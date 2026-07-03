"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getWishlist(customerId: string) {
  return prisma.wishlistItem.findMany({
    where: { customerId },
    include: {
      product: {
        select: { id: true, name: true, sku: true, salePrice: true, images: { where: { isPrimary: true }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function addToWishlist(customerId: string, productId: string) {
  const item = await prisma.wishlistItem.upsert({
    where: { customerId_productId: { customerId, productId } },
    update: {},
    create: { customerId, productId },
  })
  revalidatePath(`/customers/${customerId}`)
  return { data: item }
}

export async function removeFromWishlist(customerId: string, productId: string) {
  await prisma.wishlistItem.delete({
    where: { customerId_productId: { customerId, productId } },
  })
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}
