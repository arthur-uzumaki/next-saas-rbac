import { Member, Organization } from '@prisma/client'
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
    getUserMembership: (slug: string) => Promise<{
      organization: Organization
      membership: Member
    }>
  }
}
