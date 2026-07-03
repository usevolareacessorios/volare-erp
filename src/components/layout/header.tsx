"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrasiliaClock } from "./brasilia-clock"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <BrasiliaClock />
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
