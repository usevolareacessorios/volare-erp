import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSuppliers } from "@/lib/actions/suppliers"
import { SuppliersList } from "@/components/suppliers/suppliers-list"
import { Plus, Truck } from "lucide-react"

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()
  const active = suppliers.filter((s) => s.active)
  const inactive = suppliers.filter((s) => !s.active)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Fornecedores" />
      <main className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {active.length} ativo{active.length !== 1 ? "s" : ""}
            {inactive.length > 0 && ` · ${inactive.length} inativo${inactive.length !== 1 ? "s" : ""}`}
          </p>
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus className="w-4 h-4" /> Novo fornecedor
            </Link>
          </Button>
        </div>

        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="p-3 rounded-full bg-[var(--color-gold-100)]">
                <Truck className="w-6 h-6 text-[var(--color-gold-600)]" />
              </div>
              <p className="font-medium">Nenhum fornecedor cadastrado</p>
              <p className="text-sm text-muted-foreground">Cadastre seus fornecedores para vincular a produtos e compras.</p>
              <Button asChild className="mt-2">
                <Link href="/suppliers/new"><Plus className="w-4 h-4" /> Cadastrar fornecedor</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SuppliersList suppliers={suppliers} />
        )}
      </main>
    </div>
  )
}
