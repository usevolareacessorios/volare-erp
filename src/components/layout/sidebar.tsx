"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ShoppingCart,
  Users,
  Receipt,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  BookOpen,
  Banknote,
  Shield,
  Wrench,
  TrendingUp,
  BarChart3,
  Tag,
  FileText,
  LineChart,
  Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

const LOGO_KEY = "volare_logo"

const navGroups = [
  {
    label: null,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/products", label: "Produtos", icon: Package },
      { href: "/inventory", label: "Estoque", icon: Warehouse },
      { href: "/labels", label: "Etiquetas", icon: Tag },
      { href: "/catalog", label: "Catálogo Digital", icon: BookOpen },
    ],
  },
  {
    label: "Compras",
    items: [
      { href: "/suppliers", label: "Fornecedores", icon: Truck },
      { href: "/purchases", label: "Compras", icon: ShoppingCart },
    ],
  },
  {
    label: "Vendas",
    items: [
      { href: "/pos", label: "Realizar Venda", icon: Receipt },
      { href: "/sales", label: "Vendas", icon: ShoppingBag },
      { href: "/orders", label: "Orçamentos & Pedidos", icon: FileText },
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/commissions", label: "Comissões", icon: TrendingUp },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/caixa", label: "Caixa", icon: Banknote },
      { href: "/finance", label: "Financeiro", icon: CreditCard },
      { href: "/dre", label: "DRE & Fluxo de Caixa", icon: LineChart },
    ],
  },
  {
    label: "Pós-venda",
    items: [
      { href: "/warranties", label: "Garantias", icon: Shield },
      { href: "/service", label: "Assistência Técnica", icon: Wrench },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/reports", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/integrations", label: "Integrações", icon: Plug },
      { href: "/settings", label: "Configurações", icon: Settings },
    ],
  },
]

function VolareLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
      <circle cx="24" cy="24" r="21" stroke="#d4993a" strokeWidth="1.2" fill="none" />
      <path
        d="M14 16 C16 12, 22 11, 26 14 C28 15.5, 30 15, 32 13 C30 16, 28 18, 25 17.5 C22 17, 20 19, 18 21 C16 19, 14 18, 14 16Z"
        fill="#f5e6d0" opacity="0.9"
      />
      <path d="M14 16 C13 13, 11 12, 10 14 C11 14, 13 15, 14 16Z" fill="#f5e6d0" opacity="0.7" />
      <path
        d="M34 32 C32 36, 26 37, 22 34 C20 32.5, 18 33, 16 35 C18 32, 20 30, 23 30.5 C26 31, 28 29, 30 27 C32 29, 34 30, 34 32Z"
        fill="#f5e6d0" opacity="0.9"
      />
      <path d="M34 32 C35 35, 37 36, 38 34 C37 34, 35 33, 34 32Z" fill="#f5e6d0" opacity="0.7" />
      <path d="M24 20 C24 20, 25 22, 27 23 C25 23, 24 24, 24 24" stroke="#d4993a" strokeWidth="0.9" fill="none" />
      <path d="M24 24 C24 24, 23 26, 21 27 C23 27, 24 28, 24 28" stroke="#d4993a" strokeWidth="0.9" fill="none" />
      <path d="M24 22 L24.4 23.2 L25.6 23.6 L24.4 24 L24 25.2 L23.6 24 L22.4 23.6 L23.6 23.2Z" fill="#d4993a" />
    </svg>
  )
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
        active ? "font-medium" : "opacity-70 hover:opacity-100"
      )}
      style={active ? { backgroundColor: "var(--sidebar-accent)", color: "#ffffff" } : { color: "var(--sidebar-foreground)" }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "var(--sidebar-accent)"
          e.currentTarget.style.color = "#ffffff"
          e.currentTarget.style.opacity = "1"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "var(--sidebar-foreground)"
          e.currentTarget.style.opacity = "0.7"
        }
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    setLogoUrl(localStorage.getItem(LOGO_KEY))
    const handler = () => setLogoUrl(localStorage.getItem(LOGO_KEY))
    window.addEventListener("volare_logo_changed", handler)
    return () => window.removeEventListener("volare_logo_changed", handler)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside
      className="flex flex-col w-60 min-h-screen py-5 px-3"
      style={{ backgroundColor: "var(--sidebar-background)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <Link href="/" className="px-2 mb-6 block">
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo" width={200} height={80} className="w-full max-h-20 object-contain object-left" unoptimized />
        ) : (
          <div className="flex items-center gap-3">
            <VolareLogo />
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--sidebar-foreground)", letterSpacing: "0.14em" }}>
                Volare
              </span>
              <span className="text-[9px] tracking-[0.22em] uppercase mt-0.5" style={{ color: "var(--sidebar-muted, #c4a0ae)" }}>
                Acessórios
              </span>
            </div>
          </div>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-muted, #c4a0ae)" }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
                return <NavLink key={href} href={href} label={label} icon={icon} active={active} />
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 mt-4 mb-3 h-px" style={{ backgroundColor: "var(--sidebar-border)" }} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors opacity-60 hover:opacity-100"
        style={{ color: "var(--sidebar-foreground)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--sidebar-accent)"
          e.currentTarget.style.color = "#fca5a5"
          e.currentTarget.style.opacity = "1"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "var(--sidebar-foreground)"
          e.currentTarget.style.opacity = "0.6"
        }}
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </aside>
  )
}
