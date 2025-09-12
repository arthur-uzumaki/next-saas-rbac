import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'

export const getProfileRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
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
      const { sub } = await request.jwtVerify<{ sub: string }>()

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        where: {
          id: sub,
        },
      })

      if (!user) {
        throw new BadRequestError('User not found.')
      }

      return reply.status(200).send({ user })
    }
  )
}
