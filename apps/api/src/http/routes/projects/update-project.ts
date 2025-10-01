import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { projectSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'

export const updateProjectRoute: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/organizations/:orgSlug/projects/:projectId',
    {
      schema: {
        tags: ['projects'],
        summary: 'Update a project',
        body: z.object({
          name: z.string(),
          description: z.string(),
        }),
        params: z.object({
          orgSlug: z.string(),
          projectId: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { description, name } = request.body
      const { orgSlug, projectId } = request.params
      const { membership, organization } =
        await request.getUserMembership(orgSlug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
          organizationId: organization.id,
        },
      })

      if (!project) {
        throw new BadRequestError('Project not found.')
      }

      const authProject = projectSchema.parse({
        id: project.id,
        ownerId: project.ownerId,
      })

      if (cannot('update', authProject)) {
        throw new UnauthorizedError(`You're not allowed update this project.`)
      }

      await prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          name,
          description,
        },
      })

      return reply.status(204).send()
    }
  )
}
