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
          <p><strong>{{ $trans('Assign to') }} {{ selectedUser ? rowName(selectedUser) : '' }}?</strong></p>
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
        <template #cell(name)="data">{{ rowName(data.item) }}</template>
        <template #cell(icons)="data">
          <BLink class="px-1" @click.prevent="askToAssign(data.item)" v-bind:title="$trans('Assign')">
            <IBiArrowBarRight font-scale="1"></IBiArrowBarRight>
          </BLink>
        </template>
      </b-table>

      <b-row v-if="mode === 'unassign'">
        <b-col cols="6">
          <p><strong>{{ $trans('Unassign') }} {{ selectedUser ? rowName(selectedUser) : '' }}?</strong></p>
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
        <template #cell(name)="data">{{ rowName(data.item) }}</template>
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
import type { AvailabilityUserRow } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms'
import { useTripAssignment } from '@/features/field-service/assignment'

/**
 * Who is on this trip and who could be: the trip, the users available for it,
 * and the users already assigned.
 *
 * The endpoint answers a bundle - `{trip, assigned_users, available_users}` -
 * and the generated response component now says so:
 * `MobileTripTripAvailabilityDetailRetrieveResponse`, whose two lists are rows
 * of `AvailabilityUserRow` - a union of the flattened student row and the
 * engineer row, whose account nests under `user` (see `rowName`).
 */

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
}))

useQueryErrorToast(query.error, $trans('Error fetching trip availability'))

const trip = computed(() => query.data.value?.trip)
const availableUsers = computed(() => query.data.value?.available_users ?? [])
const assignedUsers = computed(() => query.data.value?.assigned_users ?? [])

// The overlay covers the read and the write it triggers, as the legacy screen's
// two flags did together.
const isLoading = computed(() => query.isLoading.value || isPending.value)
const buttonDisabled = isPending

const mode = ref<Proposal>(null)
const selectedUser = ref<AvailabilityUserRow | null>(null)

/**
 * The row's name, spelled per variant: `AvailabilityUserRow` is a union of the
 * flattened student row (which carries `full_name`) and the engineer row, whose
 * account nests under `user` and so has only the name parts.
 */
function rowName(row: AvailabilityUserRow): string {
  if ('full_name' in row) return row.full_name

  const name = [row.user.first_name, row.user.last_name].filter(Boolean).join(' ')
  return name || row.user.username
}

const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'address', label: $trans('Address')},
  {key: 'rating_avg', label: $trans('Rating')},
  {key: 'icons', label: ''},
]

function askToAssign(user: AvailabilityUserRow) {
  mode.value = 'assign'
  selectedUser.value = user
}

function askToUnassign(user: AvailabilityUserRow) {
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
