import {
  mobileAssignUserTripCreateMutation,
  mobileUnassignUserTripCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import { MobileTrip } from '@/api/resources.gen'

/**
 * Putting a user on a trip and taking them off again.
 *
 * The mirror of `use-order-assignment`, and in the same module for the same
 * reason: they are one concept — a user committed to work — reached through two
 * pairs of endpoints. Assigning marks the user unavailable for the trip
 * (`set_unavailable`); unassigning puts them back (`set_available`), which is
 * what the legacy model sent and what the availability screen relies on when it
 * redraws `available_users`/`assigned_users`.
 */
export function useTripAssignment() {
  const queryClient = useQueryClient()

  const assignMutation = useMutation({...mobileAssignUserTripCreateMutation()})
  const unassignMutation = useMutation({...mobileUnassignUserTripCreateMutation()})

  async function assignTrip(userId: number, tripId: number) {
    await assignMutation.mutateAsync({
      path: {id: userId},
      body: {trip_ids: String(tripId), set_unavailable: true},
    })

    await MobileTrip.invalidate(queryClient)
  }

  async function unassignTrip(userId: number, tripId: number) {
    await unassignMutation.mutateAsync({
      path: {id: userId},
      body: {trip_pk: tripId, set_available: true},
    })

    await MobileTrip.invalidate(queryClient)
  }

  const isPending = computed(() => assignMutation.isPending.value || unassignMutation.isPending.value)

  return {assignTrip, unassignTrip, isPending}
}
