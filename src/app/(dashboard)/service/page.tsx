import { Header } from "@/components/layout/header"
import { getServiceOrders, getServiceStats } from "@/lib/actions/service"
import { ServiceClient } from "@/components/service/service-client"

export default async function ServicePage() {
  const [orders, stats] = await Promise.all([
    getServiceOrders(),
    getServiceStats(),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Assistência Técnica" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        <ServiceClient orders={orders} stats={stats} />
      </main>
    </div>
  )
}
