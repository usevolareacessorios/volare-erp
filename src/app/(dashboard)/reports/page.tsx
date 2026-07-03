import { Header } from "@/components/layout/header"
import { ReportsClient } from "@/components/reports/reports-client"

export default function ReportsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Relatórios" />
      <main className="flex-1 p-6 overflow-auto">
        <ReportsClient />
      </main>
    </div>
  )
}
