import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const removeMemberRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).delete(
    '/organizations/:slug/members/:memberId',
    {
      schema: {
        tags: ['members'],
        summary: 'Remover a member from the organization',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          memberId: z.cuid(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { memberId, slug } = request.params
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('delete', 'User')) {
        throw new UnauthorizedError(
          `You're not allowed to remover this member from the organization.`
        )
      }

      await prisma.member.delete({
        where: {
          id: memberId,
          organizationId: organization.id,
        },
      })

      return reply.status(204).send()
    }
  )
}
