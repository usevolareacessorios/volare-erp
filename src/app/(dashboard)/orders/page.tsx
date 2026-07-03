import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/prisma"
import { OrdersClient } from "@/components/orders/orders-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function OrdersPage() {
  const orders = await prisma.sale.findMany({
    where: { status: { in: ["QUOTE", "ORDER", "PRESALE", "PENDING"] } },
    include: {
      customer: { select: { name: true, phone: true, whatsapp: true } },
      seller: { select: { name: true } },
      items: { include: { product: { select: { name: true, salePrice: true } } } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Orçamentos & Pedidos" />
      <main className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{orders.length} em aberto</p>
          <Button asChild>
            <Link href="/pos"><Plus className="w-4 h-4" /> Novo orçamento</Link>
          </Button>
        </div>
        <OrdersClient orders={orders} />
      </main>
    </div>
  )
}
