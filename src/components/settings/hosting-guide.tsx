"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, ExternalLink, Server, Zap, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

const ENV_VARS = [
  { key: "DATABASE_URL", desc: "URL de conexão com o banco Postgres (Supabase)" },
  { key: "NEXT_PUBLIC_SUPABASE_URL", desc: "URL do projeto Supabase" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Chave pública do Supabase" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", desc: "Chave de serviço (admin) do Supabase" },
]

const PLATFORMS = [
  {
    id: "vercel",
    name: "Vercel",
    tagline: "Mais fácil — gratuito para começar",
    recommended: true,
    icon: Zap,
    color: "#000000",
    steps: [
      "Crie uma conta gratuita em vercel.com",
      'Clique em "Add New Project" e conecte seu repositório GitHub',
      "Em Environment Variables, adicione todas as variáveis abaixo",
      'Clique em "Deploy" — pronto! URL gerada automaticamente',
    ],
    url: "https://vercel.com/new",
    docs: "https://vercel.com/docs",
  },
  {
    id: "railway",
    name: "Railway",
    tagline: "Simples, com banco incluso",
    recommended: false,
    icon: Cloud,
    color: "#7B2CF9",
    steps: [
      "Crie conta em railway.app",
      'Clique em "New Project" → "Deploy from GitHub repo"',
      "Adicione as variáveis de ambiente no painel do projeto",
      'Acesse "Settings → Domains" para gerar sua URL pública',
    ],
    url: "https://railway.app/new",
    docs: "https://docs.railway.app",
  },
  {
    id: "vps",
    name: "VPS / Servidor próprio",
    tagline: "Controle total — para quem sabe usar terminal",
    recommended: false,
    icon: Server,
    color: "#e25822",
    steps: [
      "Instale Node.js 20+ no servidor: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`",
      "Clone o repositório: `git clone <seu-repo>`",
      "Crie arquivo `.env.local` com as variáveis abaixo",
      "Execute: `npm install && npm run build && npm start`",
      "Use Nginx como proxy reverso na porta 3000 (recomendado)",
    ],
    url: "https://www.digitalocean.com/products/droplets",
    docs: "https://nextjs.org/docs/deployment",
  },
]

export function HostingGuide() {
  const [selected, setSelected] = useState("vercel")
  const [copied, setCopied] = useState<string | null>(null)

  function copyEnv() {
    const text = ENV_VARS.map((v) => `${v.key}=`).join("\n")
    navigator.clipboard.writeText(text)
    setCopied("env")
    setTimeout(() => setCopied(null), 2000)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const platform = PLATFORMS.find((p) => p.id === selected)!

  return (
    <div className="space-y-4">
      {/* Platform selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLATFORMS.map((p) => {
          const Icon = p.icon
          return (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={cn("text-left p-4 rounded-xl border-2 transition-all",
                selected === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">{p.name}</span>
                {p.recommended && <Badge className="text-[10px] py-0 px-1.5">Recomendado</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{p.tagline}</p>
            </button>
          )
        })}
      </div>

      {/* Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Passos para hospedar no {platform.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            {platform.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: step.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono text-foreground">$1</code>') }}
                />
              </li>
            ))}
          </ol>

          <div className="flex gap-2">
            <a href={platform.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir {platform.name}
              </Button>
            </a>
            <a href={platform.docs} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="w-3.5 h-3.5" /> Documentação
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Environment variables */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Variáveis de ambiente necessárias</CardTitle>
            <Button size="sm" variant="outline" onClick={copyEnv}>
              {copied === "env" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "env" ? "Copiado!" : "Copiar todas"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ENV_VARS.map((v) => (
              <div key={v.key} className="flex items-center justify-between px-4 py-3 gap-3">
                <div>
                  <code className="text-xs font-mono font-semibold">{v.key}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
                </div>
                <Button size="icon" variant="ghost" className="w-7 h-7 shrink-0" onClick={() => copyKey(v.key)}>
                  {copied === v.key
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 Os valores das variáveis estão no seu arquivo <code className="bg-muted px-1 rounded">.env.local</code> local. Nunca compartilhe a <code className="bg-muted px-1 rounded">SERVICE_ROLE_KEY</code> publicamente.
      </p>
    </div>
  )
}
