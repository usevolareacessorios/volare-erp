import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente especializado em leitura de notas fiscais de semijoias e acessórios brasileiras (NF-e, NF, DANFE, faturas).
Analise a imagem ou PDF e extraia TODOS os dados: cabeçalho da nota E cada item individualmente.
Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicação.

Formato exato:
{
  "supplier": "Nome do fornecedor/emitente",
  "invoiceNumber": "Número da nota",
  "invoiceDate": "Data no formato YYYY-MM-DD",
  "totalValue": 0.00,
  "totalFreight": 0.00,
  "totalDiscount": 0.00,
  "totalIpi": 0.00,
  "totalIcmsSt": 0.00,
  "totalPisCofins": 0.00,
  "paymentTerms": "Condições de pagamento (ex: 30/60 dias, à vista) ou null",
  "products": [
    {
      "name": "Nome completo do produto",
      "description": "Descrição adicional se houver, senão null",
      "quantity": 1,
      "unitCost": 0.00,
      "totalCost": 0.00,
      "discount": 0.00,
      "ipi": 0.00,
      "icmsSt": 0.00,
      "freightRateio": 0.00,
      "finalUnitCost": 0.00,
      "unit": "UN",
      "material": "Material identificado ou null",
      "categoryHint": "Categoria sugerida (Anel, Colar, Brinco, Pulseira, Broche, Pingente, etc) ou null",
      "ncm": "Código NCM ou null",
      "referenceCode": "Código de referência/produto do fornecedor ou null"
    }
  ]
}

Regras obrigatórias:
- Extraia TODOS os itens da nota, sem exceção
- Use ponto como separador decimal (ex: 29.90), nunca vírgula
- Campos não encontrados: use 0 para números, null para textos
- "name" é obrigatório
- "finalUnitCost" = (unitCost - desconto unitário + IPI unitário + ICMS-ST unitário + frete rateado). Se não conseguir calcular, repita unitCost
- Se o frete total da nota não está discriminado por item, faça o rateio proporcional ao valor de cada item
- Se o desconto está em % na nota, converta para valor absoluto
- Infira o material do nome quando possível: "prata" → "Prata 925", "dourado/banhado ouro" → "Banhado a Ouro", "aço" → "Aço Inoxidável"
- Infira a categoria do nome: "anel" → "Anel", "colar/corrente" → "Colar", "brinco/ear" → "Brinco", "pulseira/bracelete" → "Pulseira", "pingente/charm" → "Pingente"`

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
