"use server"

import { prisma } from "@/lib/prisma"

export async function getUpcomingBirthdays(days = 7) {
  const customers = await prisma.customer.findMany({
    where: { active: true, birthDate: { not: null } },
    select: { id: true, name: true, phone: true, whatsapp: true, birthDate: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = customers
    .filter((c) => c.birthDate != null)
    .map((c) => {
      const birth = c.birthDate!
      // Birthday this year
      const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
      // If already passed this year, check next year
      const next = thisYear < today
        ? new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate())
        : thisYear
      const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { ...c, daysUntil, nextBirthday: next }
    })
    .filter((c) => c.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return upcoming
}
