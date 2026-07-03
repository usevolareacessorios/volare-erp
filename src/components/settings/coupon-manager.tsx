"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createCoupon, toggleCoupon, deleteCoupon } from "@/lib/actions/coupons"
import { formatCurrency } from "@/lib/utils"
import { Plus, Loader2, Ticket, Trash2, ToggleLeft, ToggleRight } from "lucide-react"

type Coupon = {
  id: string; code: string; type: string; value: unknown
  minAmount: unknown; maxUses: number | null; usedCount: number
  active: boolean; expiresAt: Date | null; createdAt: Date
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleToggle(id: string, active: boolean) {
    setLoading(id + "_toggle")
    await toggleCoupon(id, !active)
    setLoading(null)
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cupom?")) return
    setLoading(id + "_del")
    await deleteCoupon(id)
    setLoading(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm text-muted-foreground">{coupons.length} cupom{coupons.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="w-4 h-4" /> Novo cupom
            </Button>
          </div>

          {coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="p-3 rounded-full bg-muted"><Ticket className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium">Nenhum cupom cadastrado</p>
              <p className="text-xs text-muted-foreground">Crie cupons de desconto para usar nas vendas.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{c.code}</span>
                      <Badge variant={c.active ? "success" : "secondary"} className="text-[10px] py-0 px-1.5">
                        {c.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {c.type === "PERCENTAGE" ? `${Number(c.value)}%` : `-${formatCurrency(Number(c.value))}`}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {c.minAmount != null && <span>Mín: {formatCurrency(Number(c.minAmount))}</span>}
                      {c.maxUses && <span>Usos: {c.usedCount}/{c.maxUses}</span>}
                      {!c.maxUses && <span>Usos: {c.usedCount}</span>}
                      {c.expiresAt && <span>Expira: {new Date(c.expiresAt).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleToggle(c.id, c.active)}
                      disabled={loading === c.id + "_toggle"} title={c.active ? "Desativar" : "Ativar"}>
                      {loading === c.id + "_toggle" ? <Loader2 className="w-4 h-4 animate-spin" />
                        : c.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      }
                    </Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleDelete(c.id)}
                      disabled={loading === c.id + "_del"} title="Excluir">
                      {loading === c.id + "_del" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewCouponDialog open={showNew} onClose={() => setShowNew(false)} onCreated={() => {
        setShowNew(false)
        startTransition(() => router.refresh())
      }} />
    </>
  )
}

function NewCouponDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "", minAmount: "", maxUses: "", expiresAt: "",
  })

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.value) { setError("Código e valor são obrigatórios."); return }
    setLoading(true); setError("")
    const res = await createCoupon({
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
    })
    setLoading(false)
    if (res && "error" in res) { setError(res.error ?? "Erro"); return }
    setForm({ code: "", type: "PERCENTAGE", value: "", minAmount: "", maxUses: "", expiresAt: "" })
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo cupom de desconto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Código do cupom *</Label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="Ex: VOLARE10" className="font-mono uppercase" autoFocus />
            <p className="text-[11px] text-muted-foreground">O código é sempre em letras maiúsculas.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de desconto *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Porcentagem (%)</SelectItem>
                  <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor do desconto *</Label>
              <Input type="number" min={0} step={0.01} value={form.value} onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "PERCENTAGE" ? "10" : "15,00"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor mínimo da venda (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.minAmount} onChange={(e) => set("minAmount", e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label>Limite de usos</Label>
              <Input type="number" min={1} value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="Ilimitado" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Data de expiração</Label>
            <Input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Criar cupom
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
