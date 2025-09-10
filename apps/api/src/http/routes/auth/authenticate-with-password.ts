import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '../../../lib/prisma.ts'
import z from 'zod'
import { verify } from 'argon2'

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
          400: z.object({
            message: z.string(),
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
        return reply.status(400).send({ message: 'Invalid credentials' })
      }

      if (userFromEmail.passwordHash === null) {
        return reply
          .status(400)
          .send({ message: 'User does not have a password, use social login' })
      }

      const isPasswordValid = await verify(userFromEmail.passwordHash, password)

      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'Invalid credentials' })
      }

      const token = await reply.jwtSign(
        { sub: userFromEmail.id },
        { sign: { expiresIn: '7d' } }
      )

      return reply.status(201).send({ token })
    }
  )
}
