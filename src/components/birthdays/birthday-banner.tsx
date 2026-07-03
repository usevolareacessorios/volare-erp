"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cake, Phone, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type BirthdayCustomer = {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  daysUntil: number
  nextBirthday: Date
}

function dayLabel(days: number) {
  if (days === 0) return "Hoje"
  if (days === 1) return "Amanhã"
  return `Em ${days} dias`
}

export function BirthdayBanner({ customers }: { customers: BirthdayCustomer[] }) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  if (dismissed || customers.length === 0) return null

  const todayCount = customers.filter((c) => c.daysUntil === 0).length

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-800">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-2 rounded-full bg-amber-100 shrink-0">
            <Cake className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-amber-800">
                {todayCount > 0
                  ? `${todayCount} aniversariante${todayCount !== 1 ? "s" : ""} hoje!`
                  : `${customers.length} aniversariante${customers.length !== 1 ? "s" : ""} nos próximos dias`
                }
              </span>
              <Badge className="bg-amber-200 text-amber-800 border-0 text-[10px] py-0">
                próximos 7 dias
              </Badge>
            </div>
            {!expanded && (
              <p className="text-xs text-amber-700 mt-0.5 truncate">
                {customers.slice(0, 3).map((c) => c.name).join(", ")}
                {customers.length > 3 ? ` e mais ${customers.length - 3}` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-400 hover:text-amber-700 transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        {expanded && (
          <div className="border-t border-amber-100 divide-y divide-amber-100">
            {customers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  c.daysUntil === 0
                    ? "bg-amber-400 text-white"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {c.daysUntil === 0 ? "🎂" : c.daysUntil}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 truncate">{c.name}</p>
                  <p className="text-xs text-amber-600">
                    {new Date(c.nextBirthday).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                    {" · "}
                    <span className={cn(
                      "font-medium",
                      c.daysUntil === 0 ? "text-amber-600" : "text-amber-500"
                    )}>
                      {dayLabel(c.daysUntil)}
                    </span>
                  </p>
                </div>
                {(c.whatsapp || c.phone) && (
                  <a
                    href={`https://wa.me/55${(c.whatsapp || c.phone)!.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors shrink-0"
                    title="Enviar parabéns"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
