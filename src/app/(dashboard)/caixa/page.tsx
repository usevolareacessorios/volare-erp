import { Header } from "@/components/layout/header"
import { getCurrentRegister, getRegisterHistory } from "@/lib/actions/caixa"
import { CaixaClient } from "@/components/caixa/caixa-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CaixaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  const [register, history] = await Promise.all([
    getCurrentRegister(),
    getRegisterHistory(),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Caixa" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        <CaixaClient
          register={register}
          history={history}
          userId={user.id}
          userName={profile?.name ?? "Operador"}
        />
      </main>
    </div>
  )
}
