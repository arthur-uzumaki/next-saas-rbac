import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'

export const revokeInviteRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).post(
    '/organizations/:slug/invites/:inviteId',
    {
      schema: {
        tags: ['invites'],
        summary: 'Revoke an  invite',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          inviteId: z.cuid(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { inviteId, slug } = request.params
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('delete', 'Invite')) {
        throw new UnauthorizedError(`You're not allowed to revoke an invite.`)
      }

      const invite = await prisma.invite.findUnique({
        where: {
          id: inviteId,
          organizationId: organization.id
        },
      })

      if (!invite) {
        throw new BadRequestError('Inite not found.')
      }

      await prisma.invite.delete({
        where: {
          id: inviteId,

        },
      })

      return reply.status(204).send()
    }
  )
}
