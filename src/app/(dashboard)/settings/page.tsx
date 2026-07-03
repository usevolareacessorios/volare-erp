import { Header } from "@/components/layout/header"
import { getCategories, getCollections, getBrands } from "@/lib/actions/lookups"
import { getCoupons } from "@/lib/actions/coupons"
import { getUsers } from "@/lib/actions/users"
import { SettingsCatalogs } from "@/components/settings/settings-catalogs"
import { ThemeCustomizer } from "@/components/settings/theme-customizer"
import { CouponManager } from "@/components/settings/coupon-manager"
import { UsersManager } from "@/components/settings/users-manager"
import { HostingGuide } from "@/components/settings/hosting-guide"
import { createClient } from "@/lib/supabase/server"
import { Palette, Ticket, Users, Server } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id ?? "").single()
  const isAdmin = profile?.role === "ADMIN"

  const [categories, collections, brands, coupons, users] = await Promise.all([
    getCategories(), getCollections(), getBrands(), getCoupons(),
    isAdmin ? getUsers() : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações" />
      <main className="flex-1 p-6 max-w-5xl space-y-8 overflow-auto">

        {isAdmin && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Aparência</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Personalize as cores e logo do sistema.</p>
            <ThemeCustomizer />
          </section>
        )}

        {isAdmin && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Usuários</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Gerencie os usuários do sistema e suas funções.
            </p>
            <UsersManager users={users} currentUserId={user?.id ?? ""} />
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Cupons de desconto</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Crie cupons para aplicar desconto nas vendas. O código é inserido no momento da venda.
          </p>
          <CouponManager coupons={coupons} />
        </section>

        {isAdmin && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Hospedagem</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Guia passo a passo para publicar o sistema online com Vercel, Railway ou servidor próprio.
            </p>
            <HostingGuide />
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold mb-1">Catálogos</h2>
          <p className="text-xs text-muted-foreground mb-4">Gerencie categorias, coleções e marcas dos produtos.</p>
          <SettingsCatalogs categories={categories} collections={collections} brands={brands} />
        </section>
      </main>
    </div>
  )
}
