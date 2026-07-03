"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ── Categories ──
export async function getCategories() {
  return prisma.category.findMany({
    include: {
      children: true,
      _count: { select: { products: true } },
    },
    where: { parentId: null },
    orderBy: { name: "asc" },
  })
}

export async function createCategory(name: string, parentId?: string | null) {
  if (!name.trim()) return { error: "Nome obrigatório" }
  const existing = await prisma.category.findUnique({ where: { name: name.trim() } })
  if (existing) return { error: "Já existe uma categoria com esse nome" }
  const category = await prisma.category.create({
    data: { name: name.trim(), parentId: parentId || null },
  })
  revalidatePath("/settings")
  return { data: category }
}

export async function deleteCategory(id: string) {
  const inUse = await prisma.product.count({ where: { categoryId: id } })
  if (inUse > 0) return { error: `Esta categoria está vinculada a ${inUse} produto(s)` }
  await prisma.category.delete({ where: { id } })
  revalidatePath("/settings")
  return { success: true }
}

// ── Collections ──
export async function getCollections() {
  return prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

export async function createCollection(name: string) {
  if (!name.trim()) return { error: "Nome obrigatório" }
  const existing = await prisma.collection.findUnique({ where: { name: name.trim() } })
  if (existing) return { error: "Já existe uma coleção com esse nome" }
  const collection = await prisma.collection.create({ data: { name: name.trim() } })
  revalidatePath("/settings")
  return { data: collection }
}

export async function deleteCollection(id: string) {
  const inUse = await prisma.product.count({ where: { collectionId: id } })
  if (inUse > 0) return { error: `Esta coleção está vinculada a ${inUse} produto(s)` }
  await prisma.collection.delete({ where: { id } })
  revalidatePath("/settings")
  return { success: true }
}

// ── Brands ──
export async function getBrands() {
  return prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

export async function createBrand(name: string) {
  if (!name.trim()) return { error: "Nome obrigatório" }
  const existing = await prisma.brand.findUnique({ where: { name: name.trim() } })
  if (existing) return { error: "Já existe uma marca com esse nome" }
  const brand = await prisma.brand.create({ data: { name: name.trim() } })
  revalidatePath("/settings")
  return { data: brand }
}

export async function deleteBrand(id: string) {
  const inUse = await prisma.product.count({ where: { brandId: id } })
  if (inUse > 0) return { error: `Esta marca está vinculada a ${inUse} produto(s)` }
  await prisma.brand.delete({ where: { id } })
  revalidatePath("/settings")
  return { success: true }
}
