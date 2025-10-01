import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { organizationSchema } from '@saas/auth'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const transferOrganizationRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).patch(
    '/organizations/:slug/owner',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Transfer organization ownership',
        body: z.object({
          transferToUserId: z.cuid(),
        }),
        params: z.object({
          slug: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { slug } = request.params
      const { transferToUserId } = request.body
      const { organization, membership } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse({
        id: organization.id,
        ownerId: organization.ownerId,
      })

      const { cannot } = getUserPermission({ userId, role: membership.role })

      if (cannot('transfer_ownership', authOrganization)) {
        throw new BadRequestError(
          `You're not allowed to transfer this organization`
        )
      }

      const transferMembership = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: transferToUserId,
          },
        },
      })

      if (!transferMembership) {
        throw new BadRequestError('Target use is not a member organization.')
      }

      await prisma.$transaction([
        prisma.member.update({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: transferToUserId,
            },
          },
          data: {
            role: 'ADMIN',
          },
        }),

        prisma.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            ownerId: transferToUserId,
          },
        }),
      ])

      return reply.status(204).send()
    }
  )
}
