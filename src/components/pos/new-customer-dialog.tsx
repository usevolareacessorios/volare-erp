"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomer } from "@/lib/actions/customers"
import { Loader2, Save } from "lucide-react"

interface NewCustomerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (customer: { id: string; name: string; phone: string | null; whatsapp: string | null }) => void
}

export function NewCustomerDialog({ open, onClose, onCreated }: NewCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "", cpf: "", birthDate: "",
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Nome obrigatório"); return }
    setLoading(true)
    setError("")

    const result = await createCustomer({
      name: form.name,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      cpf: form.cpf || null,
      birthDate: form.birthDate || null,
      active: true,
    })

    if ("error" in result && result.error) {
      setError("Erro ao cadastrar cliente.")
      setLoading(false)
      return
    }

    const customer = (result as any).data
    onCreated({ id: customer.id, name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp })
    setForm({ name: "", phone: "", whatsapp: "", email: "", cpf: "", birthDate: "" })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome completo *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do cliente" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 0000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(00) 90000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>Nascimento</Label>
              <Input value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="cliente@email.com" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Cadastrar e selecionar
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
