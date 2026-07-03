import { Header } from "@/components/layout/header"
import { PosTerminal } from "@/components/pos/pos-terminal"

export default function PosPage() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <Header title="Realizar Venda" />
      <PosTerminal />
    </div>
  )
}
