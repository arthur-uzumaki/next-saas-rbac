import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../routes/_errors/unauthorized-error.ts'
import fastifyPlugin from 'fastify-plugin'

export const auth: FastifyPluginAsyncZod = fastifyPlugin(async (app) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid auth token')
      }
    }
  })
})
