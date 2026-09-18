/**
 * An object literal that names every member of a generated `*Enum` union — the
 * runtime enum a bare union cannot be, without giving up the union's guarantee
 * that no case is missing.
 *
 *   export const USE_PRICE = enumOf<UsePriceEnum>()({
 *     SETTINGS: 'settings',
 *     CUSTOMER: 'customer',
 *   })
 *
 * Two checks, both at compile time: a value that is not a member fails the
 * `TUnion` constraint, and a member the object does not carry becomes a
 * required `never`-valued property (the `Record<Exclude<…>, never>`), so the
 * argument is rejected. `T` infers from the literal, so `USE_PRICE.SETTINGS` is
 * `'settings'` rather than `string`.
 */
export function enumOf<TUnion extends string>() {
  return <T extends Record<string, TUnion>>(
    object: T & Record<Exclude<TUnion, T[keyof T]>, never>,
  ): Readonly<T> => object
}
