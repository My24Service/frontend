/**
 * An object literal that names every member of a generated `*Enum` union — the
 * runtime enum a bare union cannot be, without giving up the union's guarantee
 * that no case is missing.
 *
 *   export const COST_TYPE = enumOf<CostTypeEnum>()({
 *     USED_MATERIALS: 'used_materials',
 *     WORK_HOURS: 'work_hours',
 *   })
 *
 * Two checks, both at compile time: a value that is not a member fails the
 * `TUnion` constraint, and a member the object does not carry becomes a
 * required `never`-valued property (the `Record<Exclude<…>, never>`), so the
 * argument is rejected. `T` infers from the literal, so `COST_TYPE.WORK_HOURS` is
 * `'work_hours'` rather than `string`.
 */
export function enumOf<TUnion extends string>() {
  return <T extends Record<string, TUnion>>(
    object: T & Record<Exclude<TUnion, T[keyof T]>, never>,
  ): Readonly<T> => object
}
