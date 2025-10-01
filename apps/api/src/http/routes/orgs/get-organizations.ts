import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { prisma } from '../../../lib/prisma.ts'
import { roleSchema } from '@saas/auth'

export const getOrganizationsRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Get organizations where   user is member',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            organizations: z.array(
              z.object({
                id: z.cuid(),
                name: z.string(),
                slug: z.string(),
                role: roleSchema,
                avatarUrl: z.url().nullable(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()

      const organizations = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          avatarUrl: true,
          members: {
            select: {
              role: true,
            },
            where: {
              userId,
            },
          },
        },
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
      })

      const organizationWIthUserRole = organizations.map(
        ({ members, ...org }) => {
          return {
            ...org,
            role: members[0].role,
          }
        }
      )
      return reply.status(200).send({ organizations: organizationWIthUserRole })
    }
  )
}
