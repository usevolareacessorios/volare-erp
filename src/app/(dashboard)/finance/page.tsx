import { Header } from "@/components/layout/header"
import { getFinancialSummary, getFinancialEntries, getFinancialCategories } from "@/lib/actions/finance"
import { FinanceClient } from "@/components/finance/finance-client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react"

export default async function FinancePage() {
  const [summary, entries, categories] = await Promise.all([
    getFinancialSummary(),
    getFinancialEntries(),
    getFinancialCategories(),
  ])

  const balance = summary.incomesMonth - summary.expensesMonth

  return (
    <div className="flex flex-col flex-1">
      <Header title="Financeiro" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Receitas do mês</p>
                  <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(summary.incomesMonth)}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Despesas do mês</p>
                  <p className="text-xl font-bold mt-1 text-red-500">{formatCurrency(summary.expensesMonth)}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">A receber / pagar</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(summary.pendingAmount)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{summary.pendingCount} lançamento{summary.pendingCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo do mês</p>
                  <p className={`text-xl font-bold mt-1 ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
                {summary.overdueCount > 0 && (
                  <div className="p-2 rounded-lg bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
              {summary.overdueCount > 0 && (
                <p className="text-[11px] text-red-500 mt-1.5">{summary.overdueCount} vencido{summary.overdueCount !== 1 ? "s" : ""} · {formatCurrency(summary.overdueAmount)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client component with tabs + filters + new entry */}
        <FinanceClient entries={entries} categories={categories} />
      </main>
    </div>
  )
}
