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

async function main() {
  console.log("Seeding categories...")
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

  console.log("Done!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
