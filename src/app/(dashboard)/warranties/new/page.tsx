import { Header } from "@/components/layout/header"
import { WarrantyForm } from "@/components/warranties/warranty-form"

export default function NewWarrantyPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Nova Garantia" />
      <main className="flex-1 p-6 overflow-auto">
        <WarrantyForm />
      </main>
    </div>
  )
}
