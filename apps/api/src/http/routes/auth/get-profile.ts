import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { auth } from '../../middlewares/auth.ts'

export const getProfileRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/profile',
    {
      schema: {
        tags: ['auth'],
        summary: 'Get authenticated user profile',
        response: {
          200: z.object({
            user: z.object({
              id: z.cuid(),
              name: z.string().nullable(),
              email: z.string(),
              avatarUrl: z.url().nullable(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        where: {
          id: userId,
        },
      })

      if (!user) {
        throw new BadRequestError('User not found.')
      }

      return reply.status(200).send({ user })
    }
  )
}
