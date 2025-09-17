import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { createSlug } from '../../../utils/create-slug.ts'

export const createOrganizationRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).post(
    '/organizations',
    {
      schema: {
        tags: ['organizations'],
        summary: 'Create new organization',
        security: [{ bearerAuth: [] }],
        body: z.object({
          name: z.string(),
          domain: z.string().nullish(),
          shouldAttachUsersByDomain: z.boolean().optional(),
        }),
        response: {
          201: z.object({
            organizationId: z.cuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { name, domain, shouldAttachUsersByDomain } = request.body

      if (domain) {
        const organizationByDomain = await prisma.organization.findUnique({
          where: { domain },
        })

        if (organizationByDomain) {
          throw new BadRequestError(
            'Another organization with same domain already exists.'
          )
        }
      }

      const organization = await prisma.organization.create({
        data: {
          name,
          slug: createSlug(name),
          domain,
          shouldAttachUserByDomain: shouldAttachUsersByDomain,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'ADMIN',
            },
          },
        },
      })

      return reply.status(201).send({ organizationId: organization.id })
    }
  )
}
