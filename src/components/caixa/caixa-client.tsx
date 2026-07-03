"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils"
import { openRegister, closeRegister, addEntry } from "@/lib/actions/caixa"
import { Banknote, ArrowDownCircle, ArrowUpCircle, XCircle, Loader2, Clock, History } from "lucide-react"
import { cn } from "@/lib/utils"

type CashEntry = {
  id: string
  type: string
  amount: unknown
  description: string
  createdAt: Date
}

type Register = {
  id: string
  openedAt: Date
  openingBalance: unknown
  status: string
  openedBy: { id: string; name: string }
  entries: CashEntry[]
}

type HistoryRegister = {
  id: string
  openedAt: Date
  closedAt: Date | null
  openingBalance: unknown
  closingBalance: unknown | null
  expectedBalance: unknown | null
  difference: unknown | null
  status: string
  openedBy: { name: string }
  closedBy: { name: string } | null
  _count: { entries: number }
}

interface CaixaClientProps {
  register: Register | null
  history: HistoryRegister[]
  userId: string
  userName: string
}

const ENTRY_LABELS: Record<string, string> = {
  OPENING: "Abertura",
  CLOSING: "Fechamento",
  SANGRIA: "Sangria",
  SUPRIMENTO: "Suprimento",
  SALE: "Venda",
  PAYMENT_IN: "Recebimento",
  ADJUSTMENT: "Ajuste",
}

export function CaixaClient({ register, history, userId, userName }: CaixaClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<"caixa" | "historico">("caixa")
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showEntry, setShowEntry] = useState<"SANGRIA" | "SUPRIMENTO" | null>(null)
  const [loading, setLoading] = useState(false)
  const [openingBalance, setOpeningBalance] = useState("")
  const [closingBalance, setClosingBalance] = useState("")
  const [entryAmount, setEntryAmount] = useState("")
  const [entryDesc, setEntryDesc] = useState("")

  function refresh() {
    startTransition(() => router.refresh())
  }

  // Calculate current balance
  let currentBalance = 0
  let totalSangria = 0
  let totalSuprimento = 0

  if (register) {
    currentBalance = Number(register.openingBalance)
    for (const e of register.entries) {
      if (e.type === "OPENING") continue
      if (e.type === "SUPRIMENTO" || e.type === "SALE" || e.type === "PAYMENT_IN") {
        currentBalance += Number(e.amount)
        if (e.type === "SUPRIMENTO") totalSuprimento += Number(e.amount)
      } else if (e.type === "SANGRIA") {
        currentBalance -= Number(e.amount)
        totalSangria += Number(e.amount)
      }
    }
  }

  const displayEntries = register?.entries.filter((e) => e.type !== "OPENING") ?? []

  async function handleOpen(evt: React.FormEvent) {
    evt.preventDefault()
    const bal = parseFloat(openingBalance.replace(",", "."))
    if (isNaN(bal)) return
    setLoading(true)
    await openRegister(bal, userId)
    setLoading(false)
    setShowOpen(false)
    setOpeningBalance("")
    refresh()
  }

  async function handleClose(evt: React.FormEvent) {
    evt.preventDefault()
    if (!register) return
    const bal = parseFloat(closingBalance.replace(",", "."))
    if (isNaN(bal)) return
    setLoading(true)
    await closeRegister(register.id, bal, userId)
    setLoading(false)
    setShowClose(false)
    setClosingBalance("")
    refresh()
  }

  async function handleEntry(evt: React.FormEvent) {
    evt.preventDefault()
    if (!register || !showEntry) return
    const amt = parseFloat(entryAmount.replace(",", "."))
    if (isNaN(amt) || !entryDesc) return
    setLoading(true)
    await addEntry(register.id, showEntry, amt, entryDesc, userId)
    setLoading(false)
    setShowEntry(null)
    setEntryAmount("")
    setEntryDesc("")
    refresh()
  }

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        {([["caixa", "Caixa"], ["historico", "Histórico"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── CAIXA TAB ── */}
      {tab === "caixa" && !register && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Banknote className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">Caixa Fechado</p>
              <p className="text-sm text-muted-foreground mt-1">Abra o caixa para registrar movimentações.</p>
            </div>
            <Button onClick={() => setShowOpen(true)}>
              <Banknote className="w-4 h-4" /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "caixa" && register && (
        <div className="space-y-4">
          {/* Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Aberto</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDateTime(register.openedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Operador: <span className="font-medium text-foreground">{register.openedBy.name}</span></p>
                  <p className="text-sm text-muted-foreground">Saldo de abertura: <span className="font-medium text-foreground">{formatCurrency(Number(register.openingBalance))}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo esperado</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(currentBalance)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Suprimentos</p>
                  <p className="font-semibold text-emerald-600">+{formatCurrency(totalSuprimento)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Sangrias</p>
                  <p className="font-semibold text-red-500">-{formatCurrency(totalSangria)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Movimentações</p>
                  <p className="font-semibold">{displayEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowEntry("SUPRIMENTO")}>
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> Suprimento
            </Button>
            <Button variant="outline" onClick={() => setShowEntry("SANGRIA")}>
              <ArrowDownCircle className="w-4 h-4 text-red-500" /> Sangria
            </Button>
            <Button variant="destructive" onClick={() => setShowClose(true)}>
              <XCircle className="w-4 h-4" /> Fechar Caixa
            </Button>
          </div>

          {/* Entries */}
          {displayEntries.length > 0 && (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {displayEntries.map((entry) => {
                  const isIn = entry.type === "SUPRIMENTO" || entry.type === "SALE" || entry.type === "PAYMENT_IN"
                  const isOut = entry.type === "SANGRIA"
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        isIn ? "bg-emerald-50" : isOut ? "bg-red-50" : "bg-muted"
                      )}>
                        {isIn ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> : isOut ? <ArrowDownCircle className="w-4 h-4 text-red-500" /> : <Banknote className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{ENTRY_LABELS[entry.type]} · {formatDateTime(entry.createdAt)}</p>
                      </div>
                      <p className={cn(
                        "font-semibold text-sm shrink-0",
                        isIn ? "text-emerald-600" : isOut ? "text-red-500" : "text-foreground"
                      )}>
                        {isIn ? "+" : isOut ? "-" : ""}{formatCurrency(Number(entry.amount))}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {displayEntries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma movimentação ainda.</p>
          )}
        </div>
      )}

      {/* ── HISTÓRICO TAB ── */}
      {tab === "historico" && (
        <Card>
          {history.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <History className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum caixa nos últimos 30 dias.</p>
            </CardContent>
          ) : (
            <CardContent className="p-0 divide-y divide-border">
              {history.map((reg) => (
                <div key={reg.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={reg.status === "OPEN" ? "default" : "secondary"} className="text-[10px]">
                        {reg.status === "OPEN" ? "Aberto" : "Fechado"}
                      </Badge>
                      <span className="text-sm font-medium">{formatDate(reg.openedAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Aberto por {reg.openedBy.name}
                      {reg.closedBy && ` · Fechado por ${reg.closedBy.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-sm font-semibold">{formatCurrency(Number(reg.closingBalance ?? reg.openingBalance))}</p>
                    {reg.difference !== null && Number(reg.difference) !== 0 && (
                      <p className={cn("text-xs", Number(reg.difference) >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {Number(reg.difference) >= 0 ? "+" : ""}{formatCurrency(Number(reg.difference))} diferença
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── OPEN DIALOG ── */}
      <Dialog open={showOpen} onOpenChange={(v) => !v && setShowOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-full bg-primary/10">
                <Banknote className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-lg">Abrir Caixa</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">Informe o valor em caixa no início do dia.</p>
          </DialogHeader>
          <form onSubmit={handleOpen} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Saldo de abertura (R$)</Label>
              <Input
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                autoFocus
                className="text-lg h-11 font-mono"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading} className="flex-1 h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                Abrir Caixa
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowOpen(false)} className="h-10">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CLOSE DIALOG ── */}
      <Dialog open={showClose} onOpenChange={(v) => !v && setShowClose(false)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg">Fechar Caixa</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">Confira o dinheiro físico e informe o total contado.</p>
          </DialogHeader>
          <form onSubmit={handleClose} className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo esperado</span>
                <span className="font-bold text-foreground text-base">{formatCurrency(currentBalance)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Saldo contado (R$)</Label>
              <Input
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                autoFocus
                className="text-lg h-11 font-mono"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="destructive" disabled={loading} className="flex-1 h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Fechar Caixa
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowClose(false)} className="h-10">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ENTRY DIALOG ── */}
      <Dialog open={!!showEntry} onOpenChange={(v) => !v && setShowEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className={cn("p-2 rounded-full", showEntry === "SANGRIA" ? "bg-red-50" : "bg-emerald-50")}>
                {showEntry === "SANGRIA"
                  ? <ArrowDownCircle className="w-5 h-5 text-red-500" />
                  : <ArrowUpCircle className="w-5 h-5 text-emerald-600" />}
              </div>
              <DialogTitle className="text-lg">
                {showEntry === "SANGRIA" ? "Sangria" : "Suprimento"}
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {showEntry === "SANGRIA" ? "Retirada de dinheiro do caixa." : "Entrada de dinheiro no caixa."}
            </p>
          </DialogHeader>
          <form onSubmit={handleEntry} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Valor (R$)</Label>
              <Input
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                autoFocus
                className="text-lg h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Motivo</Label>
              <Input
                value={entryDesc}
                onChange={(e) => setEntryDesc(e.target.value)}
                placeholder={showEntry === "SANGRIA" ? "Ex: Depósito bancário" : "Ex: Reforço de troco"}
                className="h-10"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading} className="flex-1 h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEntry(null)} className="h-10">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
