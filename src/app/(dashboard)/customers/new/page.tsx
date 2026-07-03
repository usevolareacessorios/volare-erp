import { Header } from "@/components/layout/header"
import { CustomerForm } from "@/components/customers/customer-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Novo cliente" />
      <main className="flex-1 p-6 max-w-4xl">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para clientes
        </Link>
        <CustomerForm />
      </main>
    </div>
  )
}
