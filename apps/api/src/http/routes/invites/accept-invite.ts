import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'

export const acceptInviteRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).post(
    '/invites/:inviteId/accept',
    {
      schema: {
        tags: ['invites'],
        summary: 'Accept an invite ',
        security: [{ bearerAuth: [] }],
        params: z.object({
          inviteId: z.cuid(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { inviteId } = request.params

      const invite = await prisma.invite.findUnique({
        where: {
          id: inviteId,
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found.')
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })

      if (!user) {
        throw new BadRequestError('User not found.')
      }

      if (invite.email !== user.email) {
        throw new BadRequestError('This invite belongs to another user.')
      }

      await prisma.$transaction([
        prisma.member.create({
          data: {
            userId,
            organizationId: invite.organizationId,
            role: invite.role,
          },
        }),

        prisma.invite.delete({
          where: {
            id: inviteId,
          },
        }),
      ])

      return reply.status(204).send()
    }
  )
}
