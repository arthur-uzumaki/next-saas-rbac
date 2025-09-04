import z from 'zod'
import {organizationSchema  } from '../models/organization.ts'

export const organizationSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('transfer_ownership'),
  ]),
  z.union([z.literal('Organization'), organizationSchema])
])

export type OrganizationSubject = z.infer<typeof organizationSubject>
