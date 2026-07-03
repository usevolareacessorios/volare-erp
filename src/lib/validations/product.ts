import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  categoryId: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  plating: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  stone: z.string().optional().nullable(),
  weightGrams: z.coerce.number().optional().nullable(),
  lengthCm: z.coerce.number().optional().nullable(),
  size: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isFeatured: z.boolean().default(false),
  isExclusive: z.boolean().default(false),
  // Custos
  costPrice: z.coerce.number().min(0).default(0),
  freightCost: z.coerce.number().min(0).default(0),
  taxCost: z.coerce.number().min(0).default(0),
  commission: z.coerce.number().min(0).default(0),
  packaging: z.coerce.number().min(0).default(0),
  otherCosts: z.coerce.number().min(0).default(0),
  // Preços
  salePrice: z.coerce.number().min(0).default(0),
  promoPrice: z.coerce.number().optional().nullable(),
  wholesalePrice: z.coerce.number().optional().nullable(),
  marketplacePrice: z.coerce.number().optional().nullable(),
  resellerPrice: z.coerce.number().optional().nullable(),
  // Estoque
  currentStock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  location: z.string().optional().nullable(),
  // Vídeo
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  // Preço VIP
  vipPrice: z.coerce.number().optional().nullable(),
  // Garantia
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional().nullable(),
  warrantyType: z.enum(["manufacturer", "store", "none"]).optional().nullable(),
  warrantyConditions: z.string().optional().nullable(),
})

export type ProductFormData = z.infer<typeof productSchema>
