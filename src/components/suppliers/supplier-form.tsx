"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supplierSchema, type SupplierFormData } from "@/lib/validations/supplier"
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, ExternalLink } from "lucide-react"

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormData>
  supplierId?: string
}

export function SupplierForm({ defaultValues, supplierId }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: { active: true, ...defaultValues },
  })

  const active = watch("active")

  async function onSubmit(data: SupplierFormData) {
    setLoading(true)
    setServerError("")
    const result = supplierId
      ? await updateSupplier(supplierId, data)
      : await createSupplier(data)

    if ("error" in result && result.error) {
      setServerError("Verifique os campos e tente novamente.")
      setLoading(false)
      return
    }
    router.push("/suppliers")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dados principais */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados principais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome *" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Nome do fornecedor" />
            </Field>
            <Field label="CNPJ" error={errors.cnpj?.message}>
              <Input {...register("cnpj")} placeholder="00.000.000/0001-00" />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input {...register("email")} type="email" placeholder="contato@fornecedor.com" />
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
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <Checkbox
                checked={active}
                onCheckedChange={(v) => setValue("active", !!v)}
              />
              <span className="text-sm">Fornecedor ativo</span>
            </label>
          </CardContent>
        </Card>

        {/* Endereço + condições */}
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
            <CardHeader><CardTitle className="text-sm">Condições comerciais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Condição de pagamento">
                <Input {...register("paymentTerms")} placeholder="Ex: 30/60 dias, à vista" />
              </Field>
              <Field label="Prazo médio de entrega (dias)">
                <Input {...register("avgLeadDays")} type="number" placeholder="0" />
              </Field>
              <Field label="Observações">
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Notas internas sobre este fornecedor..."
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {supplierId ? "Salvar alterações" : "Cadastrar fornecedor"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
