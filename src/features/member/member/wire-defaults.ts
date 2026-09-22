import { vMemberRequest } from '@/api/valibot.gen'
import { formDefaults } from '@/models/schema'

export function memberFieldDefaults(): Record<string, unknown> {
  return formDefaults(vMemberRequest, {is_public: true})
}

export function memberShape(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {...memberFieldDefaults(), ...overrides}
}
