import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'

export const getProjectRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:orgSlug/projects/:projectSlug',
    {
      schema: {
        tags: ['projects'],
        summary: 'Get a project details',
        security: [{ bearerAuth: [] }],
        params: z.object({
          orgSlug: z.string(),
          projectSlug: z.string(),
        }),
        response: {
          200: z.object({
            project: z.object({
              id: z.cuid(),
              name: z.string(),
              slug: z.string(),
              avatarUrl: z.string().nullable(),
              ownerId: z.cuid(),
              organizationId: z.cuid(),
              description: z.string(),
              owner: z.object({
                id: z.cuid(),
                name: z.string().nullable(),
                avatarUrl: z.string().nullable(),
              }),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { orgSlug, projectSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(orgSlug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('get', 'Project')) {
        throw new UnauthorizedError(`You're not allowed to see this project.`)
      }

      const project = await prisma.project.findUnique({
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          ownerId: true,
          avatarUrl: true,
          organizationId: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        where: {
          slug: projectSlug,
          organizationId: organization.id,
        },
      })

      if (!project) {
        throw new BadRequestError('Project not found.')
      }

      return reply.status(200).send({ project })
    }
  )
}
