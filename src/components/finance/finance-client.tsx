"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  createFinancialEntry, markAsPaid, deleteFinancialEntry, saveExpenseBatch,
} from "@/lib/actions/finance"
import { Plus, CheckCircle2, Trash2, TrendingUp, TrendingDown, CreditCard, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"

type Entry = {
  id: string
  type: "INCOME" | "EXPENSE"
  description: string
  amount: unknown
  dueDate: Date
  paidAt: Date | null
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  referenceType: "SALE" | "PURCHASE" | "MANUAL" | "COMMISSION" | "SERVICE"
  notes: string | null
  category: { id: string; name: string } | null
}

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" }

interface FinanceClientProps {
  entries: Entry[]
  categories: Category[]
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente", PAID: "Pago", OVERDUE: "Vencido", CANCELLED: "Cancelado",
}
const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "secondary" | "warning"> = {
  PENDING: "warning", PAID: "success", OVERDUE: "destructive", CANCELLED: "secondary",
}
const REF_LABEL: Record<string, string> = { SALE: "Venda", PURCHASE: "Compra", MANUAL: "Manual" }

// Last day of current month as YYYY-MM-DD
function lastDayOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
}

export function FinanceClient({ entries, categories }: FinanceClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<"all" | "INCOME" | "EXPENSE">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE")

  // Quick-fill state: { [categoryId]: { amount: string, dueDate: string } }
  const [quickFill, setQuickFill] = useState<Record<string, { amount: string; dueDate: string }>>(() => {
    const obj: Record<string, { amount: string; dueDate: string }> = {}
    expenseCategories.forEach((c) => { obj[c.id] = { amount: "", dueDate: lastDayOfMonth() } })
    return obj
  })

  const [form, setForm] = useState({
    type: "INCOME" as "INCOME" | "EXPENSE",
    description: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    notes: "",
  })

  function refresh() { startTransition(() => router.refresh()) }

  const filtered = entries.filter((e) => {
    if (tab !== "all" && e.type !== tab) return false
    if (statusFilter !== "all" && e.status !== statusFilter) return false
    return true
  })

  async function handleCreate(evt: React.FormEvent) {
    evt.preventDefault()
    if (!form.description || !form.amount || !form.dueDate) return
    setLoading(true)
    await createFinancialEntry({
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount.replace(",", ".")),
      dueDate: form.dueDate,
      categoryId: form.categoryId || null,
      notes: form.notes || null,
    })
    setLoading(false)
    setShowNew(false)
    setForm({ type: "INCOME", description: "", amount: "", dueDate: new Date().toISOString().split("T")[0], categoryId: "", notes: "" })
    refresh()
  }

  async function handleMarkPaid(id: string) {
    setActionLoading(id + "_pay")
    await markAsPaid(id)
    setActionLoading(null)
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return
    setActionLoading(id + "_del")
    await deleteFinancialEntry(id)
    setActionLoading(null)
    refresh()
  }

  async function handleSaveBatch() {
    const items = expenseCategories
      .filter((c) => {
        const v = quickFill[c.id]?.amount
        return v && parseFloat(v.replace(",", ".")) > 0
      })
      .map((c) => ({
        categoryId: c.id,
        description: c.name,
        amount: parseFloat(quickFill[c.id].amount.replace(",", ".")),
        dueDate: quickFill[c.id].dueDate || lastDayOfMonth(),
      }))

    if (!items.length) return
    setSavingBatch(true)
    await saveExpenseBatch(items)
    setSavingBatch(false)
    refresh()
  }

  const filledCount = expenseCategories.filter((c) => {
    const v = quickFill[c.id]?.amount
    return v && parseFloat(v.replace(",", ".")) > 0
  }).length

  const totalQuickFill = expenseCategories.reduce((sum, c) => {
    const v = quickFill[c.id]?.amount
    return sum + (v ? parseFloat(v.replace(",", ".")) || 0 : 0)
  }, 0)

  const filteredCategories = categories.filter((c) => c.type === form.type)

  // Pre-fill quickFill from existing entries when tab changes to EXPENSE
  function initQuickFillFromEntries() {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    setQuickFill((prev) => {
      const next = { ...prev }
      expenseCategories.forEach((cat) => {
        const existing = entries.find((e) =>
          e.type === "EXPENSE" &&
          e.category?.id === cat.id &&
          new Date(e.dueDate).getMonth() === thisMonth &&
          new Date(e.dueDate).getFullYear() === thisYear
        )
        if (existing && !next[cat.id]?.amount) {
          next[cat.id] = {
            amount: Number(existing.amount).toFixed(2),
            dueDate: new Date(existing.dueDate).toISOString().split("T")[0],
          }
        }
      })
      return next
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {([["all", "Todos"], ["INCOME", "Receitas"], ["EXPENSE", "Despesas"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); if (key === "EXPENSE") initQuickFillFromEntries() }}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="OVERDUE">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Novo lançamento
          </Button>
        </div>
      </div>

      {/* ─── QUICK FILL PANEL (only on EXPENSE tab) ─── */}
      {tab === "EXPENSE" && expenseCategories.length > 0 && (
        <Card className="border-red-100">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Despesas do mês</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha os valores e clique em salvar — o sistema usa isso para calcular o custo dos produtos.
                </p>
              </div>
              {filledCount > 0 && (
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground">Total preenchido</p>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(totalQuickFill)}</p>
                </div>
              )}
            </div>

            {/* Category rows */}
            <div className="divide-y divide-border">
              {expenseCategories.map((cat) => {
                const val = quickFill[cat.id] ?? { amount: "", dueDate: lastDayOfMonth() }
                return (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cat.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={val.amount}
                          onChange={(e) => setQuickFill((prev) => ({ ...prev, [cat.id]: { ...val, amount: e.target.value } }))}
                          className="pl-8 h-8 w-32 text-sm"
                        />
                      </div>
                      <Input
                        type="date"
                        value={val.dueDate}
                        onChange={(e) => setQuickFill((prev) => ({ ...prev, [cat.id]: { ...val, dueDate: e.target.value } }))}
                        className="h-8 w-36 text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer / Save */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {filledCount > 0
                  ? `${filledCount} despesa${filledCount > 1 ? "s" : ""} para salvar`
                  : "Preencha os valores acima"}
              </p>
              <Button
                size="sm"
                onClick={handleSaveBatch}
                disabled={savingBatch || filledCount === 0}
              >
                {savingBatch
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  : <><Save className="w-4 h-4" /> Salvar despesas</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filtered.length === 0 && tab !== "EXPENSE" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: "var(--color-wine-100, #fbe8ee)" }}>
              <CreditCard className="w-6 h-6" style={{ color: "var(--color-wine-600, #8c1a3c)" }} />
            </div>
            <p className="font-medium">Nenhum lançamento encontrado</p>
            <p className="text-sm text-muted-foreground">Crie lançamentos manuais ou eles aparecem automaticamente a partir de vendas e compras.</p>
            <Button size="sm" className="mt-1" onClick={() => setShowNew(true)}>
              <Plus className="w-4 h-4" /> Novo lançamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  entry.type === "INCOME" ? "bg-emerald-50" : "bg-red-50"
                )}>
                  {entry.type === "INCOME"
                    ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                    : <TrendingDown className="w-4 h-4 text-red-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{entry.description}</span>
                    <Badge variant={STATUS_VARIANT[entry.status]} className="text-[10px] py-0 px-1.5">
                      {STATUS_LABEL[entry.status]}
                    </Badge>
                    {entry.referenceType !== "MANUAL" && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {REF_LABEL[entry.referenceType]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {entry.category && <span className="text-xs text-muted-foreground">{entry.category.name}</span>}
                    <span className="text-xs text-muted-foreground">Venc. {formatDate(entry.dueDate)}</span>
                    {entry.paidAt && <span className="text-xs text-emerald-600">Pago {formatDate(entry.paidAt)}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={cn("font-semibold text-sm", entry.type === "INCOME" ? "text-emerald-600" : "text-red-500")}>
                    {entry.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(entry.amount))}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  {(entry.status === "PENDING" || entry.status === "OVERDUE") && (
                    <Button size="icon" variant="ghost" className="w-7 h-7" title="Marcar como pago"
                      onClick={() => handleMarkPaid(entry.id)} disabled={actionLoading === entry.id + "_pay"}>
                      {actionLoading === entry.id + "_pay"
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </Button>
                  )}
                  {entry.referenceType === "MANUAL" && (
                    <Button size="icon" variant="ghost" className="w-7 h-7" title="Excluir"
                      onClick={() => handleDelete(entry.id)} disabled={actionLoading === entry.id + "_del"}>
                      {actionLoading === entry.id + "_del"
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New entry dialog */}
      <Dialog open={showNew} onOpenChange={(v) => !v && setShowNew(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex gap-1 p-1 rounded-lg bg-muted">
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t, categoryId: "" }))}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors",
                    form.type === t
                      ? t === "INCOME" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  {t === "INCOME" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Pagamento de fornecedor" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00" inputMode="decimal" />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 && <SelectItem value="_none" disabled>Nenhuma categoria cadastrada</SelectItem>}
                  {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Salvar lançamento
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
