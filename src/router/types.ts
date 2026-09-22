import type {
  LocationQueryRaw,
  RouteLocationAsPathGeneric,
  RouteLocationAsRelativeGeneric,
  RouteLocationRaw,
} from 'vue-router'
import type { RouteNamedMap } from 'vue-router/auto-routes'

/** A named route from the hand-written route table (see vite/typed-routes.js). */
export type RouteName = keyof RouteNamedMap

/**
 * A location for a route name held in a variable. TypeScript can't match
 * `{ name: RouteName }` against the per-route location union once it passes
 * ~25 members (we have ~300), so write literal locations inline and route
 * variables through here: the name is checked, and the params too when the
 * name is a literal.
 */
export function toRoute<N extends RouteName>(
  name: N,
  params?: RouteNamedMap[N]['paramsRaw'],
  query?: LocationQueryRaw,
): RouteLocationRaw {
  return { name, params, query } as unknown as RouteLocationRaw
}

/**
 * A location as a component prop. `RouteLocationRaw` (~600 members) is more
 * than Volar's prop types and `h()` will represent, so props take this: the
 * name is still checked, the params are not. Convert with `fromRouteTo()`.
 */
export type RouteTo =
  | string
  | (Omit<RouteLocationAsRelativeGeneric, 'name'> & { name?: RouteName })
  | RouteLocationAsPathGeneric

export function fromRouteTo(to: RouteTo): RouteLocationRaw {
  return to as unknown as RouteLocationRaw
}
