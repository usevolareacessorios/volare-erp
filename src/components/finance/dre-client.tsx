"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { getDRE } from "@/lib/actions/finance"
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"

type DRE = Awaited<ReturnType<typeof getDRE>>
type CashFlow = { label: string; income: number; expense: number; balance: number; pending: number }[]

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

export function DreClient({ dre: initialDre, cashFlow, currentMonth, currentYear }: {
  dre: DRE; cashFlow: CashFlow; currentMonth: number; currentYear: number
}) {
  const [tab, setTab] = useState<"dre" | "fluxo">("dre")
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [dre, setDre] = useState(initialDre)
  const [, startTransition] = useTransition()

  function handleMonthChange(m: number, y: number) {
    setMonth(m); setYear(y)
    startTransition(async () => {
      const data = await getDRE(y, m)
      setDre(data)
    })
  }

  const profitMargin = dre.totalIncome > 0 ? (dre.netProfit / dre.totalIncome) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        {([["dre", "DRE"], ["fluxo", "Fluxo de Caixa"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>{label}</button>
        ))}
      </div>

      {/* ── DRE TAB ── */}
      {tab === "dre" && (
        <div className="space-y-4">
          {/* Month picker */}
          <div className="flex gap-2 items-center">
            <select
              value={month}
              onChange={(e) => handleMonthChange(Number(e.target.value), year)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => handleMonthChange(month, Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Receita bruta (vendas)</p>
              <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(dre.grossRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{dre.salesCount} venda{dre.salesCount !== 1 ? "s" : ""}</p>
            </CardContent></Card>

            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total entradas</p>
              <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(dre.totalIncome)}</p>
            </CardContent></Card>

            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total saídas</p>
              <p className="text-xl font-bold mt-1 text-red-500">{formatCurrency(dre.totalExpense)}</p>
            </CardContent></Card>

            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Lucro líquido</p>
              <p className={cn("text-xl font-bold mt-1", dre.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                {formatCurrency(dre.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Margem: {profitMargin.toFixed(1)}%</p>
            </CardContent></Card>
          </div>

          {/* DRE table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Entradas por categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dre.incomeByCategory.length === 0
                  ? <p className="text-sm text-muted-foreground px-4 pb-4">Nenhuma entrada no período.</p>
                  : <div className="divide-y divide-border">
                      {dre.incomeByCategory.map((c) => (
                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm">{c.name}</span>
                          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(c.amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(dre.totalIncome)}</span>
                      </div>
                    </div>
                }
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Saídas por categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dre.expenseByCategory.length === 0
                  ? <p className="text-sm text-muted-foreground px-4 pb-4">Nenhuma saída no período.</p>
                  : <div className="divide-y divide-border">
                      {dre.expenseByCategory.map((c) => (
                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm">{c.name}</span>
                          <span className="text-sm font-semibold text-red-500">{formatCurrency(c.amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-sm font-bold text-red-500">{formatCurrency(dre.totalExpense)}</span>
                      </div>
                    </div>
                }
              </CardContent>
            </Card>
          </div>

          {/* Result line */}
          <Card className={cn("border-2", dre.netProfit >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className={cn("w-5 h-5", dre.netProfit >= 0 ? "text-emerald-600" : "text-red-500")} />
                <span className="font-semibold">Resultado do mês: {MONTHS[month - 1]} {year}</span>
              </div>
              <span className={cn("text-2xl font-bold", dre.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                {dre.netProfit >= 0 ? "+" : ""}{formatCurrency(dre.netProfit)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── FLUXO DE CAIXA TAB ── */}
      {tab === "fluxo" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Fluxo de caixa — últimos 6 meses + próximos 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashFlow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={48} />
                  <Tooltip
                    formatter={(v, name) => [formatCurrency(v as number), name === "income" ? "Entradas" : name === "expense" ? "Saídas" : "Saldo"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend formatter={(v) => v === "income" ? "Entradas" : v === "expense" ? "Saídas" : "Saldo"} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-5 gap-0 text-xs font-semibold text-muted-foreground px-4 py-2 border-b border-border">
                <span>Mês</span><span className="text-right">Entradas</span><span className="text-right">Saídas</span>
                <span className="text-right">Saldo</span><span className="text-right">Pendente</span>
              </div>
              {cashFlow.map((row) => (
                <div key={row.label} className="grid grid-cols-5 gap-0 px-4 py-2.5 border-b border-border last:border-0 text-sm">
                  <span className="font-medium capitalize">{row.label}</span>
                  <span className="text-right text-emerald-600">{formatCurrency(row.income)}</span>
                  <span className="text-right text-red-500">{formatCurrency(row.expense)}</span>
                  <span className={cn("text-right font-semibold", row.balance >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {row.balance >= 0 ? "+" : ""}{formatCurrency(row.balance)}
                  </span>
                  <span className="text-right text-muted-foreground">{formatCurrency(row.pending)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
