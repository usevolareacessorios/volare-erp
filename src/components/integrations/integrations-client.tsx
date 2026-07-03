"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { INTEGRATION_META } from "@/lib/integrations-meta"
import { saveIntegration, toggleIntegration } from "@/lib/actions/integrations"
import { ExternalLink, Plug, PlugZap, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Integration = {
  id: string; slug: string; name: string; enabled: boolean
  config: Record<string, string>
}

const CATEGORIES = ["IA", "Comunicação", "Social", "Marketplace", "Produtividade"]

export function IntegrationsClient({ integrations }: { integrations: Integration[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const bySlug = Object.fromEntries(integrations.map((i) => [i.slug, i]))

  function getConfig(slug: string): Record<string, string> {
    return forms[slug] ?? (bySlug[slug]?.config as Record<string, string> ?? {})
  }

  function setField(slug: string, key: string, value: string) {
    setForms((f) => ({ ...f, [slug]: { ...getConfig(slug), [key]: value } }))
  }

  function refresh() { startTransition(() => router.refresh()) }

  async function handleSave(slug: string) {
    setSaving(slug)
    const config = getConfig(slug)
    await saveIntegration(slug, config, bySlug[slug]?.enabled ?? false)
    setSaving(null)
    refresh()
  }

  async function handleToggle(slug: string, current: boolean) {
    setToggling(slug)
    await toggleIntegration(slug, !current)
    setToggling(null)
    refresh()
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat) => {
        const slugs = Object.entries(INTEGRATION_META).filter(([, m]) => m.category === cat).map(([s]) => s)
        if (slugs.length === 0) return null
        return (
          <section key={cat}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slugs.map((slug) => {
                const meta = INTEGRATION_META[slug]
                const saved = bySlug[slug]
                const isEnabled = saved?.enabled ?? false
                const isExpanded = expanded === slug
                const config = getConfig(slug)

                return (
                  <Card key={slug} className={cn("transition-shadow", isEnabled && "ring-1 ring-emerald-400/40")}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Color dot as logo placeholder */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{ backgroundColor: meta.color }}>
                            {meta.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              {meta.name}
                              {isEnabled
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
                              }
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {meta.docsUrl && (
                            <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="w-7 h-7">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="w-7 h-7"
                            onClick={() => setExpanded(isExpanded ? null : slug)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4 border-t border-border mt-0">
                        <div className="pt-3 space-y-3">
                          {meta.fields.map((field) => (
                            <div key={field.key} className="space-y-1.5">
                              <Label className="text-xs">{field.label}</Label>
                              {field.type === "textarea" ? (
                                <textarea
                                  value={config[field.key] ?? ""}
                                  onChange={(e) => setField(slug, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  rows={3}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                              ) : (
                                <Input
                                  type={field.type ?? "text"}
                                  value={config[field.key] ?? ""}
                                  onChange={(e) => setField(slug, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="text-xs font-mono h-8"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(slug)} disabled={saving === slug}>
                            {saving === slug ? "Salvando..." : "Salvar configuração"}
                          </Button>
                          <Button
                            size="sm"
                            variant={isEnabled ? "outline" : "default"}
                            className={isEnabled ? "text-destructive border-destructive hover:bg-destructive/10" : ""}
                            onClick={() => handleToggle(slug, isEnabled)}
                            disabled={toggling === slug}
                          >
                            {toggling === slug ? "Aguarde..." : isEnabled
                              ? <><PlugZap className="w-3.5 h-3.5" /> Desconectar</>
                              : <><Plug className="w-3.5 h-3.5" /> Conectar</>
                            }
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
