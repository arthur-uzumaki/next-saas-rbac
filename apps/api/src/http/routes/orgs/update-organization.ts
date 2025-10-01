import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { organizationSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'

export const updateOrganizationRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).put(
    '/organizations/:slug',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Update organization details',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
        }),
        body: z.object({
          name: z.string(),
          domain: z.string().nullish(),
          shouldAttachUsersByDomain: z.boolean().optional(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { slug } = request.params
      const { name, domain, shouldAttachUsersByDomain } = request.body
      const { membership, organization } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse({
        id: organization.id,
        ownerId: organization.ownerId,
      })

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('update', authOrganization)) {
        throw new UnauthorizedError(
          `You're not allowed to update this organization.`
        )
      }

      if (domain) {
        const organizationByDomain = await prisma.organization.findFirst({
          where: { domain, id: { not: organization.id } },
        })

        if (organizationByDomain) {
          throw new BadRequestError(
            'Another organization with same domain already exists.'
          )
        }
      }

      await prisma.organization.update({
        where: {
          id: organization.id,
        },
        data: {
          name,
          domain,
          shouldAttachUserByDomain: shouldAttachUsersByDomain,
        },
      })

      return reply.status(204).send()
    }
  )
}
