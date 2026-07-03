import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  cnpj: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  avgLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export type SupplierFormData = z.infer<typeof supplierSchema>
