import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { roleSchema } from '@saas/auth'
import { auth } from '../../middlewares/auth.ts'

export const getMembershipRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:slug/membership',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Get user membership on organization',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            membership: z.object({
              id: z.cuid(),
              role: roleSchema,
              organizationId: z.cuid(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { membership } = await request.getUserMembership(slug)

      return reply.status(200).send({
        membership: {
          id: membership.id,
          role: membership.role,
          organizationId: membership.organizationId,
        },
      })
    }
  )
}
