"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { THEME_PRESETS, DEFAULT_THEME, saveTheme, loadTheme, type ThemeConfig } from "@/lib/theme-config"
import { Check, RotateCcw, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export const LOGO_STORAGE_KEY = "volare_logo"

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", preview: "font-sans" },
  { value: "poppins", label: "Poppins", preview: "font-sans" },
  { value: "dm-sans", label: "DM Sans", preview: "font-sans" },
  { value: "playfair", label: "Playfair Display", preview: "font-serif" },
]

const RADIUS_OPTIONS = [
  { value: "none", label: "Sem borda" },
  { value: "sm", label: "Pequena" },
  { value: "md", label: "Média" },
  { value: "lg", label: "Grande" },
  { value: "xl", label: "Muito grande" },
]

const DENSITY_OPTIONS = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Espaçoso" },
]

export function ThemeCustomizer() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME)
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoLoading, setLogoLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setConfig(loadTheme())
    setLogoUrl(localStorage.getItem(LOGO_STORAGE_KEY))
  }, [])

  function apply(partial: Partial<ThemeConfig>) {
    const next = { ...config, ...partial }
    setConfig(next)
    saveTheme(next)
    flash()
  }

  function flash() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setConfig(DEFAULT_THEME)
    saveTheme(DEFAULT_THEME)
    flash()
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("A imagem deve ter no máximo 2 MB."); return }
    setLogoLoading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      localStorage.setItem(LOGO_STORAGE_KEY, dataUrl)
      setLogoUrl(dataUrl)
      setLogoLoading(false)
      window.dispatchEvent(new Event("volare_logo_changed"))
      flash()
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  function removeLogo() {
    localStorage.removeItem(LOGO_STORAGE_KEY)
    setLogoUrl(null)
    window.dispatchEvent(new Event("volare_logo_changed"))
    flash()
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-7">

        {/* ── Logo ── */}
        <Section title="Logo da marca">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: "var(--sidebar-background)" }}>
              {logoUrl
                ? <Image src={logoUrl} alt="Logo" width={56} height={56} className="object-contain w-full h-full p-1" unoptimized />
                : <DefaultLogoSVG />}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG · máx. 2 MB<br />Recomendado: fundo transparente, 200×200 px</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={logoLoading}>
                  <Upload className="w-3.5 h-3.5" />{logoLoading ? "Carregando..." : "Enviar logo"}
                </Button>
                {logoUrl && <Button size="sm" variant="ghost" onClick={removeLogo}><X className="w-3.5 h-3.5" /> Remover</Button>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoFile} />
          </div>
        </Section>

        <Divider />

        {/* ── Presets ── */}
        <Section title="Temas prontos">
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => {
              const isActive = config.primaryColor === preset.primaryColor && config.accentColor === preset.accentColor && config.backgroundColor === preset.backgroundColor
              return (
                <button key={preset.id} onClick={() => apply(preset)}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    isActive ? "border-primary shadow-sm font-medium" : "border-border hover:border-primary/50")}>
                  <span className="flex">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.primaryColor }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 -ml-1" style={{ backgroundColor: preset.accentColor }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 -ml-1" style={{ backgroundColor: preset.backgroundColor }} />
                  </span>
                  {preset.name}
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-0.5" />}
                </button>
              )
            })}
          </div>
        </Section>

        <Divider />

        {/* ── Cores ── */}
        <Section title="Cores personalizadas">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ColorPicker label="Sidebar / Menu" value={config.primaryColor} onChange={(v) => apply({ primaryColor: v })} hint="Fundo do menu lateral" />
            <ColorPicker label="Destaque / Dourado" value={config.accentColor} onChange={(v) => apply({ accentColor: v })} hint="Ítens ativos e destaques" />
            <ColorPicker label="Fundo da página" value={config.backgroundColor} onChange={(v) => apply({ backgroundColor: v })} hint="Cor de fundo geral" />
            <ColorPicker label="Cor do texto" value={config.textColor} onChange={(v) => apply({ textColor: v })} hint="Textos principais" />
            <ColorPicker label="Fundo dos cards" value={config.cardColor} onChange={(v) => apply({ cardColor: v })} hint="Painéis e caixas" />
            <ColorPicker label="Texto do menu" value={config.sidebarTextColor ?? "#fdf2f5"} onChange={(v) => apply({ sidebarTextColor: v })} hint="Cor do texto no menu" />
            <ColorPicker label="Cor dos botões" value={config.buttonColor ?? config.primaryColor} onChange={(v) => apply({ buttonColor: v })} hint="Botões primários" />
          </div>
        </Section>

        <Divider />

        {/* ── Tipografia ── */}
        <Section title="Tipografia">
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((f) => (
              <button key={f.value} onClick={() => apply({ fontFamily: f.value })}
                className={cn("px-3 py-2 rounded-lg border text-sm transition-all",
                  config.fontFamily === f.value ? "border-primary shadow-sm font-medium bg-primary/5" : "border-border hover:border-primary/50")}>
                {f.label}
                {config.fontFamily === f.value && <Check className="inline w-3 h-3 ml-1.5 text-primary" />}
              </button>
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Bordas ── */}
        <Section title="Arredondamento das bordas">
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button key={r.value} onClick={() => apply({ borderRadius: r.value })}
                className={cn("px-3 py-2 rounded-lg border text-sm transition-all",
                  config.borderRadius === r.value ? "border-primary shadow-sm font-medium bg-primary/5" : "border-border hover:border-primary/50")}>
                {r.label}
                {config.borderRadius === r.value && <Check className="inline w-3 h-3 ml-1.5 text-primary" />}
              </button>
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Densidade ── */}
        <Section title="Densidade do layout">
          <div className="flex flex-wrap gap-2">
            {DENSITY_OPTIONS.map((d) => (
              <button key={d.value} onClick={() => apply({ density: d.value })}
                className={cn("px-3 py-2 rounded-lg border text-sm transition-all",
                  config.density === d.value ? "border-primary shadow-sm font-medium bg-primary/5" : "border-border hover:border-primary/50")}>
                {d.label}
                {config.density === d.value && <Check className="inline w-3 h-3 ml-1.5 text-primary" />}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Compacto: menos espaço entre elementos. Espaçoso: mais respiro visual.</p>
        </Section>

        {/* ── Ações ── */}
        <div className="flex items-center gap-3 pt-1">
          {saved && (
            <span className="text-sm text-emerald-600 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Salvo automaticamente
            </span>
          )}
          <Button size="sm" variant="outline" onClick={reset} className="ml-auto">
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">{title}</Label>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border" />
}

function ColorPicker({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-sm font-mono text-muted-foreground">{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function DefaultLogoSVG() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
      <circle cx="24" cy="24" r="21" stroke="#d4993a" strokeWidth="1.2" fill="none" />
      <path d="M14 16 C16 12, 22 11, 26 14 C28 15.5, 30 15, 32 13 C30 16, 28 18, 25 17.5 C22 17, 20 19, 18 21 C16 19, 14 18, 14 16Z" fill="#f5e6d0" opacity="0.9" />
      <path d="M14 16 C13 13, 11 12, 10 14 C11 14, 13 15, 14 16Z" fill="#f5e6d0" opacity="0.7" />
      <path d="M34 32 C32 36, 26 37, 22 34 C20 32.5, 18 33, 16 35 C18 32, 20 30, 23 30.5 C26 31, 28 29, 30 27 C32 29, 34 30, 34 32Z" fill="#f5e6d0" opacity="0.9" />
      <path d="M34 32 C35 35, 37 36, 38 34 C37 34, 35 33, 34 32Z" fill="#f5e6d0" opacity="0.7" />
      <path d="M24 20 C24 20, 25 22, 27 23 C25 23, 24 24, 24 24" stroke="#d4993a" strokeWidth="0.9" fill="none" />
      <path d="M24 24 C24 24, 23 26, 21 27 C23 27, 24 28, 24 28" stroke="#d4993a" strokeWidth="0.9" fill="none" />
      <path d="M24 22 L24.4 23.2 L25.6 23.6 L24.4 24 L24 25.2 L23.6 24 L22.4 23.6 L23.6 23.2Z" fill="#d4993a" />
    </svg>
  )
}
