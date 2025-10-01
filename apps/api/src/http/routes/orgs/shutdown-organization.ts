import { organizationSchema } from '@saas/auth'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const shutdownOrganizationRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/organization/:slug',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Shutdown organization',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse({
        id: organization.id,
        ownerId: organization.ownerId,
      })

      const { cannot } = getUserPermission({ userId, role: membership.role })

      if (cannot('delete', authOrganization)) {
        new BadRequestError(`Yo're not allowed to shutdown  this organization.`)
      }

      await prisma.organization.delete({
        where: {
          id: organization.id,
        },
      })

      return reply.status(204).send()
    }
  )
}
