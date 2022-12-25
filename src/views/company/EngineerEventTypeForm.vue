<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New event type') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit event type') }}</h2>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Event type')"
              label-for="event-type-event_type"
            >
              <b-form-input
                v-model="materialEventType.event_type"
                id="event-type-event_type"
                size="sm"
                :state="isSubmitClicked ? !v$.materialEventType.event_type.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.materialEventType.event_type.$error : null">
                {{ $trans('Please enter a type') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Measure last event type')"
              label-for="event-type-measure_last_event_type"
            >
              <b-form-input
                id="event-type-measure_last_event_type"
                size="sm"
                v-model="materialEventType.measure_last_event_type"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col size="4">
            <b-form-group
              v-bind:label="$trans('Status?')"
              label-for="event-type-statuscode"
            >
              <b-form-select
                id="event-type-statuscode"
                v-model="materialEventType.statuscode"
                :options="statuscodes"
                size="sm"
                value-field="id"
                text-field="statuscode"
              ></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import materialEventTypeModel from '../../models/company/EngineerEventType.js'

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      materialEventType: materialEventTypeModel.getFields(),
      statuscodes: [],
    }
  },
  validations: {
    materialEventType: {
      event_type: {
        required,
      },
    },
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    const statuscodes = await this.$store.dispatch('getStatuscodes')
    this.statuscodes = [{id: null, statuscode: ''}, ...statuscodes]
    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.materialEventType = materialEventTypeModel.getFields()
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (!this.materialEventType.measure_last_event_type || this.materialEventType.measure_last_event_type === '') {
        delete this.materialEventType.measure_last_event_type
      }

      if (this.isCreate) {
        try {
          await materialEventTypeModel.insert(this.materialEventType)
          this.infoToast(this.$trans('Created'), this.$trans('Event type has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating event type', error)
          this.errorToast(this.$trans('Error creating event type'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await materialEventTypeModel.update(this.pk, this.materialEventType)
        this.infoToast(this.$trans('Updated'), this.$trans('Event type has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating event type', error)
        this.errorToast(this.$trans('Error updating event type'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.materialEventType = await materialEventTypeModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching event type', error)
        this.errorToast(this.$trans('Error fetching event type'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
