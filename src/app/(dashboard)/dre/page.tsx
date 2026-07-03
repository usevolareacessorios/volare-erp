import { Header } from "@/components/layout/header"
import { getDRE, getCashFlow } from "@/lib/actions/finance"
import { DreClient } from "@/components/finance/dre-client"

export default async function DrePage() {
  const now = new Date()
  const [dre, cashFlow] = await Promise.all([
    getDRE(now.getFullYear(), now.getMonth() + 1),
    getCashFlow(),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="DRE & Fluxo de Caixa" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        <DreClient dre={dre} cashFlow={cashFlow} currentMonth={now.getMonth() + 1} currentYear={now.getFullYear()} />
      </main>
    </div>
  )
}
