import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { roleSchema } from '@saas/auth'

export const getPendingInvitesRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/pending-invites',
    {
      schema: {
        tags: ['invites'],
        summary: 'Get all user pending invites',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            invites: z.array(
              z.object({
                id: z.cuid(),
                email: z.email(),
                role: roleSchema,
                createdAt: z.date(),
                organization: z.object({
                  name: z.string(),
                }),
                author: z
                  .object({
                    id: z.cuid(),
                    name: z.string().nullable(),
                    avatarUrl: z.url().nullable(),
                  })
                  .nullable(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })

      if (!user) {
        throw new BadRequestError('User not found.')
      }

      const invites = await prisma.invite.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
        where: {
          email: user.email,
        },
      })

      return reply.status(200).send({ invites })
    }
  )
}
