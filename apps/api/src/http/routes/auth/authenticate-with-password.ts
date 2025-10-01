import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '../../../lib/prisma.ts'
import z from 'zod'
import { verify } from 'argon2'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { generateToken } from '../../../utils/generate-token.ts'

export const authenticateWithPasswordRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with email and password',
        body: z.object({
          email: z.email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.jwt(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        throw new BadRequestError('Invalid credentials')
      }

      if (userFromEmail.passwordHash === null) {
        throw new BadRequestError(
          'User does not have a password, use social login'
        )
      }

      const isPasswordValid = await verify(userFromEmail.passwordHash, password)

      if (!isPasswordValid) {
        throw new BadRequestError('Invalid credentials')
      }

      const token = await generateToken({
        reply,
        userId: userFromEmail.id,
      })

      return reply.status(201).send({ token })
    }
  )
}
