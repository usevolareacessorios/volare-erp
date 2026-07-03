import { Header } from "@/components/layout/header"
import { InvoiceImporter } from "@/components/products/invoice-importer"
import { getCategories } from "@/lib/actions/lookups"

export default async function ImportInvoicePage() {
  const categories = await getCategories()
  return (
    <div className="flex flex-col flex-1">
      <Header title="Importar nota fiscal" />
      <main className="flex-1 p-6 overflow-auto">
        <InvoiceImporter categories={categories} />
      </main>
    </div>
  )
}
