import fastify from 'fastify'
import {
 type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { fastifyCors } from '@fastify/cors'

import { createAccountRoute } from './routes/auth/create-account.ts'

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
app

app.register(fastifyCors)

app.register(createAccountRoute)

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP Server running!')
})
