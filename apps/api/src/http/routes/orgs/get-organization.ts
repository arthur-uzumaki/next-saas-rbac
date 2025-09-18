import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'

export const getOrganizationRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:slug',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Get details from organization ',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            organization: z.object({
              id: z.cuid(),
              name: z.string(),
              slug: z.string(),
              domain: z.string().nullable(),
              shouldAttachUserByDomain: z.boolean(),
              avatarUrl: z.url().nullable(),
              ownerId: z.cuid(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)

      return reply.status(200).send({ organization })
    }
  )
}
