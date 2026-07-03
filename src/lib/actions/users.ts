"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getUsers() {
  return prisma.profile.findMany({
    orderBy: { name: "asc" },
  })
}

export async function updateUserRole(id: string, role: "ADMIN" | "MANAGER" | "SALES" | "FINANCE") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (me?.role !== "ADMIN") return { error: "Sem permissão" }
  if (id === user.id) return { error: "Você não pode alterar sua própria função" }

  await prisma.profile.update({ where: { id }, data: { role } })
  revalidatePath("/settings")
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: "ADMIN" | "MANAGER" | "SALES" | "FINANCE"
  phone?: string
}) {
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) return { error: "Não autenticado" }

  const myProfile = await prisma.profile.findUnique({ where: { id: me.id } })
  if (myProfile?.role !== "ADMIN") return { error: "Sem permissão" }

  try {
    const admin = createAdminClient()
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    })

    if (authError || !created?.user) return { error: authError?.message ?? "Erro ao criar usuário no Supabase" }

    await prisma.profile.create({
      data: {
        id: created.user.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone ?? null,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (err: unknown) {
    console.error("createUser error:", err)
    return { error: err instanceof Error ? err.message : "Erro inesperado ao criar usuário" }
  }
}

export async function deleteUser(id: string) {
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) return { error: "Não autenticado" }

  const myProfile = await prisma.profile.findUnique({ where: { id: me.id } })
  if (myProfile?.role !== "ADMIN") return { error: "Sem permissão" }
  if (id === me.id) return { error: "Você não pode excluir sua própria conta" }

  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(id)
  await prisma.profile.delete({ where: { id } })

  revalidatePath("/settings")
  return { success: true }
}

export async function toggleUserActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (me?.role !== "ADMIN") return { error: "Sem permissão" }
  if (id === user.id) return { error: "Você não pode desativar sua própria conta" }

  await prisma.profile.update({ where: { id }, data: { active } })
  revalidatePath("/settings")
}
