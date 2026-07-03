import { Header } from "@/components/layout/header"
import { getWarranties, getWarrantyStats } from "@/lib/actions/warranties"
import { WarrantiesClient } from "@/components/warranties/warranties-client"

export default async function WarrantiesPage() {
  const [warranties, stats] = await Promise.all([
    getWarranties(),
    getWarrantyStats(),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Garantias" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        <WarrantiesClient warranties={warranties} stats={stats} />
      </main>
    </div>
  )
}
