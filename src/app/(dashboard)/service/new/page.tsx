import { Header } from "@/components/layout/header"
import { ServiceForm } from "@/components/service/service-form"

export default function NewServicePage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Nova Ordem de Serviço" />
      <main className="flex-1 p-6 overflow-auto">
        <ServiceForm />
      </main>
    </div>
  )
}
