"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteProductImage, setPrimaryImage } from "@/lib/actions/product-images"
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

type ProductImage = { id: string; url: string; isPrimary: boolean; order: number }

interface Props {
  productId: string
  initialImages?: ProductImage[]
}

export function ProductImageUploader({ productId, initialImages = [] }: Props) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError("")
    setUploading(true)

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Apenas imagens são permitidas.")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Imagem deve ter no máximo 5 MB.")
        continue
      }

      const form = new FormData()
      form.append("file", file)
      form.append("productId", productId)

      const res = await fetch("/api/upload-product-image", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao fazer upload.")
      } else {
        setImages((prev) => [...prev, { id: data.id, url: data.url, isPrimary: data.isPrimary, order: prev.length }])
      }
    }

    setUploading(false)
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteProductImage(imageId, productId)
      setImages((prev) => {
        const remaining = prev.filter((i) => i.id !== imageId)
        if (prev.find((i) => i.id === imageId)?.isPrimary && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isPrimary: true }
        }
        return remaining
      })
    })
  }

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      await setPrimaryImage(imageId, productId)
      setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === imageId })))
    })
  }

  const isDragging = useRef(false)

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Fotos do produto</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-[var(--hover-bg)] transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); isDragging.current = true }}
          onDrop={(e) => {
            e.preventDefault()
            isDragging.current = false
            handleFiles(e.dataTransfer.files)
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="w-7 h-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arraste imagens aqui ou <span className="text-primary font-medium underline">clique para selecionar</span>
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — máx. 5 MB cada</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
                <Image
                  src={img.url}
                  alt="Foto do produto"
                  fill
                  className="object-cover"
                  sizes="150px"
                />

                {img.isPrimary && (
                  <div className="absolute top-1 left-1 bg-[var(--color-gold-500)] text-white rounded-full p-0.5">
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                )}

                {/* Hover actions */}
                <div className={cn(
                  "absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  pending && "opacity-100"
                )}>
                  {!img.isPrimary && (
                    <button
                      type="button"
                      title="Definir como principal"
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={pending}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remover"
                    onClick={() => handleDelete(img.id)}
                    disabled={pending}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-[var(--hover-bg)] transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-xs">Adicionar</span>
            </button>
          </div>
        )}

        {images.length > 0 && (
          <p className="text-xs text-muted-foreground">
            A foto com <Star className="w-3 h-3 inline text-[var(--color-gold-500)]" /> é a imagem principal exibida na lista.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
