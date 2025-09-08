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
import { env } from '../env/env.ts'

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

if (env.NODE_ENV === 'development') {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Next.js SaaS RBAC API',
        version: '1.0.0',
        description: 'Full-stack Saas app with multi-tenant & RBAC',
      },
    },
    transform: jsonSchemaTransform,
  })
}

app.register(scalar, {
  routePrefix: '/docs',
})

app.register(fastifyCors)

app.register(createAccountRoute)

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP Server running!')
})
