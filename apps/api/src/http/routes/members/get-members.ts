import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z, { email } from 'zod'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'
import { roleSchema } from '@saas/auth'
import { auth } from '../../middlewares/auth.ts'

export const getMembersRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:slug/members',
    {
      schema: {
        tags: ['members'],
        summary: 'Get all organizations  members',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            members: z.array(
              z.object({
                id: z.cuid(),
                userId: z.cuid(),
                name: z.string().nullable(),
                email: z.email(),
                avatarUrl: z.string().nullable(),
                role: roleSchema,
              })
            ),
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

      if (cannot('get', 'User')) {
        throw new UnauthorizedError(
          `You're not allowed to see organization members.`
        )
      }

      const members = await prisma.member.findMany({
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        where: {
          organizationId: organization.id,
        },
        orderBy: {
          role: 'asc',
        },
      })

      const memberWithRoles = members.map(
        ({ user: { id: userId, ...user }, ...member }) => {
          return {
            ...member,
            ...user,
            userId,
          }
        }
      )

      return reply.status(200).send({ members: memberWithRoles })
    }
  )
}
