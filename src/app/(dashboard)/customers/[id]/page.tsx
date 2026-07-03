import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { CustomerForm } from "@/components/customers/customer-form"
import { getCustomer } from "@/lib/actions/customers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ChevronLeft, ShoppingBag, Heart, CalendarHeart, Star } from "lucide-react"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)
  if (!customer) notFound()

  const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.total), 0)
  const avgTicket = customer.sales.length > 0 ? totalSpent / customer.sales.length : 0

  const daysSinceLast = customer.lastPurchaseAt
    ? Math.floor((Date.now() - new Date(customer.lastPurchaseAt).getTime()) / 86400000)
    : null

  return (
    <div className="flex flex-col flex-1">
      <Header title={customer.name} />
      <main className="flex-1 p-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar para clientes
          </Link>
          {customer.isVip && (
            <Badge className="bg-amber-500 text-white gap-1">
              <Star className="w-3 h-3 fill-current" />
              VIP
            </Badge>
          )}
        </div>

        {/* Resumo financeiro */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total gasto</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Compras realizadas</p>
              <p className="text-xl font-bold mt-1">{customer._count.sales}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(avgTicket)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Última compra</p>
              <p className="text-xl font-bold mt-1">{customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : "—"}</p>
              {daysSinceLast !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">{daysSinceLast} dias atrás</p>
              )}
            </CardContent>
          </Card>
        </div>

        <CustomerForm
          customerId={customer.id}
          defaultValues={{
            name: customer.name,
            cpf: customer.cpf,
            birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().split("T")[0] : null,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            instagram: customer.instagram,
            email: customer.email,
            street: customer.street,
            city: customer.city,
            state: customer.state,
            zipCode: customer.zipCode,
            notes: customer.notes,
            active: customer.active,
            isVip: customer.isVip,
          }}
        />

        {/* Lista de desejos */}
        {customer.wishlistItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Lista de desejos ({customer.wishlistItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {customer.wishlistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    <p className="text-xs font-medium mt-0.5">{formatCurrency(Number(item.product.salePrice))}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Datas especiais */}
        {customer.specialDates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarHeart className="w-4 h-4 text-pink-500" />
                Datas especiais
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {customer.specialDates.map((sd) => (
                <div key={sd.id} className="py-2.5 flex items-center justify-between">
                  <span className="text-sm">{sd.description}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(sd.date)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Histórico de compras */}
        {customer.sales.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico de compras</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              {customer.sales.map((sale) => (
                <div key={sale.id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">#{sale.number}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">Concluída</Badge>
                      <span className="text-sm font-bold">{formatCurrency(sale.total)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {sale.items.map((item) => (
                      <span key={item.id} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {item.quantity}x {item.product.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
