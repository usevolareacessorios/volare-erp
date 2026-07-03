import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    const productId = form.get("productId") as string | null

    if (!file || !productId) {
      return NextResponse.json({ error: "Arquivo e productId obrigatórios" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem deve ter no máximo 5 MB" }, { status: 400 })
    }

    const supabase = await createClient()

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `products/${productId}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("volare-erp")
      .upload(filename, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      // Bucket might not exist yet — try creating it
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
        await supabase.storage.createBucket("volare-erp", { public: true })
        const { error: retryError } = await supabase.storage
          .from("volare-erp")
          .upload(filename, bytes, { contentType: file.type, upsert: false })
        if (retryError) throw retryError
      } else {
        throw uploadError
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from("volare-erp")
      .getPublicUrl(filename)

    // Count existing images to set order
    const count = await prisma.productImage.count({ where: { productId } })

    const image = await prisma.productImage.create({
      data: {
        productId,
        url: publicUrl,
        order: count,
        isPrimary: count === 0,
      },
    })

    return NextResponse.json({ id: image.id, url: image.url, isPrimary: image.isPrimary })
  } catch (err) {
    console.error("upload-product-image error:", err)
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 })
  }
}
