import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  JWT_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)
