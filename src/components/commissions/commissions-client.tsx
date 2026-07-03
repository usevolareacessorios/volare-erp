"use client"

import { useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { markCommissionPaid } from "@/lib/actions/commissions"
import { Trophy, TrendingUp, DollarSign } from "lucide-react"

type RankingRow = {
  sellerId: string
  sellerName: string
  totalSales: number
  saleCount: number
  totalCommission: number
  pendingCommission: number
}

type CommissionRow = {
  id: string
  status: "PENDING" | "PAID" | "CANCELLED"
  amount: unknown
  rate: unknown
  createdAt: Date
  paidAt: Date | null
  sale: { number: string; total: unknown }
  seller: { name: string }
}

type Summary = {
  totalPending: number
  totalPaidThisMonth: number
  sellersCount: number
}

interface Props {
  ranking: RankingRow[]
  commissions: CommissionRow[]
  summary: Summary
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  PENDING: "secondary",
  PAID: "success",
  CANCELLED: "destructive",
}

export function CommissionsClient({ ranking, commissions, summary }: Props) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [pending, startTransition] = useTransition()

  const filtered = commissions.filter(
    (c) => statusFilter === "all" || c.status === statusFilter
  )

  function handlePay(id: string) {
    startTransition(async () => {
      await markCommissionPaid(id)
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total pendente</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPending)}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pago este mês</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPaidThisMonth)}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Vendedores</p>
              <p className="text-2xl font-bold mt-1">{summary.sellersCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4">
          {ranking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Nenhuma comissão este mês.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendedor</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vendas</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Faturamento</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pendente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ranking.map((row, i) => (
                      <tr key={row.sellerId} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {i === 0 ? (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          ) : i === 1 ? (
                            <Trophy className="w-4 h-4 text-slate-400" />
                          ) : i === 2 ? (
                            <Trophy className="w-4 h-4 text-amber-600" />
                          ) : (
                            <span className="text-muted-foreground">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{row.sellerName}</td>
                        <td className="px-4 py-3 text-right">{row.saleCount}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(row.totalSales)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(row.totalCommission)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(row.pendingCommission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detalhes" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Nenhuma comissão encontrada.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendedor</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Venda</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Taxa</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{c.seller.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">#{c.sale.number}</td>
                        <td className="px-4 py-3 text-right">{Number(c.rate)}%</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(Number(c.amount))}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={STATUS_VARIANTS[c.status] ?? "secondary"}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => handlePay(c.id)}
                            >
                              Pagar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
