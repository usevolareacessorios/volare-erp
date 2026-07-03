import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSales } from "@/lib/actions/sales"
import { SalesList } from "@/components/sales/sales-list"
import { formatCurrency } from "@/lib/utils"
import { ShoppingBag, Plus, TrendingUp, DollarSign } from "lucide-react"

export default async function SalesPage() {
  const sales = await getSales()

  const totalRevenue = sales.reduce((s, v) => s + Number(v.total), 0)
  const todaySales = sales.filter((v) => {
    const d = new Date(v.createdAt)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })
  const todayRevenue = todaySales.reduce((s, v) => s + Number(v.total), 0)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Vendas" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de vendas</p>
              <p className="text-2xl font-bold mt-1">{sales.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10"><ShoppingBag className="w-4 h-4 text-primary" /></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Vendas hoje</p>
              <p className="text-2xl font-bold mt-1">{todaySales.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(todayRevenue)}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50"><DollarSign className="w-4 h-4 text-amber-500" /></div>
          </CardContent></Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Histórico de vendas</h2>
          <Button asChild>
            <Link href="/pos"><Plus className="w-4 h-4" /> Nova venda</Link>
          </Button>
        </div>

        {sales.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="p-3 rounded-full bg-[var(--color-gold-100)]">
              <ShoppingBag className="w-6 h-6 text-[var(--color-gold-600)]" />
            </div>
            <p className="font-medium">Nenhuma venda registrada</p>
            <p className="text-sm text-muted-foreground">Use o PDV para registrar sua primeira venda.</p>
            <Button asChild className="mt-2"><Link href="/pos"><Plus className="w-4 h-4" /> Ir para o PDV</Link></Button>
          </CardContent></Card>
        ) : (
          <SalesList sales={sales} />
        )}
      </main>
    </div>
  )
}
