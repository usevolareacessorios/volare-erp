"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

function VolareBrandmark() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
      <circle cx="40" cy="40" r="36" stroke="#8c1a3c" strokeWidth="1.5" fill="none" />
      {/* Bird 1 — upper right */}
      <path
        d="M24 27 C27 21, 35 19, 40 23 C43 25, 46 24, 50 21 C47 26, 44 29, 40 28 C36 27, 33 30, 30 33 C27 30, 24 29, 24 27Z"
        fill="#8c1a3c" opacity="0.85"
      />
      <path d="M24 27 C22 23, 18 22, 17 25 C19 25, 22 26, 24 27Z" fill="#8c1a3c" opacity="0.6" />
      {/* Bird 2 — lower left, mirrored */}
      <path
        d="M56 53 C53 59, 45 61, 40 57 C37 55, 34 56, 30 59 C33 54, 36 51, 40 52 C44 53, 47 50, 50 47 C53 50, 56 51, 56 53Z"
        fill="#8c1a3c" opacity="0.85"
      />
      <path d="M56 53 C58 57, 62 58, 63 55 C61 55, 58 54, 56 53Z" fill="#8c1a3c" opacity="0.6" />
      {/* Branch */}
      <path d="M40 33 C40 33, 42 36, 45 37 C42 37, 40 39, 40 39" stroke="#c9a055" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M40 39 C40 39, 38 42, 35 43 C38 43, 40 45, 40 45" stroke="#c9a055" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Gold sparkle */}
      <path d="M40 37 L40.7 39 L42.5 39.7 L40.7 40.4 L40 42.4 L39.3 40.4 L37.5 39.7 L39.3 39Z" fill="#c9a055" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("E-mail ou senha inválidos.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[420px] shrink-0 px-12"
        style={{ backgroundColor: "#3d0c1e" }}
      >
        <VolareBrandmark />
        <div className="mt-6 text-center">
          <h1
            className="text-3xl font-semibold tracking-[0.18em] uppercase"
            style={{ color: "#fdf2f5" }}
          >
            Volare
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="h-px flex-1" style={{ backgroundColor: "#c9a055" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#c9a055" }}>
              Acessórios
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "#c9a055" }} />
          </div>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: "#c4a0ae" }}>
            Sistema de gestão integrado para sua loja de semijoias.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <VolareBrandmark />
            <h1 className="mt-3 text-2xl font-semibold tracking-widest uppercase" style={{ color: "#8c1a3c" }}>
              Volare
            </h1>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: "#c9a055" }}>
              Acessórios
            </p>
          </div>

          <div className="mb-7">
            <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              Bem-vinda de volta
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Entre com sua conta para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-center mt-8" style={{ color: "var(--muted-foreground)" }}>
            Volare Acessórios · Sistema ERP
          </p>
        </div>
      </div>
    </div>
  )
}
