import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'
import { roleSchema } from '@saas/auth'

export const getInvitesRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:slug/invites',
    {
      schema: {
        tags: ['invites'],
        summary: 'Get all organization invite',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            invites: z
              .object({
                id: z.cuid(),
                email: z.email(),
                role: roleSchema,
                createdAt: z.date(),
                author: z
                  .object({
                    id: z.cuid(),
                    name: z.string().nullable(),
                  })
                  .nullable(),
              })
              .array(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { slug } = request.params
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('get', 'Invite')) {
        throw new UnauthorizedError(
          `You're not allowed to get organization  invite.`
        )
      }

      const invites = await prisma.invite.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        where: {
          organizationId: organization.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return reply.status(200).send({ invites })
    }
  )
}
