import { defineAbilityFor, userSchema, type Role } from '@saas/auth'

interface GetUserPermissionProps {
  userId: string
  role: Role
}

export function getUserPermission({ userId, role }: GetUserPermissionProps) {
  const authUser = userSchema.parse({
    id: userId,
    role: role,
  })

  const ability = defineAbilityFor(authUser)

  return ability
}
