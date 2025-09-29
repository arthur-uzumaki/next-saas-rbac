import fastify from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { fastifyCors } from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'

import { createAccountRoute } from './routes/auth/create-account.ts'
import { env } from '@saas/env'
import { authenticateWithPasswordRoute } from './routes/auth/authenticate-with-password.ts'
import fastifyJwt from '@fastify/jwt'
import { getProfileRoute } from './routes/auth/get-profile.ts'
import { errorHandler } from './error-handler.ts'
import { requestPasswordRecoverRoute } from './routes/auth/request-password-recover.ts'
import { resetPasswordRoute } from './routes/auth/reset-password.ts'
import { authenticateWithGithubRoute } from './routes/auth/authenticate-with-github.ts'
import { createOrganizationRoute } from './routes/orgs/create-organization.ts'
import { getMembershipRoute } from './routes/orgs/get-membership.ts'
import { getOrganizationRoute } from './routes/orgs/get-organization.ts'
import { getOrganizationsRoute } from './routes/orgs/get-organizations.ts'
import { updateOrganizationRoute } from './routes/orgs/update-organization.ts'
import { shutdownOrganizationRoute } from './routes/orgs/shutdown-organization.ts'
import { transferOrganizationRoute } from './routes/orgs/transfer-organization.ts'
import { createProjectRoute } from './routes/projects/create-project.ts'
import { deleteProjectRoute } from './routes/projects/delete-project.ts'
import { getProjectRoute } from './routes/projects/get-project.ts'
import { getProjectsRoute } from './routes/projects/get-projects.ts'
import { updateProjectRoute } from './routes/projects/update-project.ts'
import { getMembersRoute } from './routes/members/get-members.ts'
import { updateMemberRoute } from './routes/members/update-member.ts'
import { removeMemberRoute } from './routes/members/remove-member.ts'
import { createInviteRoute } from './routes/invites/create-invite.ts'
import { getInviteRoute } from './routes/invites/get-invite.ts'
import { getInvitesRoute } from './routes/invites/get-invites.ts'
import { acceptInviteRoute } from './routes/invites/accept-invite.ts'
import { rejectInviteRoute } from './routes/invites/reject-invite.ts'
import { revokeInviteRoute } from './routes/invites/revoke-invite.ts'

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

if (env.NODE_ENV === 'development') {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Next.js SaaS RBAC API',
        version: '1.0.0',
        description: 'Full-stack Saas app with multi-tenant & RBAC',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })
}

app.register(scalar, {
  routePrefix: '/docs',
})

app.register(fastifyCors)
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(createAccountRoute)
app.register(authenticateWithPasswordRoute)
app.register(authenticateWithGithubRoute)
app.register(getProfileRoute)
app.register(requestPasswordRecoverRoute)
app.register(resetPasswordRoute)

app.register(createOrganizationRoute)
app.register(getMembershipRoute)
app.register(getOrganizationRoute)
app.register(getOrganizationsRoute)
app.register(updateOrganizationRoute)
app.register(shutdownOrganizationRoute)
app.register(transferOrganizationRoute)

app.register(createProjectRoute)
app.register(deleteProjectRoute)
app.register(getProjectRoute)
app.register(getProjectsRoute)
app.register(updateProjectRoute)

app.register(getMembersRoute)
app.register(updateMemberRoute)
app.register(removeMemberRoute)

app.register(createInviteRoute)
app.register(getInviteRoute)
app.register(getInvitesRoute)
app.register(acceptInviteRoute)
app.register(rejectInviteRoute)
app.register(revokeInviteRoute)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP Server running!')
})
