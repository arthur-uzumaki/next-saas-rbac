import {
  createMongoAbility,
  type CreateAbility,
  type MongoAbility,
  AbilityBuilder,
} from '@casl/ability'
import type { User } from './models/user.ts'
import { permissions } from './permissions.ts'
import { userSubject } from './subjects/user.ts'
import { projectSubject } from './subjects/project.ts'
import z from 'zod'
import { inviteSubject } from './subjects/invite.ts'
import { billingSubject } from './subjects/billing.ts'
import { organizationSubject } from './subjects/organization.ts'

export * from './models/organization.ts'
export * from './models/project.ts'
export * from './models/user.ts'

const appAbilitiesSchema = z.union([
  projectSubject,
  inviteSubject,
  billingSubject,
  organizationSubject,
  projectSubject,
  userSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])
type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permission for role ${user.role} not found.`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  return ability
}
