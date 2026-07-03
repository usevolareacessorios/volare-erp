import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente especializado em leitura de notas fiscais de semijoias e acessórios.
Analise a imagem ou PDF da nota fiscal e extraia TODOS os produtos listados.
Retorne APENAS um JSON válido com o seguinte formato, sem texto adicional:

{
  "supplier": "Nome do fornecedor (se visível)",
  "invoiceNumber": "Número da nota (se visível)",
  "invoiceDate": "Data no formato YYYY-MM-DD (se visível)",
  "products": [
    {
      "name": "Nome completo do produto",
      "description": "Descrição adicional se houver",
      "quantity": 1,
      "unitCost": 0.00,
      "totalCost": 0.00,
      "unit": "UN",
      "material": "Material identificado (Aço Inoxidável, Prata 925, Banhado a Ouro, etc) ou null",
      "categoryHint": "Categoria sugerida (Anel, Colar, Brinco, Pulseira, Broche, Pingente, etc) ou null",
      "ncm": "Código NCM se visível ou null",
      "referenceCode": "Código de referência do produto se visível ou null"
    }
  ]
}

Regras:
- Extraia TODOS os itens da nota, sem exceção
- Para preços, use ponto como separador decimal (ex: 29.90)
- Se não encontrar um campo, use null
- O campo "name" é obrigatório
- Infira o material a partir do nome do produto quando possível (ex: "Anel de prata" → "Prata 925")
- Infira a categoria a partir do nome (ex: "Colar feminino dourado" → "Colar")`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada no servidor." }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf"

    const isPdf = mimeType === "application/pdf"

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: isPdf
            ? [
                {
                  type: "document" as const,
                  source: { type: "base64" as const, media_type: "application/pdf", data: base64 },
                },
                { type: "text" as const, text: "Extraia todos os produtos desta nota fiscal." },
              ]
            : [
                {
                  type: "image" as const,
                  source: { type: "base64" as const, media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 },
                },
                { type: "text" as const, text: "Extraia todos os produtos desta nota fiscal." },
              ],
        },
      ],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : ""

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText]
    const jsonStr = jsonMatch[1]?.trim() ?? rawText.trim()

    const result = JSON.parse(jsonStr)
    return NextResponse.json(result)
  } catch (err) {
    console.error("analyze-invoice error:", err)
    const message = err instanceof Error ? err.message : "Erro ao analisar a nota."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
