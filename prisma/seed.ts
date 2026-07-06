import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const categories = [
  {
    name: "Anéis",
    children: ["Anel Solitário", "Anel Aparador", "Anel Falange", "Anel Ajustável"],
  },
  {
    name: "Brincos",
    children: ["Argola", "Brinco Pino", "Ear Cuff", "Brinco Pendente", "Brinco Pressão"],
  },
  {
    name: "Colares",
    children: ["Colar Curto (choker)", "Colar Médio", "Colar Longo", "Gargantilha"],
  },
  {
    name: "Pulseiras",
    children: ["Pulseira Rígida", "Pulseira Flexível", "Pulseira Bracelete", "Tornozeleira"],
  },
  {
    name: "Pingentes",
    children: ["Pingente Letra", "Pingente Símbolo", "Pingente Religioso"],
  },
  {
    name: "Broches",
    children: [],
  },
  {
    name: "Conjuntos",
    children: ["Conjunto 2 peças", "Conjunto 3 peças"],
  },
]

const collections = [
  "Clássica",
  "Minimalista",
  "Boho",
  "Glamour",
  "Verão",
]

const financialCategories: { name: string; type: "EXPENSE" | "INCOME" }[] = [
  // Despesas fixas mensais
  { name: "Aluguel / Espaço",                        type: "EXPENSE" },
  { name: "Energia elétrica",                        type: "EXPENSE" },
  { name: "Internet / Telefone",                     type: "EXPENSE" },
  { name: "Contador / Escritório contábil",          type: "EXPENSE" },
  { name: "Salários / Pró-labore",                   type: "EXPENSE" },
  { name: "Sistema / Software / Assinaturas",        type: "EXPENSE" },
  { name: "Seguro",                                  type: "EXPENSE" },
  // Despesas variáveis operacionais
  { name: "Frete de compras (fornecedores)",         type: "EXPENSE" },
  { name: "Taxas de marketplace (Shopee, ML, etc)",  type: "EXPENSE" },
  { name: "Maquininha / Taxa de cartão",             type: "EXPENSE" },
  { name: "Marketing / Tráfego pago",                type: "EXPENSE" },
  { name: "Embalagens e materiais",                  type: "EXPENSE" },
  { name: "Devoluções / Reposições",                 type: "EXPENSE" },
  { name: "Transporte e entregas",                   type: "EXPENSE" },
  { name: "Outros custos operacionais",              type: "EXPENSE" },
  // Receitas
  { name: "Vendas loja física",                      type: "INCOME" },
  { name: "Vendas online / e-commerce",              type: "INCOME" },
  { name: "Vendas marketplace",                      type: "INCOME" },
  { name: "Vendas revendedoras",                     type: "INCOME" },
  { name: "Outras receitas",                         type: "INCOME" },
]

async function main() {
  console.log("Seeding product categories...")
  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    })
    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { name: child },
        update: {},
        create: { name: child, parentId: parent.id },
      })
    }
  }

  console.log("Seeding collections...")
  for (const name of collections) {
    await prisma.collection.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log("Seeding financial categories...")
  for (const cat of financialCategories) {
    const existing = await prisma.financialCategory.findFirst({
      where: { name: cat.name, type: cat.type },
    })
    if (!existing) {
      await prisma.financialCategory.create({ data: cat })
    }
  }

  console.log("Done!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
