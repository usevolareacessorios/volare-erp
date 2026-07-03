"use server"

import { prisma } from "@/lib/prisma"

export async function searchProductsForLabel(query: string) {
  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      salePrice: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    take: 20,
  })
}

export async function getProductsForLabel(ids: string[]) {
  return prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      salePrice: true,
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  })
}
