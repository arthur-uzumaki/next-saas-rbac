import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { projectSchema } from '@saas/auth'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'

export const deleteProjectRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).delete(
    '/organizations/:slug/projects/:projectId',
    {
      schema: {
        tags: ['projects'],
        summary: 'Delete a  Project',
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          projectId: z.cuid(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { projectId, slug } = request.params
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({ userId, role: membership.role })

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
        ownerId: project?.ownerId,
      })

      if (cannot('delete', authProject)) {
        throw new UnauthorizedError(`You're not allowed delete this project.`)
      }

      await prisma.project.delete({
        where: {
          id: projectId,
        },
      })
      return reply.status(204).send()
    }
  )
}
