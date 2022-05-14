<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Trip info') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Description') }}:</strong></b-td>
              <b-td>{{ tripAvailability.trip.description }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Date') }}:</strong></b-td>
              <b-td>{{ tripAvailability.trip.trip_date }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Required users') }}:</strong></b-td>
              <b-td>{{ tripAvailability.trip.required_users }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>

      <b-row v-if="assignMode">
        <b-col cols="6">
          <p><strong>{{ $trans('Assign to') }} {{ selectedUser.full_name }}?</strong></p>
          <p>
            <b-button type="button" :disabled="buttonDisabled" class="btn btn-danger" @click="proceed">{{ $trans('Assign') }}</b-button>&nbsp;
            <b-button type="button" class="btn btn-default" @click="cancel">{{ $trans('Cancel') }}</b-button>
          </p>
        </b-col>
      </b-row>

      <h4>{{ $trans('Available users') }}</h4>
      <b-table
        small
        id="available-users-table"
        :fields="fields"
        :items="tripAvailability.available_users"
        responsive="sm"
      >
        <template #cell(icons)="data">
          <b-link class="px-1" @click.prevent="assign(data.item)" v-bind:title="$trans('Assign')">
            <b-icon-arrow-bar-right font-scale="1"></b-icon-arrow-bar-right>
          </b-link>
        </template>
      </b-table>

      <b-row v-if="unAssignMode">
        <b-col cols="6">
          <p><strong>{{ $trans('Unassign') }} {{ selectedUser.full_name }}?</strong></p>
          <p>
            <b-button type="button" :disabled="buttonDisabled" class="btn btn-danger" @click="proceed">{{ $trans('Unassign') }}</b-button>&nbsp;
            <b-button type="button" class="btn btn-default" @click="cancel">{{ $trans('Cancel') }}</b-button>
          </p>
        </b-col>
      </b-row>

      <h4>{{ $trans('Assigned users') }}</h4>
      <b-table
        small
        id="assigned-users-table"
        :fields="fields"
        :items="tripAvailability.assigned_users"
        responsive="sm"
      >
        <template #cell(icons)="data">
          <b-link class="px-1" @click.prevent="unAssign(data.item)" v-bind:title="$trans('Unassign')">
            <b-icon-trash font-scale="1"></b-icon-trash>
          </b-link>
        </template>
      </b-table>

      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import tripAvailabilityModel from '@/models/mobile/TripAvailability.js'

export default {
  name: "TripAvailabilityDetail",
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      selectedUser: {},
      assignMode: false,
      unAssignMode: false,
      tripAvailability: {trip: {}},
      fields: [
        { key: 'full_name', label: this.$trans('Name') },
        { key: 'address', label: this.$trans('Address') },
        { key: 'rating_avg', label: this.$trans('Rating') },
        { key: 'icons', label: ''}
      ],
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  methods: {
    assign(user) {
      this.unAssignMode = false
      this.assignMode = true
      this.selectedUser = user
    },
    unAssign(user) {
      this.assignMode = false
      this.unAssignMode = true
      this.selectedUser = user
    },
    async proceed() {
      this.buttonDisabled = true
      this.isLoading = true

      if(this.assignMode) {
        try {
          await tripAvailabilityModel.assign(this.selectedUser.id, this.tripAvailability.trip.id)
          this.infoToast(this.$trans('Assigned'), this.$trans('Trip assigned'))
          this.loadTripAvailability()
          this.cancel()
          this.buttonDisabled = false
          this.isLoading = false
        } catch(error) {
          console.log('error assigning trip', error)
          this.errorToast(this.$trans('Error assigning trip'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        await tripAvailabilityModel.unAssign(this.selectedUser.id, this.tripAvailability.trip.id)
        this.infoToast(this.$trans('Unassigned'), this.$trans('Student unassigned'))
        this.loadTripAvailability()
        this.cancel()
        this.buttonDisabled = false
        this.isLoading = false
      } catch(error) {
        console.log('error unassigning trip', error)
        this.errorToast(this.$trans('Error unassigning trip'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    cancel() {
      this.assignMode = false
      this.unAssignMode = false
      this.selectedUser = {}
    },
    goBack() {
      this.$router.go(-1)
    },
    async loadTripAvailability() {
      this.isLoading = true

      try {
        this.tripAvailability = await tripAvailabilityModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching tripAvailability', error)
        this.errorToast(this.$trans('Error fetching trip availability'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadTripAvailability()
  }
}
</script>

<style scoped>
</style>
