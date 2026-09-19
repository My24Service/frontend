/**
 * The end may not precede the start; whichever moved drags the other
 * along. Both order forms clamp the planning moments this way.
 */
export function useDateClamp<TDate extends string | Date>(
  order: Ref<{start_date: TDate | null; end_date: TDate | null}>,
) {
  watch(() => order.value.start_date, (start) => {
    if (start && order.value.end_date && order.value.end_date < start) order.value.end_date = start
  })
  watch(() => order.value.end_date, (end) => {
    if (end && order.value.start_date && end < order.value.start_date) order.value.start_date = end
  })
}
