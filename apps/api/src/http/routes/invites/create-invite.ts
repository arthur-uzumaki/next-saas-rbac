import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth.ts'
import { roleSchema } from '@saas/auth'
import { getUserPermission } from '../../../utils/get-user-permission.ts'
import { UnauthorizedError } from '../_errors/unauthorized-error.ts'
import { BadRequestError } from '../_errors/bad-request.error.ts'
import { prisma } from '../../../lib/prisma.ts'

export const createInviteRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).post(
    '/organizations/:slug/invites',
    {
      schema: {
        tags: ['invites'],
        summary: 'Create a new invite',
        security: [{ bearerAuth: [] }],
        body: z.object({
          email: z.email(),
          role: roleSchema,
        }),
        params: z.object({
          slug: z.string(),
        }),
        response: {
          201: z.object({
            inviteId: z.cuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { slug } = request.params
      const { email, role } = request.body
      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermission({
        userId,
        role: membership.role,
      })

      if (cannot('create', 'Invite')) {
        throw new UnauthorizedError(`You're not allowed to create new Invite`)
      }

      const [_, domain] = email

      if (
        organization.shouldAttachUserByDomain &&
        organization.domain === domain
      ) {
        throw new BadRequestError(
          `Users with ${domain} domain will join your organization automatically on login. `
        )
      }

      const inviteWithSameEmail = await prisma.invite.findUnique({
        where: {
          email_organizationId: {
            email,
            organizationId: organization.id,
          },
        },
      })

      if (inviteWithSameEmail) {
        throw new BadRequestError(
          'Another invite with same e-mail already exists.'
        )
      }

      const memberWithSameEmail = await prisma.member.findFirst({
        where: {
          organizationId: organization.id,
          user: {
            email,
          },
        },
      })

      if (memberWithSameEmail) {
        throw new BadRequestError(
          'A member with this e-mail belongs your organization.'
        )
      }

      const invite = await prisma.invite.create({
        data: {
          organizationId: organization.id,
          email,
          role,
          authorId: userId,
        },
      })

      return reply.status(201).send({ inviteId: invite.id })
    }
  )
}
