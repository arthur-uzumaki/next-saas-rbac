import { prisma } from '../../../lib/prisma.ts'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { hash } from 'argon2'
import { BadRequestError } from '../_errors/bad-request.error.ts'

export const createAccountRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'create new account',
        body: z.object({
          name: z.string(),
          email: z.email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({}),
        
        },
      },
    },
    async (request, reply) => {
      const { email, name, password } = request.body

      const userWitchSameEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (userWitchSameEmail) {
        throw new BadRequestError('user with same e-mail already exists.')
      }

      const [, domain] = email.split('@')

      const autoJoinOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          shouldAttachUserByDomain: true,
        },
      })

      const hashedPassword = await hash(password, { hashLength: 6 })

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          member_on: autoJoinOrganization
            ? {
                create: {
                  organizationId: autoJoinOrganization.id,
                },
              }
            : undefined,
        },
      })

      return reply.status(201).send()
    }
  )
}
