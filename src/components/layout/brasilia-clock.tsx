"use client"

import { useEffect, useState } from "react"

export function BrasiliaClock() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  function update() {
    const now = new Date()
    const timeStr = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
    const dateStr = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short" })
    setTime(timeStr)
    setDate(dateStr.replace(/^\w/, (c) => c.toUpperCase()))
  }

  useEffect(() => {
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return (
    <div className="flex flex-col items-end leading-none select-none">
      <span className="text-sm font-semibold tabular-nums">{time}</span>
      <span className="text-[10px] text-muted-foreground capitalize">{date}</span>
    </div>
  )
}
