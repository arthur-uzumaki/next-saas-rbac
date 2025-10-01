import { roleSchema } from '@saas/auth'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const updateMemberRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).put(
    '/organizations/:slug/members/:memberId',
    {
      schema: {
        tags: ['members'],
        summary: 'Update a member',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          memberId: z.cuid(),
        }),
        body: z.object({
          role: roleSchema,
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
      const { role } = request.body

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('update', 'User')) {
        throw new UnauthorizedError(
          `You're not allowed to  update this  member.`
        )
      }

      await prisma.member.update({
        where: {
          id: memberId,
          organizationId: organization.id,
        },
        data: {
          role,
        },
      })
      return reply.status(204).send()
    }
  )
}
