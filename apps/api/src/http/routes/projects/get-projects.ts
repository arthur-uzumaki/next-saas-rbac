import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const getProjectsRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/organizations/:orgSlug/projects',
    {
      schema: {
        tags: ['projects'],
        summary: 'Get all organization projects',
        params: z.object({
          orgSlug: z.string(),
        }),
        response: {
          200: z.object({
            projects: z
              .object({
                id: z.cuid(),
                name: z.string(),
                slug: z.string(),
                avatarUrl: z.string().nullable(),
                ownerId: z.cuid(),
                createdAt: z.date(),
                organizationId: z.cuid(),
                owner: z.object({
                  id: z.cuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().nullable(),
                }),
              })
              .array(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { orgSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(orgSlug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('get', 'Project')) {
        throw new UnauthorizedError(
          `You're not allowed see organization projects.`
        )
      }

      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          avatarUrl: true,
          ownerId: true,
          organizationId: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        where: {
          organizationId: organization.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return reply.status(200).send({ projects })
    }
  )
}
