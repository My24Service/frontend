import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { memberMemberRequestedCountRetrieve } from '@/api/sdk.gen'

// Shared navigation helpers for NavItems and SubNav.
//
// isTopActive() highlights a top-level sidebar entry: every top-level section
// owns its first path segment (/orders/*, /members/*, ...), so the section is
// the segment, not a route name. isSubActive() highlights a subnav entry by
// route NAME — the section configs in navSections.js list the names each entry
// stays active on, which is what replaces the old per-file isActive() path
// splits (parts[2] vs last-segment vs indexOf variants, one of them indexing
// parts[parts.length] instead of parts[parts.length - 1]).
export function useNav() {
  const route = useRoute()

  function isTopActive(section) {
    return (route.path || '').split('/')[1] === section
  }

  function isSubActive(names) {
    return (names || []).includes(route.name)
  }

  // The Technical/Facility pair in branch and settings mode links to the same
  // route name with a different `type` param, so a name list cannot tell them
  // apart. The typed detail/edit variants (`-view-<type>`) carry the type in
  // the name instead of the params; both shapes are accepted.
  function isEquipmentTypeActive(type, groups = ['equipment-equipment', 'settings-equipment']) {
    const name = route.name || ''
    if (!groups.some((group) => name.startsWith(group))) return false
    if (route.params && route.params.type) return route.params.type === type
    return name.endsWith(`-${type}`)
  }

  return { route, isTopActive, isSubActive, isEquipmentTypeActive }
}

// The requested-members badge call, fetched once per nav mount when the user
// may see it. Direct call into the generated client - #326 deleted the
// hand-written Member service this used to ride on. throwOnError keeps the
// call shape the call-shape specs pin: GET /api/member/member/requested_count/
// with no query and no body.
export function useRequestedCount() {
  const requestedCount = ref(null)

  async function loadRequestedCount() {
    const { data } = await memberMemberRequestedCountRetrieve({ throwOnError: true })
    requestedCount.value = data.count
  }

  return { requestedCount, loadRequestedCount }
}
