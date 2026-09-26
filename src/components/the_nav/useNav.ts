import { memberMemberRequestedCountRetrieve } from '@/api/sdk.gen'

// Shared navigation helpers for NavItems and SubNav.
//
// isTopActive() highlights a top-level sidebar entry: every top-level section
// owns its first path segment (/orders/*, /members/*, ...), so the section is
// the segment, not a route name. isSubActive() highlights a subnav entry by
// route NAME — the section configs in navSections.ts list the names each entry
// stays active on, which is what replaces the old per-file isActive() path
// splits (parts[2] vs last-segment vs indexOf variants, one of them indexing
// parts[parts.length] instead of parts[parts.length - 1]).
export interface UseNav {
  route: RouteLocationNormalizedLoaded
  isTopActive: (this: void, section: string) => boolean
  isSubActive: (this: void, names: string[]) => boolean
  isEquipmentTypeActive: (this: void, type: string, groups?: string[]) => boolean
}

export function useNav(): UseNav {
  const route = useRoute()

  function isTopActive(section: string): boolean {
    return (route.path || '').split('/')[1] === section
  }

  function isSubActive(names: string[]): boolean {
    const routeName = route.name
    return typeof routeName === 'string' && (names || []).includes(routeName)
  }

  // The Technical/Facility pair in branch and settings mode links to the same
  // route name with a different `type` param, so a name list cannot tell them
  // apart. The typed detail/edit variants (`-view-<type>`) carry the type in
  // the name instead of the params; both shapes are accepted.
  function isEquipmentTypeActive(type: string, groups: string[] = ['equipment-equipment', 'settings-equipment']): boolean {
    // route.name is string | symbol | undefined; the old code called
    // .startsWith on it directly.
    const name = typeof route.name === 'string' ? route.name : ''
    if (!groups.some((group) => name.startsWith(group))) return false
    if ('type' in route.params && route.params.type) return route.params.type === type
    return name.endsWith(`-${type}`)
  }

  return { route, isTopActive, isSubActive, isEquipmentTypeActive }
}

export interface UseRequestedCount {
  requestedCount: Ref<number>
  loadRequestedCount: (this: void) => Promise<void>
}

// The requested-members badge call, fetched once per nav mount when the user
// may see it. Direct call into the generated client - #326 deleted the
// hand-written Member service this used to ride on. throwOnError keeps the
// call shape the call-shape specs pin: GET /api/member/member/requested_count/
// with no query and no body.
export function useRequestedCount(): UseRequestedCount {
  const requestedCount = ref<number>(0)

  async function loadRequestedCount(): Promise<void> {
    const { data } = await memberMemberRequestedCountRetrieve({ throwOnError: true })
    requestedCount.value = data.count
  }

  return { requestedCount, loadRequestedCount }
}
