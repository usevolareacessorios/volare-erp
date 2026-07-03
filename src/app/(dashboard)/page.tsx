import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import {
  TrendingUp, ShoppingBag, Users, DollarSign, Package,
  AlertTriangle, Calendar, Receipt, Medal,
} from "lucide-react"
import { getUpcomingBirthdays } from "@/lib/actions/birthdays"
import { BirthdayBanner } from "@/components/birthdays/birthday-banner"
import { SalesChart } from "@/components/dashboard/sales-chart"

async function getDashboardData() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    todaySales, weekSales, monthSales, totalCustomers, lowStock,
    recentSales, topProducts, sellerSales, dailySalesRaw,
    openOrders, upcomingBills, recentlySoldIds,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfWeek } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
    prisma.customer.count({ where: { active: true } }),
    prisma.product.count({ where: { status: "ACTIVE", currentStock: { gt: 0, lte: 3 } } }),
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { status: "COMPLETED", createdAt: { gte: startOfMonth } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.sale.groupBy({
      by: ["sellerId"],
      where: { status: "COMPLETED", createdAt: { gte: startOfMonth }, sellerId: { not: null } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.sale.count({ where: { status: { in: ["QUOTE", "ORDER", "PENDING"] } } }),
    prisma.financialEntry.count({
      where: { status: "PENDING", dueDate: { lte: sevenDaysFromNow } },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: sixtyDaysAgo } } },
      select: { productId: true },
      distinct: ["productId"],
    }),
  ])

  // Stale products
  const soldIds = recentlySoldIds.map((x) => x.productId)
  const staleProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", currentStock: { gt: 0 }, id: { notIn: soldIds } },
    select: { id: true, name: true, currentStock: true, salePrice: true },
    orderBy: { updatedAt: "asc" },
    take: 6,
  })

  // Top product names
  const productIds = topProducts.map((p) => p.productId)
  const productNames = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
  const productMap = Object.fromEntries(productNames.map((p) => [p.id, p.name]))

  // Seller names
  const sellerIds = sellerSales.map((s) => s.sellerId).filter(Boolean) as string[]
  const sellerProfiles = await prisma.profile.findMany({ where: { id: { in: sellerIds } }, select: { id: true, name: true } })
  const sellerMap = Object.fromEntries(sellerProfiles.map((p) => [p.id, p.name]))

  // Chart data — last 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
    const key = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })
    const total = dailySalesRaw
      .filter((s) => s.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }) === key)
      .reduce((sum, s) => sum + Number(s.total), 0)
    return { date: key, total }
  })

  const avgTicket = monthSales._count > 0 ? Number(monthSales._sum.total ?? 0) / monthSales._count : 0

  return {
    todayRevenue: Number(todaySales._sum.total ?? 0),
    todaySalesCount: todaySales._count,
    weekRevenue: Number(weekSales._sum.total ?? 0),
    monthRevenue: Number(monthSales._sum.total ?? 0),
    monthSalesCount: monthSales._count,
    totalCustomers,
    lowStock,
    avgTicket,
    openOrders,
    upcomingBills,
    recentSales,
    topProducts: topProducts.map((p) => ({
      name: productMap[p.productId] ?? "—",
      qty: Number(p._sum.quantity ?? 0),
      revenue: Number(p._sum.total ?? 0),
    })),
    sellerRanking: sellerSales.map((s) => ({
      name: sellerMap[s.sellerId ?? ""] ?? "Sem nome",
      total: Number(s._sum.total ?? 0),
      count: s._count,
    })),
    staleProducts,
    chartData,
  }
}

const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"]

export default async function DashboardPage() {
  const [data, birthdays] = await Promise.all([getDashboardData(), getUpcomingBirthdays(7)])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">

        <BirthdayBanner customers={birthdays} />

        {/* KPIs — row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Faturamento hoje</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(data.todayRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{data.todaySalesCount} venda{data.todaySalesCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-4 h-4 text-primary" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(data.weekRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">últimos 7 dias</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50"><Calendar className="w-4 h-4 text-blue-600" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Vendas do mês</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(data.monthRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{data.monthSalesCount} venda{data.monthSalesCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50"><ShoppingBag className="w-4 h-4 text-emerald-600" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(data.avgTicket)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">no mês</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50"><TrendingUp className="w-4 h-4 text-amber-500" /></div>
          </CardContent></Card>
        </div>

        {/* KPIs — row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Clientes ativos</p>
              <p className="text-xl font-bold mt-1">{data.totalCustomers}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50"><Users className="w-4 h-4 text-blue-600" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estoque baixo</p>
              <p className="text-xl font-bold mt-1">{data.lowStock}</p>
              <p className="text-xs text-muted-foreground mt-0.5">produto{data.lowStock !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-50"><AlertTriangle className="w-4 h-4 text-orange-500" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pedidos em aberto</p>
              <p className="text-xl font-bold mt-1">{data.openOrders}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-50"><Receipt className="w-4 h-4 text-purple-600" /></div>
          </CardContent></Card>

          <Card><CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Contas a vencer</p>
              <p className="text-xl font-bold mt-1">{data.upcomingBills}</p>
              <p className="text-xs text-muted-foreground mt-0.5">próximos 7 dias</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
          </CardContent></Card>
        </div>

        {/* Sales chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Faturamento — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.chartData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent sales */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Últimas vendas</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.recentSales.length === 0
                ? <p className="text-sm text-muted-foreground px-6 pb-6">Nenhuma venda ainda.</p>
                : <div className="divide-y divide-border">
                    {data.recentSales.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono">#{s.number}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.customer?.name ?? "Sem cliente"}</p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">{formatCurrency(Number(s.total))}</p>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Mais vendidos no mês</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.topProducts.length === 0
                ? <p className="text-sm text-muted-foreground px-6 pb-6">Nenhuma venda ainda.</p>
                : <div className="divide-y divide-border">
                    {data.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-sm font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-sm flex-1 truncate">{p.name}</p>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold">{formatCurrency(p.revenue)}</p>
                          <p className="text-[10px] text-muted-foreground">{p.qty} un</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>

          {/* Seller ranking */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Ranking de vendedores</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data.sellerRanking.length === 0
                ? <p className="text-sm text-muted-foreground px-6 pb-6">Sem vendas com vendedor vinculado.</p>
                : <div className="divide-y divide-border">
                    {data.sellerRanking.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <Medal className={`w-4 h-4 shrink-0 ${MEDAL_COLORS[i] ?? "text-muted-foreground"}`} />
                        <p className="text-sm flex-1 truncate font-medium">{s.name}</p>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold">{formatCurrency(s.total)}</p>
                          <p className="text-[10px] text-muted-foreground">{s.count} venda{s.count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>
        </div>

        {/* Stale products */}
        {data.staleProducts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Produtos parados (+60 dias sem venda)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.staleProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <p className="text-sm flex-1 truncate">{p.name}</p>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold">{formatCurrency(Number(p.salePrice))}</p>
                      <p className="text-[10px] text-muted-foreground">{p.currentStock} em estoque</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}
