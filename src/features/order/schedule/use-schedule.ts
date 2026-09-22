import { useLoading } from 'vue-loading-overlay'
import { Calendar, type CalendarOptions, type EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import locale from '@fullcalendar/core/locales/nl'

import {
  orderOrderMonthEventsListOptions,
  orderOrderRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderDetail, OrderEvent } from '@/api/types.gen'
import { toApiDate } from '@/features/forms'

/**
 * The mockup gives every order type its own tint. Which types a member has
 * is tenant configuration, so the colours are handed out by position in
 * `memberInfo.order_types` and wrap around past six. The classes live in
 * scss/shltr.scss.
 */
export const ORDER_TYPE_COLOR_COUNT = 6

/**
 * What the two schedule designs share: the FullCalendar over the
 * `order/month_events/` source, the order-type tints, the legend filter,
 * and the order modal an event click opens. The designs differ only in the
 * chrome around the calendar.
 */
export function useSchedule() {
  const mainStore = useMainStore()
  const queryClient = useQueryClient()
  const loading = useLoading()

  const orderTypes = computed<string[]>(() => (mainStore.getOrderTypes as string[] | undefined) ?? [])

  function orderTypeColorIndex(orderType: string): number {
    const index = orderTypes.value.indexOf(orderType)
    return index === -1 ? 0 : index % ORDER_TYPE_COLOR_COUNT
  }

  // The legend filter, over the range already loaded: hiding, not refetching.
  const selectedOrderTypes = ref<string[]>([])

  function isOrderTypeVisible(orderType: string): boolean {
    return !selectedOrderTypes.value.length || selectedOrderTypes.value.includes(orderType)
  }

  function toggleOrderType(orderType: string) {
    selectedOrderTypes.value = selectedOrderTypes.value.includes(orderType)
      ? selectedOrderTypes.value.filter((selected) => selected !== orderType)
      : [...selectedOrderTypes.value, orderType]
  }

  /** The order type of every event in the loaded range, in load order. */
  const loadedEventTypes = ref<string[]>([])

  const eventCount = computed(() => loadedEventTypes.value.filter(isOrderTypeVisible).length)

  /** FullCalendar's event source: the range it asks for, through the query cache. */
  const events: CalendarOptions['events'] = async (info, success, failure) => {
    const loader = loading.show()
    try {
      const rows = await queryClient.fetchQuery(orderOrderMonthEventsListOptions({
        query: {start: toApiDate(info.start), end: toApiDate(info.end)},
      }))
      loadedEventTypes.value = rows.map((event) => event.groupId)
      success(rows.map(toCalendarEvent))
    } catch (error) {
      failure(error as Error)
    } finally {
      loader.hide()
    }
  }

  function toCalendarEvent(event: OrderEvent): EventInput {
    const start = new Date(event.start)
    const end = event.end ? new Date(event.end) : start
    // the row's status colour is not the event's colour: FullCalendar would
    // paint the event with it, so it stays out of the spread
    const {color: _statusColor, ...rest} = event
    void _statusColor
    return {
      ...rest,
      id: String(event.id),
      end: event.end ?? undefined,
      allDay: start.getHours() === 0 && end.getHours() === 0,
      display: isOrderTypeVisible(event.groupId) ? 'auto' : 'none',
      className: ['my24-event', `my24-event-type-${orderTypeColorIndex(event.groupId)}`],
    }
  }

  // The order modal --------------------------------------------------------

  const selectedOrder = ref<OrderDetail | null>(null)
  const orderModal = ref<{show: () => void} | null>(null)

  const eventClick: CalendarOptions['eventClick'] = async (info) => {
    const loader = loading.show()
    try {
      selectedOrder.value = await queryClient.fetchQuery(orderOrderRetrieveOptions({path: {id: info.event.id}}))
      // the modal renders once there is an order; give it the tick
      await Promise.resolve()
      orderModal.value?.show()
    } catch {
      // the loader hides; nothing else to tell — the event stays on the calendar
    } finally {
      loader.hide()
    }
  }

  // The calendar -----------------------------------------------------------

  const calendar = shallowRef<Calendar | null>(null)

  const sharedOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    eventClick,
    defaultAllDay: true,
    locale,
  }

  function mountCalendar(element: HTMLElement, options: CalendarOptions) {
    calendar.value = new Calendar(element, {
      ...sharedOptions,
      ...options,
      plugins: [...(sharedOptions.plugins ?? []), ...(options.plugins ?? [])],
    })
    calendar.value.render()
  }

  function applyLegendFilter() {
    calendar.value?.getEvents().forEach((event) => {
      event.setProp('display', isOrderTypeVisible(event.groupId) ? 'auto' : 'none')
    })
  }

  onBeforeUnmount(() => {
    calendar.value?.destroy()
    calendar.value = null
  })

  return {
    orderTypes,
    orderTypeColorIndex,
    selectedOrderTypes,
    toggleOrderType,
    eventCount,
    selectedOrder,
    orderModal,
    calendar,
    mountCalendar,
    applyLegendFilter,
  }
}
