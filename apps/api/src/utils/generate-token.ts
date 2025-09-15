import type { FastifyReply } from 'fastify'

interface GenerateTokenParams {
  reply: FastifyReply
  userId: string
}

export async function generateToken({ reply, userId }: GenerateTokenParams) {
  return await await reply.jwtSign(
    { sub: userId },
    { sign: { expiresIn: '7d' } }
  )
}
