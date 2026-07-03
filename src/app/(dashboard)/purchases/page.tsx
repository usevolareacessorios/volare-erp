import { Header } from "@/components/layout/header"
import { getPurchases } from "@/lib/actions/purchases"
import { PurchasesClient } from "@/components/purchases/purchases-client"

export default async function PurchasesPage() {
  const purchases = await getPurchases()
  return (
    <div className="flex flex-col flex-1">
      <Header title="Compras" />
      <main className="flex-1 p-6 overflow-auto">
        <PurchasesClient purchases={purchases} />
      </main>
    </div>
  )
}
