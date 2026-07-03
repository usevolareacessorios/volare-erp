"use client"

import * as React from "react"
import { loadTheme, applyTheme } from "@/lib/theme-config"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    applyTheme(loadTheme())
  }, [])

  return <>{children}</>
}
