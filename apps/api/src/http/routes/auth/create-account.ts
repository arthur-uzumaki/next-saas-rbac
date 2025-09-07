import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const createAccountRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/users',
    {
      schema: {
        tags: ['create-account'],
        summary: '',
        body: z.object({
          name: z.string(),
          email: z.email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
     return 'Create Account'
    }
  )
}
