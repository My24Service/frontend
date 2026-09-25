import type { WindowMode } from './pivot'

/**
 * The window the time-registration read asks for.
 *
 * `mode` says which window the screen is on and the anchor date is the day it
 * is on; the endpoint computes the window from the two. The anchor rides as
 * `start_date`, which the backend honours for the week and the month window
 * (it truncates it to the first of the month, so the month window is exactly
 * the one the legacy screen's `month`/`year` pair produced). The year window
 * names its year outright, through the `year` parameter the operation declares;
 * `month` is declared too, and is deliberately left unset - the anchor date
 * already carries the month the caller stepped to.
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
}): Api.CompanyTimeRegistrationRetrieveData['query'] {
  const query: NonNullable<Api.CompanyTimeRegistrationRetrieveData['query']> = {
    mode,
    start_date: anchor,
  }

  if (userId !== null && userId !== undefined && userId !== '') {
    query.user = Number(userId)
  }
  if (mode === 'year') {
    query.year = Number(anchor.slice(0, 4))
  }

  return query
}
