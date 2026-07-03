import { Header } from "@/components/layout/header"
import { LabelsClient } from "@/components/labels/labels-client"

export default function LabelsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Etiquetas" />
      <main className="flex-1 p-6 overflow-auto">
        <LabelsClient />
      </main>
    </div>
  )
}
