"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Item {
  id: string
  name: string
  _count?: { products: number }
  children?: Item[]
}

interface LookupManagerProps {
  title: string
  items: Item[]
  onCreate: (name: string, parentId?: string) => Promise<{ data?: unknown; error?: string }>
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>
  withSubcategories?: boolean
}

export function LookupManager({ title, items, onCreate, onDelete, withSubcategories }: LookupManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setError("")
    const result = await onCreate(name.trim(), parentId ?? undefined)
    if ("error" in result && result.error) {
      setError(result.error as string)
      return
    }
    setName("")
    setParentId(null)
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await onDelete(id)
    if ("error" in result && result.error) {
      setError(result.error as string)
    } else {
      startTransition(() => router.refresh())
    }
    setDeletingId(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de criação */}
        <div className="flex gap-2">
          {withSubcategories && items.length > 0 && (
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-40 shrink-0"
            >
              <option value="">Categoria pai</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={withSubcategories && parentId ? "Nome da subcategoria..." : `Nova ${title.toLowerCase().slice(0, -1)}...`}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!name.trim() || pending} size="icon" className="shrink-0">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Lista de itens */}
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum item cadastrado</p>
          )}
          {items.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.name}</span>
                  {item._count && item._count.products > 0 && (
                    <Badge variant="secondary" className="text-xs py-0">{item._count.products}</Badge>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  {deletingId === item.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>

              {/* Subcategorias */}
              {item.children && item.children.length > 0 && (
                <div className="ml-4 border-l border-border pl-3 space-y-1 mb-1">
                  {item.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 group">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{child.name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(child.id)}
                        disabled={deletingId === child.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === child.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
