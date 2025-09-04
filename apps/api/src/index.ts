import { defineAbilityFor, projectSchema } from '@saas/auth'

const ability = defineAbilityFor({ role: 'MEMBER', id: 'user-1' })

const project = projectSchema.parse({ id: 'project-1', ownerId: 'user-1' })

console.log(ability.can('delete', project))
