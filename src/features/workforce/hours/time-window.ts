import type { CompanyTimeRegistrationListData } from '@/api/types.gen'
import type { WindowMode } from './pivot'

/**
 * The window the time-registration read asks for.
 *
 * `mode` and `start_date` are the parameters the endpoint declares, and
 * `start_date` is honoured for both the week and the month window: the backend
 * truncates it to the first of the month, so it produces exactly the window the
 * legacy screen's `month`/`year` pair did - and rides on the declared parameter
 * instead of two it never declared.
 *
 * The year window is the exception, and the reason this file exists. For
 * `mode=year` the backend reads `?year=` alone (`UserHoursDataMixin.get_date_list`
 * in apps/core/rest.py: "Honoured for week and month, ignored for year") while
 * the viewset's `@extend_schema` documents only `mode`, `start_date` and `user` -
 * so the parameter a working year window needs is missing from
 * openapi/schema.yaml, from the generated query type and from the seam's
 * declared-parameter set. It is added below through one widening rather than
 * dropped, because dropping it pins the year pill to the current year while the
 * heading still promises the browsed one. Retire the cast when the backend
 * declares the parameter and `npm run codegen` re-emits the type; the slice
 * README carries the same note under its ledger.
 */
export function timeWindowQuery({
  mode,
  anchor,
  userId,
}: {
  mode: WindowMode
  /** The anchor date, YYYY-MM-DD. */
  anchor: string
  userId?: string | number | null
}): CompanyTimeRegistrationListData['query'] {
  const query: Record<string, unknown> = {mode, start_date: anchor}

  if (userId !== null && userId !== undefined && userId !== '') {
    query.user = Number(userId)
  }
  if (mode === 'year') {
    query.year = Number(anchor.slice(0, 4))
  }

  return query as CompanyTimeRegistrationListData['query']
}
