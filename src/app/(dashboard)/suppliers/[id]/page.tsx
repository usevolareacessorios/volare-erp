import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { getSupplier } from "@/lib/actions/suppliers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ChevronLeft, Package } from "lucide-react"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await getSupplier(id)
  if (!supplier) notFound()

  return (
    <div className="flex flex-col flex-1">
      <Header title={supplier.name} />
      <main className="flex-1 p-6 max-w-5xl space-y-6">
        <Link href="/suppliers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para fornecedores
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Produtos vinculados</p>
              <p className="text-2xl font-bold mt-1">{supplier._count.products}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Compras realizadas</p>
              <p className="text-2xl font-bold mt-1">{supplier._count.purchases}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Prazo médio</p>
              <p className="text-2xl font-bold mt-1">{supplier.avgLeadDays ?? "—"} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
            </CardContent>
          </Card>
        </div>

        <SupplierForm
          supplierId={supplier.id}
          defaultValues={{
            name: supplier.name,
            cnpj: supplier.cnpj,
            phone: supplier.phone,
            whatsapp: supplier.whatsapp,
            instagram: supplier.instagram,
            email: supplier.email,
            street: supplier.street,
            city: supplier.city,
            state: supplier.state,
            zipCode: supplier.zipCode,
            paymentTerms: supplier.paymentTerms,
            avgLeadDays: supplier.avgLeadDays,
            notes: supplier.notes,
            active: supplier.active,
          }}
        />

        {/* Produtos vinculados */}
        {supplier.products.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Produtos vinculados</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              {supplier.products.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between py-2.5 hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{p.sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={p.currentStock === 0 ? "destructive" : "secondary"} className="text-xs">
                      {p.currentStock} un
                    </Badge>
                    <span className="text-sm font-medium">{formatCurrency(p.salePrice)}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
