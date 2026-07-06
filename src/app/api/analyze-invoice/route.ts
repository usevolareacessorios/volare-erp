import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente especializado em leitura de notas fiscais brasileiras (NF-e, DANFE, faturas) de semijoias e acessórios.
Seu objetivo é calcular o CUSTO REAL de cada produto, distribuindo todos os encargos da nota proporcionalmente.
Retorne APENAS JSON válido, sem markdown, sem texto adicional.

PASSO 1 — Leia o cabeçalho da nota e extraia os totais:
- totalProdutos: soma dos valores brutos dos itens (antes de qualquer acréscimo/desconto)
- totalFreight: valor do frete (campo "Frete/Carreto" ou "Transporte")
- totalDiscount: desconto total da nota (campo "Desconto")
- totalIpi: IPI total
- totalIcmsSt: ICMS Substituição Tributária total
- totalPisCofins: PIS+COFINS total (se discriminado)
- totalNota: valor total a pagar da nota

PASSO 2 — Para CADA item, calcule:
a) unitCost = preço unitário bruto do item (sem nenhum encargo)
b) totalCost = unitCost × quantity
c) proporcao = totalCost / totalProdutos  (participação % deste item no total)
d) discount = desconto proporcional = totalDiscount × proporcao / quantity  (por unidade)
e) ipi = IPI proporcional = totalIpi × proporcao / quantity
f) icmsSt = ICMS-ST proporcional = totalIcmsSt × proporcao / quantity
g) freightRateio = frete proporcional = totalFreight × proporcao / quantity
h) finalUnitCost = unitCost - discount + ipi + icmsSt + freightRateio
   (este é o custo real por unidade, considerando todos os encargos)

IMPORTANTE: Se algum encargo já estiver discriminado por item na nota, use o valor do item. Só faça rateio proporcional quando o encargo estiver apenas no total da nota.

Formato de resposta:
{
  "supplier": "Nome do fornecedor/emitente",
  "invoiceNumber": "Número da nota",
  "invoiceDate": "YYYY-MM-DD",
  "totalValue": 0.00,
  "totalFreight": 0.00,
  "totalDiscount": 0.00,
  "totalIpi": 0.00,
  "totalIcmsSt": 0.00,
  "totalPisCofins": 0.00,
  "paymentTerms": "ex: 30/60 dias ou null",
  "products": [
    {
      "name": "Nome completo do produto",
      "description": null,
      "quantity": 1,
      "unitCost": 0.00,
      "totalCost": 0.00,
      "discount": 0.00,
      "ipi": 0.00,
      "icmsSt": 0.00,
      "freightRateio": 0.00,
      "finalUnitCost": 0.00,
      "unit": "UN",
      "material": "Aço Inoxidável | Prata 925 | Banhado a Ouro | Banhado a Prata | Latão | Zamac | null",
      "categoryHint": "Anel | Brinco | Colar | Pulseira | Pingente | Broche | null",
      "ncm": "00000000 ou null",
      "referenceCode": "código do fornecedor ou null"
    }
  ]
}

Regras finais:
- Use ponto decimal (29.90), nunca vírgula
- Campos numéricos não encontrados: 0. Textos não encontrados: null
- Extraia TODOS os itens sem exceção
- Verifique: soma de todos os finalUnitCost × quantity deve ser próxima ao totalNota
- Material: infira do nome ("prata"→"Prata 925", "dourado/ouro"→"Banhado a Ouro", "aço"→"Aço Inoxidável")
- Categoria: infira do nome ("anel"→"Anel", "colar/corrente/gargantilha"→"Colar", "brinco/ear"→"Brinco", "pulseira/bracelete/tornozeleira"→"Pulseira", "pingente/charm"→"Pingente")`

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
