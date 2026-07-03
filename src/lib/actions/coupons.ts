"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon) return { error: "Cupom não encontrado." }
  if (!coupon.active) return { error: "Cupom inativo." }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: "Cupom expirado." }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { error: "Cupom esgotado." }
  if (coupon.minAmount && subtotal < Number(coupon.minAmount)) {
    return { error: `Valor mínimo para este cupom: R$ ${Number(coupon.minAmount).toFixed(2).replace(".", ",")}` }
  }
  const discount = coupon.type === "PERCENTAGE"
    ? (subtotal * Number(coupon.value)) / 100
    : Math.min(Number(coupon.value), subtotal)
  return { coupon, discount: Math.round(discount * 100) / 100 }
}

export async function createCoupon(data: {
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  minAmount?: number | null
  maxUses?: number | null
  expiresAt?: string | null
}) {
  const exists = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } })
  if (exists) return { error: "Já existe um cupom com esse código." }

  await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minAmount: data.minAmount ?? null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
  revalidatePath("/settings")
  return { success: true }
}

export async function toggleCoupon(id: string, active: boolean) {
  await prisma.coupon.update({ where: { id }, data: { active } })
  revalidatePath("/settings")
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } })
  revalidatePath("/settings")
}
