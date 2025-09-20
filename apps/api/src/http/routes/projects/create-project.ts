import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { prisma } from '../../../lib/prisma.ts'
import { createSlug } from '../../../utils/create-slug.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'

export const createProjectRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).post(
    '/organizations/:slug/projects',
    {
      schema: {
        tags: ['projects'],
        summary: 'Create a new  Project',
        security: [{ bearerAuth: [] }],
        body: z.object({
          name: z.string(),
          description: z.string(),
        }),
        params: z.object({
          slug: z.string(),
        }),
        response: {
          201: z.object({
            projectId: z.cuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { slug } = request.params
      const { description, name } = request.body
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({ userId, role: membership.role })

      if (cannot('create', 'Project')) {
        throw new UnauthorizedError(
          `You're not allowed to create new projects.`
        )
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          slug: createSlug(name),
          organizationId: organization.id,
          ownerId: userId,
        },
      })

      return reply.status(201).send({ projectId: project.id })
    }
  )
}
