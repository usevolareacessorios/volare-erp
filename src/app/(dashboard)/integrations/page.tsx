import { Header } from "@/components/layout/header"
import { getIntegrations } from "@/lib/actions/integrations"
import { IntegrationsClient } from "@/components/integrations/integrations-client"
import { Plug } from "lucide-react"

export default async function IntegrationsPage() {
  const integrations = await getIntegrations()

  return (
    <div className="flex flex-col flex-1">
      <Header title="Integrações" />
      <main className="flex-1 p-6 max-w-5xl space-y-4 overflow-auto">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
          <Plug className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Conecte o Volare às suas plataformas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expanda cada integração, insira as credenciais e clique em Conectar. As chaves são salvas com segurança no banco de dados.
            </p>
          </div>
        </div>
        <IntegrationsClient integrations={integrations as Parameters<typeof IntegrationsClient>[0]["integrations"]} />
      </main>
    </div>
  )
}
