import z from 'zod'
import { roleSchema } from '../roles.ts'

export const userSchema = z.object({
  id: z.string(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>

