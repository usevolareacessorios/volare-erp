"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { customerSchema, type CustomerFormData } from "@/lib/validations/customer"
import { createCustomer, updateCustomer } from "@/lib/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save } from "lucide-react"

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>
  customerId?: string
}

export function CustomerForm({ defaultValues, customerId }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { active: true, ...defaultValues },
  })

  const active = watch("active")

  async function onSubmit(data: CustomerFormData) {
    setLoading(true)
    setServerError("")
    const result = customerId
      ? await updateCustomer(customerId, data)
      : await createCustomer(data)

    if ("error" in result && result.error) {
      setServerError("Verifique os campos e tente novamente.")
      setLoading(false)
      return
    }
    router.push("/customers")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dados pessoais */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome completo *" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Nome do cliente" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <Input {...register("cpf")} placeholder="000.000.000-00" />
              </Field>
              <Field label="Data de nascimento">
                <Input {...register("birthDate")} type="date" />
              </Field>
            </div>
            <Field label="E-mail" error={errors.email?.message}>
              <Input {...register("email")} type="email" placeholder="cliente@email.com" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone">
                <Input {...register("phone")} placeholder="(00) 0000-0000" />
              </Field>
              <Field label="WhatsApp">
                <Input {...register("whatsapp")} placeholder="(00) 90000-0000" />
              </Field>
            </div>
            <Field label="Instagram">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input {...register("instagram")} placeholder="perfil" className="pl-7" />
              </div>
            </Field>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={active} onCheckedChange={(v) => setValue("active", !!v)} />
                <span className="text-sm">Cliente ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={!!watch("isVip")} onCheckedChange={(v) => setValue("isVip", !!v)} />
                <span className="text-sm font-medium text-amber-600">Cliente VIP</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Endereço + observações */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Rua / Endereço">
                <Input {...register("street")} placeholder="Rua, número, complemento" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade">
                  <Input {...register("city")} placeholder="Cidade" />
                </Field>
                <Field label="Estado">
                  <Input {...register("state")} placeholder="UF" maxLength={2} />
                </Field>
              </div>
              <Field label="CEP">
                <Input {...register("zipCode")} placeholder="00000-000" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
            <CardContent>
              <textarea
                {...register("notes")}
                rows={4}
                placeholder="Preferências, informações importantes sobre o cliente..."
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {customerId ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
