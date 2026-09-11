import { vMemberRequest } from '@/api/valibot.gen'
import { formDefaults } from '@/models/schema'

export function memberFieldDefaults(): Record<string, any> {
  return formDefaults(vMemberRequest, {is_public: true})
}

export function memberShape(overrides: Record<string, any> = {}): Record<string, any> {
  return {...memberFieldDefaults(), ...overrides}
}
