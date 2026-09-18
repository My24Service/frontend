import { AUTH_LEVELS } from '@/constants'
import { useAuthStore } from './store'

type AuthLevel = (typeof AUTH_LEVELS)[keyof typeof AUTH_LEVELS]

// The levels that sit above the operational roles and satisfy any array-form
// requirement, regardless of what the array lists.
const ELEVATED_LEVELS: readonly AuthLevel[] = [
  AUTH_LEVELS.PLANNING,
  AUTH_LEVELS.STAFF,
  AUTH_LEVELS.SUPERUSER,
]

// The user levels that satisfy a requirement for each level. This is a partial
// order, not a single rank: STAFF and SUPERUSER sit above every requirement,
// PLANNING sits above the operational roles but not above STAFF, and the
// operational roles are only comparable with themselves.
const SATISFYING_LEVELS: Record<AuthLevel, readonly AuthLevel[]> = {
  [AUTH_LEVELS.STUDENT]: [AUTH_LEVELS.STUDENT, ...ELEVATED_LEVELS],
  [AUTH_LEVELS.SALES]: [AUTH_LEVELS.SALES, ...ELEVATED_LEVELS],
  [AUTH_LEVELS.ENGINEER]: [AUTH_LEVELS.ENGINEER, ...ELEVATED_LEVELS],
  [AUTH_LEVELS.CUSTOMER]: [AUTH_LEVELS.CUSTOMER, ...ELEVATED_LEVELS],
  [AUTH_LEVELS.EMPLOYEE]: [AUTH_LEVELS.EMPLOYEE, ...ELEVATED_LEVELS],
  [AUTH_LEVELS.PLANNING]: ELEVATED_LEVELS,
  [AUTH_LEVELS.STAFF]: [AUTH_LEVELS.STAFF, AUTH_LEVELS.SUPERUSER],
  [AUTH_LEVELS.SUPERUSER]: [AUTH_LEVELS.SUPERUSER],
}

// The first level whose flag is set wins, so the order is the precedence contract.
const LEVEL_CHECKS: ReadonlyArray<
  readonly [AuthLevel, (store: ReturnType<typeof useAuthStore>) => boolean]
> = [
  [AUTH_LEVELS.STUDENT, (store) => store.isStudent],
  [AUTH_LEVELS.SALES, (store) => store.isSales],
  [AUTH_LEVELS.ENGINEER, (store) => store.isEngineer],
  [AUTH_LEVELS.CUSTOMER, (store) => store.isCustomer],
  [AUTH_LEVELS.PLANNING, (store) => store.isPlanning],
  [AUTH_LEVELS.EMPLOYEE, (store) => store.isEmployee],
  [AUTH_LEVELS.SUPERUSER, (store) => store.isSuperuser],
  [AUTH_LEVELS.STAFF, (store) => store.isStaff],
]

function isAuthLevel(value: string): value is AuthLevel {
  return (Object.values(AUTH_LEVELS) as readonly string[]).includes(value)
}

export function getUserAuthLevel(): AuthLevel | undefined {
  const store = useAuthStore()
  return LEVEL_CHECKS.find(([, matches]) => matches(store))?.[0]
}

export function hasAccessRouteAuthLevel(authLevelNeeded: string | string[]): boolean {
  const authLevelUser = getUserAuthLevel()
  if (authLevelUser === undefined) {
    return false
  }

  if (typeof authLevelNeeded === 'string') {
    if (!isAuthLevel(authLevelNeeded)) {
      return false
    }
    return SATISFYING_LEVELS[authLevelNeeded].includes(authLevelUser)
  }

  if (Array.isArray(authLevelNeeded)) {
    return (
      authLevelNeeded.includes(authLevelUser) || ELEVATED_LEVELS.includes(authLevelUser)
    )
  }

  return false
}
