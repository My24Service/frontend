<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Trip info') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Description') }}:</strong></b-td>
              <b-td>{{ trip?.description }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Date') }}:</strong></b-td>
              <b-td>{{ trip?.trip_date }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Required users') }}:</strong></b-td>
              <b-td>{{ trip?.required_users }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>

      <b-row v-if="mode === 'assign'">
        <b-col cols="6">
          <p><strong>{{ $trans('Assign to') }} {{ selectedUser?.full_name }}?</strong></p>
          <p>
            <BButton type="button" :disabled="buttonDisabled" class="btn btn-danger" @click="proceed">{{ $trans('Assign') }}</BButton>&nbsp;
            <BButton type="button" class="btn btn-default" @click="cancel">{{ $trans('Cancel') }}</BButton>
          </p>
        </b-col>
      </b-row>

      <h4>{{ $trans('Available users') }}</h4>
      <b-table
        small
        id="available-users-table"
        :fields="fields"
        :items="availableUsers"
        responsive="sm"
      >
        <template #cell(icons)="data">
          <BLink class="px-1" @click.prevent="askToAssign(data.item)" v-bind:title="$trans('Assign')">
            <IBiArrowBarRight font-scale="1"></IBiArrowBarRight>
          </BLink>
        </template>
      </b-table>

      <b-row v-if="mode === 'unassign'">
        <b-col cols="6">
          <p><strong>{{ $trans('Unassign') }} {{ selectedUser?.full_name }}?</strong></p>
          <p>
            <BButton type="button" :disabled="buttonDisabled" class="btn btn-danger" @click="proceed">{{ $trans('Unassign') }}</BButton>&nbsp;
            <BButton type="button" class="btn btn-default" @click="cancel">{{ $trans('Cancel') }}</BButton>
          </p>
        </b-col>
      </b-row>

      <h4>{{ $trans('Assigned users') }}</h4>
      <b-table
        small
        id="assigned-users-table"
        :fields="fields"
        :items="assignedUsers"
        responsive="sm"
      >
        <template #cell(icons)="data">
          <BLink class="px-1" @click.prevent="askToUnassign(data.item)" v-bind:title="$trans('Unassign')">
            <IBiTrash font-scale="1"></IBiTrash>
          </BLink>
        </template>
      </b-table>

      <footer class="modal-footer">
        <BButton @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</BButton>
      </footer>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { mobileTripTripAvailabilityDetailRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import type { Trip } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { useTripAssignment } from '../assignment/use-trip-assignment'

/**
 * Who is on this trip and who could be: the trip, the users available for it,
 * and the users already assigned.
 *
 * The endpoint's generated response component is a `Trip`, and the action does
 * not answer with one. `TripViewset.trip_availability_detail` (my24service
 * `apps/mobile/views.py:915+`) returns a bundle - `{'trip': …, 'assigned_users':
 * […], 'available_users': […]}` - so the screen reads its own view model
 * rather than the generated type, and its spec stubs the bundle as an explicit
 * `HttpResponse` for the same reason.
 */
interface TripAvailabilityUser {
  id: number
  full_name: string
  address: string | null
  rating_avg: number | null
}

interface TripAvailabilityBundle {
  trip: Trip
  available_users: TripAvailabilityUser[]
  assigned_users: TripAvailabilityUser[]
}

/** The write the proposal row is asking about: `null` while none is open. */
type Proposal = 'assign' | 'unassign' | null

const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const {create} = useToast()
const {assignTrip, unassignTrip, isPending} = useTripAssignment()

const tripId = computed(() => Number(props.pk))

const query = useQuery(() => ({
  ...mobileTripTripAvailabilityDetailRetrieveOptions({path: {id: tripId.value}}),
  enabled: Number.isFinite(tripId.value),
}) as never)

useQueryErrorToast(query.error, $trans('Error fetching trip availability'))

/**
 * The bundle, read off the query the generated options typed as a `Trip`.
 * The cast is the mismatch described above, in one place.
 */
const bundle = computed(() => query.data.value as unknown as TripAvailabilityBundle | undefined)
const trip = computed(() => bundle.value?.trip)
const availableUsers = computed(() => bundle.value?.available_users ?? [])
const assignedUsers = computed(() => bundle.value?.assigned_users ?? [])

// The overlay covers the read and the write it triggers, as the legacy screen's
// two flags did together.
const isLoading = computed(() => query.isLoading.value || isPending.value)
const buttonDisabled = isPending

const mode = ref<Proposal>(null)
const selectedUser = ref<TripAvailabilityUser | null>(null)

const fields = [
  {key: 'full_name', label: $trans('Name')},
  {key: 'address', label: $trans('Address')},
  {key: 'rating_avg', label: $trans('Rating')},
  {key: 'icons', label: ''},
]

function askToAssign(user: TripAvailabilityUser) {
  mode.value = 'assign'
  selectedUser.value = user
}

function askToUnassign(user: TripAvailabilityUser) {
  mode.value = 'unassign'
  selectedUser.value = user
}

function cancel() {
  mode.value = null
  selectedUser.value = null
}

/**
 * The confirmed proposal, written through `useTripAssignment`: assigning marks
 * the user unavailable for the trip, unassigning puts them back, and both
 * invalidate the availability read this page is showing - which is the reload
 * the legacy screen did by hand.
 */
async function proceed() {
  const user = selectedUser.value
  const asking = mode.value
  if (!user || !asking) return

  try {
    if (asking === 'assign') {
      await assignTrip(user.id, tripId.value)
      infoToast(create, $trans('Assigned'), $trans('Trip assigned'))
    } else {
      await unassignTrip(user.id, tripId.value)
      infoToast(create, $trans('Unassigned'), $trans('Student unassigned'))
    }
    cancel()
  } catch {
    errorToast(create, asking === 'assign'
      ? $trans('Error assigning trip')
      : $trans('Error unassigning trip'))
  }
}

function goBack() {
  router.go(-1)
}
</script>
