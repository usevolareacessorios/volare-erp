"use client"

import { useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  getSalesReport,
  getProductsReport,
  getCustomersReport,
  getFinancialReport,
  getStockReport,
} from "@/lib/actions/reports"

type SalesReport = Awaited<ReturnType<typeof getSalesReport>>
type ProductsReport = Awaited<ReturnType<typeof getProductsReport>>
type CustomersReport = Awaited<ReturnType<typeof getCustomersReport>>
type FinancialReport = Awaited<ReturnType<typeof getFinancialReport>>
type StockReport = Awaited<ReturnType<typeof getStockReport>>

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}

function SalesTab() {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<SalesReport | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    start(async () => {
      const result = await getSalesReport(new Date(from), new Date(to + "T23:59:59"))
      setData(result)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">De</p>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Até</p>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Button onClick={generate} disabled={pending}>
          {pending ? "Gerando..." : "Gerar"}
        </Button>
      </div>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Faturamento" value={formatCurrency(data.totalRevenue)} />
            <StatCard label="Total de vendas" value={String(data.totalSales)} />
            <StatCard label="Ticket médio" value={formatCurrency(data.avgTicket)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Top 10 produtos por receita</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qtd</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Receita</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.topProducts.map((p, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2 text-right">{p.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Vendas por dia</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.salesByDay.map((d) => (
                        <tr key={d.date}>
                          <td className="px-4 py-2">{formatDate(d.date)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductsTab() {
  const [data, setData] = useState<ProductsReport | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    start(async () => {
      const result = await getProductsReport()
      setData(result)
    })
  }

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={pending}>
        {pending ? "Gerando..." : "Gerar relatório"}
      </Button>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total produtos" value={String(data.total)} />
            <StatCard label="Ativos" value={String(data.active)} />
            <StatCard label="Sem estoque" value={String(data.outOfStock)} />
            <StatCard label="Estoque baixo" value={String(data.lowStock)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Mais vendidos</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qtd</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Receita</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.topBySales.map((p, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2 text-right">{p.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Sem movimentação</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.slowMovers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-2 text-muted-foreground">Nenhum produto sem vendas.</td>
                        </tr>
                      ) : (
                        data.slowMovers.map((p, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{p.name}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomersTab() {
  const [data, setData] = useState<CustomersReport | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    start(async () => {
      const result = await getCustomersReport()
      setData(result)
    })
  }

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={pending}>
        {pending ? "Gerando..." : "Gerar relatório"}
      </Button>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total clientes" value={String(data.total)} />
            <StatCard label="Novos este mês" value={String(data.newThisMonth)} />
            <StatCard label="VIP" value={String(data.vipCount)} />
            <StatCard label="Inativos (90d)" value={String(data.inactive)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Top 10 clientes por gasto</h3>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Cliente</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Compras</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total gasto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.topCustomers.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2">{c.name}</td>
                        <td className="px-4 py-2 text-right">{c.purchaseCount}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function FinancialTab() {
  const now = new Date()
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
  const [data, setData] = useState<FinancialReport | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    start(async () => {
      const result = await getFinancialReport(new Date(month + "-01"))
      setData(result)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Mês</p>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
        </div>
        <Button onClick={generate} disabled={pending}>
          {pending ? "Gerando..." : "Gerar"}
        </Button>
      </div>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Receitas pagas" value={formatCurrency(data.totalIncome)} />
            <StatCard label="Despesas pagas" value={formatCurrency(data.totalExpense)} />
            <StatCard label="Lucro" value={formatCurrency(data.profit)} />
            <StatCard label="A receber" value={formatCurrency(data.pendingReceivables)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Receitas por categoria</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Categoria</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.incomeByCategory.map((r) => (
                        <tr key={r.name}>
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Despesas por categoria</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Categoria</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.expenseByCategory.map((r) => (
                        <tr key={r.name}>
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StockTab() {
  const [data, setData] = useState<StockReport | null>(null)
  const [pending, start] = useTransition()

  function generate() {
    start(async () => {
      const result = await getStockReport()
      setData(result)
    })
  }

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={pending}>
        {pending ? "Gerando..." : "Gerar relatório"}
      </Button>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total produtos" value={String(data.totalProducts)} />
            <StatCard label="Valor do estoque" value={formatCurrency(data.totalStockValue)} />
            <StatCard label="Entradas este mês" value={String(data.movementIn)} />
            <StatCard label="Saídas este mês" value={String(data.movementOut)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Estoque baixo ({data.lowStock.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">SKU</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qtd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.lowStock.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-muted-foreground">Nenhum item.</td>
                        </tr>
                      ) : (
                        data.lowStock.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2">{p.name}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{p.sku}</td>
                            <td className="px-4 py-2 text-right text-amber-600">{p.currentStock}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Sem estoque ({data.outOfStock.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.outOfStock.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-2 text-muted-foreground">Nenhum item.</td>
                        </tr>
                      ) : (
                        data.outOfStock.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2">{p.name}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{p.sku}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReportsClient() {
  return (
    <Tabs defaultValue="vendas">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="vendas">Vendas</TabsTrigger>
        <TabsTrigger value="produtos">Produtos</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
        <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        <TabsTrigger value="estoque">Estoque</TabsTrigger>
      </TabsList>
      <TabsContent value="vendas" className="mt-4"><SalesTab /></TabsContent>
      <TabsContent value="produtos" className="mt-4"><ProductsTab /></TabsContent>
      <TabsContent value="clientes" className="mt-4"><CustomersTab /></TabsContent>
      <TabsContent value="financeiro" className="mt-4"><FinancialTab /></TabsContent>
      <TabsContent value="estoque" className="mt-4"><StockTab /></TabsContent>
    </Tabs>
  )
}
