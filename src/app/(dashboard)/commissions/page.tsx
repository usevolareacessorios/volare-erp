import { Header } from "@/components/layout/header"
import { getCommissions, getSellerRanking, getCommissionSummary } from "@/lib/actions/commissions"
import { CommissionsClient } from "@/components/commissions/commissions-client"

export default async function CommissionsPage() {
  const [commissions, ranking, summary] = await Promise.all([
    getCommissions(),
    getSellerRanking(),
    getCommissionSummary(),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Comissões" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        <CommissionsClient
          commissions={commissions as Parameters<typeof CommissionsClient>[0]["commissions"]}
          ranking={ranking}
          summary={summary}
        />
      </main>
    </div>
  )
}
