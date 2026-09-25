<template>
  <BModal
    id="search-modal-wide"
    ref="search-modal-wide"
    :title="$trans('Search')"
    :cancel-disabled="true"
    @ok="searchAndAssignDone"
    size="lg"
    :ok-title="$trans('Close')"
  >
    <form ref="search-form">
      <b-container fluid>
        <b-row role="group">
          <b-col size="12">
              <BFormInput
                size="sm"
                autofocus
                v-model="query"
                v-bind:placeholder="$trans('Type to search orders')"
                @keydown.enter="search"
                @change="searchDebounced"
                @update="searchDebounced"
              />
          </b-col>
        </b-row>
      </b-container>
    </form>
    <div class="overflow-auto">
      <ul class="listing order-list full-size">
        <li>
          <div class="headings">
            <span class="order-id">{{ $trans("order id") }}</span>
            <span class="order-type">{{ $trans("type") }}</span>
            <span class="order-company-name">{{ $trans("company") }}</span>
            <span class="order-start-date">{{ $trans("start date") }}</span>
            <span class="order-status">{{ $trans("status") }}</span>
            <span class="order-actions">&nbsp;</span>
          </div>
        </li>
        <li v-if="isLoading" class="text-center my-2 list-loading">
          <div>
            <b-spinner class="align-middle"></b-spinner><br>
            <span>{{ $trans('loading orders') }}</span>
          </div>
        </li>
        <li v-if="orders.length === 0" class="list-empty">
          <div>
            <span>{{ $trans('No results') }}</span>
          </div>
        </li>
        <template v-for="order in orders" :key="order.id">
        <li v-if="!isLoading" style="">
          <div class="listing-item">
            <span class="order-id">#{{ order.order_id }}<span v-if="mustIncludeReference && order.order_reference && order.order_reference.length > 0"> / {{ order.order_reference }}</span></span>
            <span class="order-type">{{ order.order_type }}</span>
            <span class="order-company-name">{{ order.order_name }}</span>
            <span class="order-start-date" :title="`${order.start_date} ${order.start_time ? ' ' + order.start_time : ''}`">
              {{ order.start_date }}
              <BLink v-bind:title="$trans('Edit start and end dates')" v-on:click.prevent="editStartDate(order)">
                <IBiPencil class="edit-icon" />
              </BLink>
            </span>
            <span class="order-status" :title="order.last_status_full ?? undefined">
              <IBiCircleFill
                :style="`color:${orderStatusColorCode}`"
              />
              {{ order.last_status_full }}
            </span>
            <div class="order-actions" style="">
              <RowAction icon="assign"
                :title="$trans('Assign')"
                :method="function() { selectOrder(order) }"
              />
            </div>
          </div>
        </li>
        </template>
      </ul>
    </div>

    <template #footer="{}">
      <b-row v-if="selectedOrders.length > 0" class="selected-orders float-left">
        <span class="dimmed">{{ $trans('Selected') }} ({{ selectedOrders.length }}):</span>
        <span v-for="(order, index) in selectedOrders" :key="order.id" class="selected-order">
            {{ order.order_id }}
            <IBiXCircle class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></IBiXCircle>
            <IBiXCircleFill class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></IBiXCircleFill>
        </span>
      </b-row>
      <BButton
        class="float-right"
        variant="primary"
        @click="searchAndAssignDone()"
        :data-non-zero="hasSelectedOrders()?'1':'0'"
      >
        <IBiPersonLinesFill class="assign-icon"></IBiPersonLinesFill>&nbsp;<span>{{ buttonLabel }}</span>
      </BButton>
      <EditStartDate
        id="edit-start-date"
        ref="edit-start-date"
        @edit-start-date-done="editStartDateDone"
      />
    </template>
  </BModal>
</template>

<script setup lang="ts">
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import moment from 'moment'

import RowAction from '@/components/RowAction.vue'
import EditStartDate from './EditStartDate.vue'

/**
 * Search the order collection and stage the ones to assign.
 *
 * The staged orders live in the main store, because the board that assigns them
 * is a different screen and is mounted behind this modal. Everything else is
 * this component's own: the term, the results, and the date editor.
 *
 * The term is only *committed* once it is worth searching for — three
 * characters or more, and not the term already on screen — so the box can be
 * typed into without a request per keystroke.
 */
const emit = defineEmits<{
  (event: 'search-and-assign-done', hasSelection: boolean): void
}>()

const store = useMainStore()
const {create: toast} = useToast()

const modal = useTemplateRef<{show: () => void; hide: () => void}>('search-modal-wide')
const editStartDateModal = useTemplateRef<InstanceType<typeof EditStartDate>>('edit-start-date')

const query = ref('')
/** The term the results on screen answer; `query` is only the draft. */
const committed = ref('')
const lastQuery = ref<string | false>(false)
const selectedOrders = ref<Api.Order[]>([])

const mustIncludeReference = computed(() => store.getOrderListMustIncludeReference)

/**
 * The dot beside a row's status. It reads the store's legend, which is what
 * the legacy screen meant to do — but it passes no status, so the legend is
 * never consulted and the dot is the fallback grey. Preserved as it renders;
 * see the README's preserved defects.
 */
const orderStatusColorCode = computed(() => my24.status2color(store.getStatuscodes, undefined))

const listQuery = useQuery(() => ({
  ...Api.OrderOrder.list.options({query: {page: 1, q: committed.value}}),
  // Nothing to ask for until the draft is worth a request.
  enabled: committed.value.trim().length > 2,
}))

const isLoading = computed(() => listQuery.isFetching.value)

/** Results, or none while the box holds a term too short to have searched. */
const orders = computed<Api.Order[]>(() =>
  committed.value.trim().length > 2 ? (listQuery.data.value?.results ?? []) : [])

const patchOrder = useMutation({...Api.OrderOrder.update.mutation()})

const hasSelectedOrders = () => selectedOrders.value.length > 0

const buttonLabel = computed(() => (hasSelectedOrders() ? $trans('Assign these orders') : $trans('Close')))

/** Stage an order; picking the same one twice is a no-op. */
function selectOrder(order: Api.Order) {
  if (selectedOrders.value.some((selected) => selected.id === order.id)) {
    return
  }

  selectedOrders.value.push(order)
  store.setAssignOrders(selectedOrders.value)
}

function removeSelectedOrder(index: number) {
  selectedOrders.value.splice(index, 1)
  store.setAssignOrders(selectedOrders.value)
}

/**
 * Commit the draft, if it is worth a request and different from the last one.
 * An empty box resets the results instead of searching for nothing; a term
 * still being typed at length is ignored.
 */
function search() {
  if (isLoading.value) return

  const term = query.value.trim()
  if (term.length > 2) {
    if (lastQuery.value === false || lastQuery.value !== query.value) {
      lastQuery.value = query.value
      committed.value = query.value
    }
  } else if (term.length === 0) {
    lastQuery.value = false
    committed.value = ''
  }
}

const searchDebounced = AwesomeDebouncePromise(search, 500)

function editStartDate(order: Api.Order) {
  editStartDateModal.value?.setFromOrder(order)
  editStartDateModal.value?.show()
}

/**
 * Write the edited range back, as the ISO date the request schema declares.
 *
 * DRF accepts both spellings (`DATE_INPUT_FORMATS` is `['iso-8601',
 * '%d/%m/%Y']` — my24service `source/settings/default_settings.py:361`), so
 * this is the same date on the wire; it is the generated schema that insists on
 * ISO. The row is re-read rather than patched in place, because the collection
 * renders the *display* spelling the backend formats per tenant.
 */
async function editStartDateDone(orderId: number | null, startDate: Date, endDate: Date) {
  if (orderId === null) return

  try {
    await patchOrder.mutateAsync({
      path: {id: orderId},
      body: {
        start_date: moment(startDate).format('YYYY-MM-DD'),
        end_date: moment(endDate).format('YYYY-MM-DD'),
      },
    })

    await listQuery.refetch()
  } catch (error) {
    console.log('Error updating order dates', error)
    errorToast(toast, $trans('Error updating dates'))
  }
}

function show() {
  modal.value?.show()
}

function hide() {
  modal.value?.hide()
}

/** Closing hands the selection to the board, which is the one that assigns it. */
function searchAndAssignDone() {
  store.setAssignOrders(selectedOrders.value)
  emit('search-and-assign-done', hasSelectedOrders())
  hide()
}

defineExpose({show, hide})
</script>

<style scoped>
#search-modal-wide input.form-control.form-control-sm {
  max-width: 200px;
  margin: 0 auto 2em auto;
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: 3rem;
  border-color: transparent;
  box-shadow: 0 0.25ex 0.5ex rgba(0, 0, 0, 0.25);
  min-height: 2.6rem;
  padding: 2ex;
  font-size: 0.85rem;
}

/* this is a bit of a cheat but hey ho */
#search-modal-wide .btn.btn-secondary.disabled {
  display: none;
}

#search-modal-wide .headings span {
  width: 10rem;
}

#search-modal-wide .order-actions {
  width: 30px;
  max-width: 30px;
  min-width: 30px;
}
#search-modal-wide .order-status {
  min-width: 10rem;
  width: 10rem;
}

#search-modal-wide .listing-item .order-type {
  font-weight: bold;
  min-width: 6rem;
  width: 6rem;
}

#search-modal-wide .headings span.order-type {
  min-width: 6rem;
  width: 6rem;
}

#search-modal-wide .listing-item .order-start-date {
  max-width: 9rem;
  min-width: 9rem;
  width: 9rem;
}

#search-modal-wide .headings .order-company-name,
#search-modal-wide .listing-item .order-company-name {
  min-width: 7rem;
  max-width: 7rem;
  width: 7rem;
}

#search-modal-wide .listing-item .order-actions { text-align:right }

#search-modal-wide .list-empty,
#search-modal-wide .headings span { color: #a9adae }

#search-modal-wide .order-status,
#search-modal-wide .order-id { color: #a9adae }

#search-modal-wide .order-id { text-align: end; }

#search-modal-wide .list-empty div { margin: auto; padding: 5px 10px; }

#search-modal-wide .list-loading div { margin: auto }
#search-modal-wide .overflow-auto { max-height: calc(75vh - 200px) }

#search-modal-wide .btn.btn-primary { color: #fff !important }
#search-modal-wide .btn.btn-primary .assign-icon { display: none }
#search-modal-wide .btn.btn-primary[data-non-zero="1"] .assign-icon { display: inline-block }

.selected-orders { padding: 0.4rem 1rem 0.4rem 1rem }

.selected-order { margin-left: 5px }
.selected-order .icon {cursor: pointer}

.selected-order:not(:hover) .icon:last-of-type,
.selected-order:hover .icon:first-of-type { display: none }

</style>