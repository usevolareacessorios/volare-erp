"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { INTEGRATION_META } from "@/lib/integrations-meta"

export async function getIntegrations() {
  return prisma.integration.findMany({ orderBy: { name: "asc" } })
}

export async function saveIntegration(slug: string, config: Record<string, string>, enabled: boolean) {
  const name = INTEGRATION_META[slug]?.name ?? slug
  await prisma.integration.upsert({
    where: { slug },
    create: { slug, name, config, enabled },
    update: { config, enabled, name },
  })
  revalidatePath("/integrations")
  return { success: true }
}

export async function toggleIntegration(slug: string, enabled: boolean) {
  await prisma.integration.upsert({
    where: { slug },
    create: { slug, name: INTEGRATION_META[slug]?.name ?? slug, config: {}, enabled },
    update: { enabled },
  })
  revalidatePath("/integrations")
  return { success: true }
}
