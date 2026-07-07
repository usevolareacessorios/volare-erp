import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente especializado em leitura de notas fiscais e recibos de compra (NF-e, DANFE, Temu, Shopee, AliExpress, etc.).
Retorne APENAS JSON válido, sem markdown, sem texto adicional.

=== FÓRMULA DE CÁLCULO ===

Custo final de cada item = (valor bruto do item ÷ total bruto do pedido) × total pago

Exemplo com recibo Temu:
- Total bruto do pedido (soma de todos os itens antes de descontos): R$359,51
- Total pago (após descontos + ICMS + frete): R$295,39
- Pulseira: valor bruto = R$20,61 × 5 = R$103,05
  → custo final = (103,05 ÷ 359,51) × 295,39 = R$84,67
  → custo por peça = 84,67 ÷ 5 = R$16,93
- Acessórios (pacote 20 pçs × 2): valor bruto = R$33,53 × 2 = R$67,06
  → custo final = (67,06 ÷ 359,51) × 295,39 = R$55,10
  → custo por peça = 55,10 ÷ 40 = R$1,38

=== PASSO 1 — EXTRAIA DO CABEÇALHO ===
- totalProdutos: soma dos valores brutos de TODOS os itens (preço × quantidade, SEM descontos)
- totalNota: valor total efetivamente pago (após descontos, com ICMS e frete)
- totalFreight: frete (0 se grátis)
- totalDiscount: soma de todos os descontos
- totalIcmsSt: ICMS cobrado

=== PASSO 2 — DETECTE PACOTES ===
Leia o nome/variante do produto para detectar peças por pacote:
- "20 Peças de Acessórios" → piecesPerPackage = 20
- "9 peças, Moda Europeia" → piecesPerPackage = 9
- "Vermelho*20PCS" ou "*20PCS" na variante → piecesPerPackage = 20
- "1 Peça Pulseira" ou produto individual → piecesPerPackage = 1

=== PASSO 3 — CALCULE POR ITEM ===
Para cada item:
a) itemBruto = unitCost × quantity
b) finalItemCost = (itemBruto ÷ totalProdutos) × totalNota
c) totalPieces = quantity × piecesPerPackage
d) finalUnitCost = finalItemCost ÷ totalPieces   ← custo real por peça

Formato de resposta:
{
  "supplier": "Nome do fornecedor",
  "invoiceNumber": "ID do pedido ou número da nota",
  "invoiceDate": "YYYY-MM-DD",
  "totalValue": 295.39,
  "totalFreight": 0.00,
  "totalDiscount": 114.34,
  "totalIpi": 0.00,
  "totalIcmsSt": 50.22,
  "totalPisCofins": 0.00,
  "paymentTerms": null,
  "products": [
    {
      "name": "Nome do produto sem mencionar quantidade de peças",
      "description": null,
      "quantity": 2,
      "piecesPerPackage": 20,
      "totalPieces": 40,
      "unitCost": 33.53,
      "itemBruto": 67.06,
      "finalItemCost": 55.10,
      "finalUnitCost": 1.38,
      "unit": "UN",
      "material": "Aço Inoxidável | Prata 925 | Banhado a Ouro | Banhado a Prata | Latão | Zamac | null",
      "categoryHint": "Anel | Brinco | Colar | Pulseira | Pingente | Broche | null",
      "ncm": null,
      "referenceCode": null
    }
  ]
}

Regras:
- Use ponto decimal (29.90), nunca vírgula
- Campos numéricos não encontrados: 0. Textos não encontrados: null
- Extraia TODOS os itens sem exceção
- Verificação: soma de todos os finalItemCost deve ser igual ao totalNota
- Material: ("dourado/ouro"→"Banhado a Ouro", "prata"→"Prata 925", "aço"→"Aço Inoxidável", "cobre"→"Latão")
- Categoria: ("anel"→"Anel", "colar/corrente/gargantilha"→"Colar", "brinco/ear"→"Brinco", "pulseira/bracelete/tornozeleira"→"Pulseira", "pingente/charm"→"Pingente")`

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
                { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf", data: base64 } },
                { type: "text" as const, text: "Extraia todos os produtos deste comprovante/nota fiscal, detectando pacotes com múltiplas peças e calculando o custo por peça." },
              ]
            : [
                { type: "image" as const, source: { type: "base64" as const, media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 } },
                { type: "text" as const, text: "Extraia todos os produtos deste comprovante/nota fiscal, detectando pacotes com múltiplas peças e calculando o custo por peça." },
              ],
        },
      ],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : ""
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
