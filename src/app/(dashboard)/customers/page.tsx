import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCustomers, getCustomerStats } from "@/lib/actions/customers"
import { CustomersList } from "@/components/customers/customers-list"
import { Plus, Users, Cake } from "lucide-react"

export default async function CustomersPage() {
  const [customers, stats] = await Promise.all([getCustomers(), getCustomerStats()])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Clientes" />
      <main className="flex-1 p-6 space-y-5 overflow-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total ativos</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Novos este mês</p>
            <p className="text-2xl font-bold mt-1">{stats.newThisMonth}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-start gap-2">
            <Cake className="w-4 h-4 text-[var(--color-gold-500)] mt-1 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Aniversários este mês</p>
              <p className="text-2xl font-bold">{stats.birthdays.length}</p>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total cadastrados</p>
            <p className="text-2xl font-bold mt-1">{customers.length}</p>
          </CardContent></Card>
        </div>

        {/* Aniversários do mês */}
        {stats.birthdays.length > 0 && (
          <Card className="border-[var(--color-gold-200)] bg-[var(--color-gold-50)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cake className="w-4 h-4 text-[var(--color-gold-600)]" />
                <p className="text-sm font-medium text-[var(--color-gold-700)]">Aniversariantes deste mês</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.birthdays.map((c) => (
                  <Link key={c.id} href={`/customers/${c.id}`}>
                    <Badge variant="gold" className="cursor-pointer hover:opacity-80">
                      {c.name} · {new Date(c.birthDate!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Todos os clientes</h2>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="w-4 h-4" /> Novo cliente
            </Link>
          </Button>
        </div>

        {/* Lista com busca */}
        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="p-3 rounded-full bg-[var(--color-gold-100)]">
                <Users className="w-6 h-6 text-[var(--color-gold-600)]" />
              </div>
              <p className="font-medium">Nenhum cliente cadastrado</p>
              <p className="text-sm text-muted-foreground">Cadastre seus clientes para acompanhar histórico e aniversários.</p>
              <Button asChild className="mt-2">
                <Link href="/customers/new"><Plus className="w-4 h-4" /> Cadastrar cliente</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CustomersList customers={customers} />
        )}
      </main>
    </div>
  )
}
