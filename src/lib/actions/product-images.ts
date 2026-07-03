"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteProductImage(imageId: string, productId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (!image) return { error: "Imagem não encontrada" }

  // Delete from storage
  const supabase = await createClient()
  const path = image.url.split("/volare-erp/")[1]
  if (path) {
    await supabase.storage.from("volare-erp").remove([path])
  }

  await prisma.productImage.delete({ where: { id: imageId } })

  // If deleted was primary, promote next
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { order: "asc" } })
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
  }

  revalidatePath(`/products/${productId}`)
}

export async function setPrimaryImage(imageId: string, productId: string) {
  await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } })
  await prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } })
  revalidatePath(`/products/${productId}`)
}

export async function getProductImages(productId: string) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
  })
}
