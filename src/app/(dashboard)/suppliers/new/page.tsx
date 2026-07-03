import { Header } from "@/components/layout/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewSupplierPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Novo fornecedor" />
      <main className="flex-1 p-6 max-w-4xl">
        <Link href="/suppliers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para fornecedores
        </Link>
        <SupplierForm />
      </main>
    </div>
  )
}
