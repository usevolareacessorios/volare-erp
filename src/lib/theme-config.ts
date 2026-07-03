export type ThemeConfig = {
  primaryColor: string      // sidebar background
  accentColor: string       // gold / highlight
  backgroundColor: string  // page background
  textColor: string         // foreground / body text
  cardColor: string         // card background
  // New extended options
  fontFamily: string        // "inter" | "poppins" | "dm-sans" | "playfair"
  borderRadius: string      // "none" | "sm" | "md" | "lg" | "xl"
  density: string           // "compact" | "normal" | "spacious"
  sidebarTextColor: string  // sidebar foreground text
  buttonColor: string       // primary button color (defaults to primaryColor)
}

export const THEME_PRESETS: (ThemeConfig & { id: string; name: string })[] = [
  {
    id: "vinho",
    name: "Vinho Clássico",
    primaryColor: "#3d0c1e",
    accentColor: "#d4993a",
    backgroundColor: "#ede8e0",
    textColor: "#2a1e1e",
    cardColor: "#ffffff",
    fontFamily: "inter",
    borderRadius: "lg",
    density: "normal",
    sidebarTextColor: "#fdf2f5",
    buttonColor: "#3d0c1e",
  },
  {
    id: "teal",
    name: "Verde Esmeralda",
    primaryColor: "#0e382c",
    accentColor: "#d4993a",
    backgroundColor: "#ede8e0",
    textColor: "#1a2e28",
    cardColor: "#ffffff",
    fontFamily: "inter",
    borderRadius: "lg",
    density: "normal",
    sidebarTextColor: "#d4f5ec",
    buttonColor: "#0e382c",
  },
  {
    id: "preto",
    name: "Preto Elegante",
    primaryColor: "#111111",
    accentColor: "#d4993a",
    backgroundColor: "#ede8e0",
    textColor: "#1a1a1a",
    cardColor: "#ffffff",
    fontFamily: "inter",
    borderRadius: "lg",
    density: "normal",
    sidebarTextColor: "#f5f5f5",
    buttonColor: "#111111",
  },
  {
    id: "dourado",
    name: "Dourado",
    primaryColor: "#5a3a0a",
    accentColor: "#c9a055",
    backgroundColor: "#fdf9f0",
    textColor: "#2e200a",
    cardColor: "#ffffff",
    fontFamily: "poppins",
    borderRadius: "xl",
    density: "normal",
    sidebarTextColor: "#fdf6e3",
    buttonColor: "#5a3a0a",
  },
  {
    id: "cinza",
    name: "Grafite",
    primaryColor: "#1e2228",
    accentColor: "#8c1a3c",
    backgroundColor: "#f4f4f5",
    textColor: "#18181b",
    cardColor: "#ffffff",
    fontFamily: "dm-sans",
    borderRadius: "md",
    density: "normal",
    sidebarTextColor: "#e4e4e7",
    buttonColor: "#1e2228",
  },
  {
    id: "creme-vinho",
    name: "Creme & Vinho",
    primaryColor: "#8c1a3c",
    accentColor: "#c9a055",
    backgroundColor: "#f5ede4",
    textColor: "#6b0f2b",
    cardColor: "#fdf6ef",
    fontFamily: "playfair",
    borderRadius: "lg",
    density: "normal",
    sidebarTextColor: "#fdf2f5",
    buttonColor: "#8c1a3c",
  },
  {
    id: "azul-moderno",
    name: "Azul Moderno",
    primaryColor: "#1e3a5f",
    accentColor: "#3b82f6",
    backgroundColor: "#f0f4f8",
    textColor: "#1e293b",
    cardColor: "#ffffff",
    fontFamily: "dm-sans",
    borderRadius: "md",
    density: "compact",
    sidebarTextColor: "#e0f0ff",
    buttonColor: "#1e3a5f",
  },
  {
    id: "roxo",
    name: "Roxo Real",
    primaryColor: "#2d1b69",
    accentColor: "#a78bfa",
    backgroundColor: "#f5f0ff",
    textColor: "#1e1035",
    cardColor: "#ffffff",
    fontFamily: "poppins",
    borderRadius: "xl",
    density: "normal",
    sidebarTextColor: "#ede9fe",
    buttonColor: "#2d1b69",
  },
]

export const DEFAULT_THEME: ThemeConfig = THEME_PRESETS[0]

export const STORAGE_KEY = "volare_theme"

const FONT_VARS: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  poppins: "'Poppins', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
}

const RADIUS_VARS: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
}

const DENSITY_VARS: Record<string, Record<string, string>> = {
  compact: { "--spacing-card": "0.75rem", "--spacing-input": "0.375rem" },
  normal:  { "--spacing-card": "1.25rem", "--spacing-input": "0.5rem" },
  spacious:{ "--spacing-card": "2rem",    "--spacing-input": "0.75rem" },
}

export function applyTheme(config: ThemeConfig) {
  const root = document.documentElement

  // Sidebar
  root.style.setProperty("--sidebar-background", config.primaryColor)
  root.style.setProperty("--sidebar-border", lightenHex(config.primaryColor, 15))
  root.style.setProperty("--sidebar-accent", lightenHex(config.primaryColor, 20))
  root.style.setProperty("--sidebar-accent-foreground", config.accentColor)
  root.style.setProperty("--sidebar-foreground", config.sidebarTextColor ?? "#fdf2f5")
  root.style.setProperty("--sidebar-muted", lightenHex(config.primaryColor, 60))

  // Page background + text
  root.style.setProperty("--background", config.backgroundColor)
  root.style.setProperty("--foreground", config.textColor)
  root.style.setProperty("--card-foreground", config.textColor)
  root.style.setProperty("--popover-foreground", config.textColor)

  // Card background
  root.style.setProperty("--card", config.cardColor)
  root.style.setProperty("--popover", config.cardColor)

  // Muted text
  root.style.setProperty("--muted-foreground", lightenHex(config.textColor, 80))

  // Primary button / ring
  root.style.setProperty("--primary", config.buttonColor ?? config.primaryColor)
  root.style.setProperty("--ring", config.accentColor)
  root.style.setProperty("--accent", config.accentColor)

  // Border + hover surface
  root.style.setProperty("--border", darkenHex(config.backgroundColor, 15))
  root.style.setProperty("--input", darkenHex(config.backgroundColor, 15))
  root.style.setProperty("--hover-bg", darkenHex(config.backgroundColor, 20))
  root.style.setProperty("--muted", darkenHex(config.backgroundColor, 8))

  // Font family
  const font = FONT_VARS[config.fontFamily] ?? FONT_VARS.inter
  root.style.setProperty("--font-sans", font)
  root.style.fontFamily = font

  // Border radius
  const radius = RADIUS_VARS[config.borderRadius] ?? RADIUS_VARS.lg
  root.style.setProperty("--radius", radius)

  // Density
  const density = DENSITY_VARS[config.density] ?? DENSITY_VARS.normal
  for (const [k, v] of Object.entries(density)) {
    root.style.setProperty(k, v)
  }
}

export function saveTheme(config: ThemeConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  applyTheme(config)
}

export function loadTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_THEME
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").slice(0, 6)
  const n = parseInt(clean, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("")
}

function lightenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + amount, g + amount, b + amount)
}

function darkenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r - amount, g - amount, b - amount)
}
