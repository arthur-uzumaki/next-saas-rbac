import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './routes/_errors/bad-request.error.ts'
import { UnauthorizedError } from './routes/_errors/unauthorized-error.ts'

type FastifyErroHandle = FastifyInstance['errorHandler']

export const errorHandler: FastifyErroHandle = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  console.error(error)

  // send error to some observability

  return reply.status(500).send({
    message: 'Internal server error',
  })
}
