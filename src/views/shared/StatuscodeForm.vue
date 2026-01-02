<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{name: 'order-statuscode-list'}">{{ $trans('Statuscodes') }}</router-link> /
          <strong>{{ statuscode.statuscode }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !statuscode.statuscode">{{ $trans('new') }}</span>
            <span v-if="!isCreate && !statuscode.statuscode">{{ $trans('edit')}}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            {{ $trans('Cancel') }}</BButton>
          <BButton @click="submitForm" type="button" variant="primary">
            {{ $trans('Submit') }}</BButton>
        </div>
      </div>
    </header>
    <div class="page-detail flex-columns">
      <div class="panel">
        <h6>{{ $trans('Settings') }}</h6>
        <BFormGroup
        v-bind:label="$trans('Statuscode')"
        label-for="statuscode_statuscode"
        label-cols="3"
        >
            <BFormInput
              autofocus
              id="statuscode_statuscode"
              size="sm"
              v-model="statuscode.statuscode"
              :state="isSubmitClicked ? !v$.statuscode.statuscode.$error : null"
            ></BFormInput>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.statuscode.statuscode.$error : null">
              {{ $trans('Please enter a statuscode') }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
          label-cols="3"
            v-bind:label="$trans('New status template')"
            label-for="statuscode_new_status_template"
            :description="$trans('For order statuses that are not set by the application.')">
            <BFormInput
              id="statuscode_new_status_template"
              size="sm"
              v-model="statuscode.new_status_template">
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Description')"
            label-for="statuscode_description">
            <BFormTextarea
              id="statuscode_description"
              v-model="statuscode.description"
              rows="3"></BFormTextarea>
          </BFormGroup>

          <h6>{{ $trans("Label") }}</h6>
          <BFormGroup
            label-cols="3"
            label="Label preview"
          >
          <small
            class="statuscode-preview"
            :style="`--bg-color: ${statuscode.color}; --text-color: ${statuscode.text_color}`">
            {{  statuscode.statuscode || 'statuscode text'}}
          </small>

          </BFormGroup>
          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Label color')"
            label-for="statuscode_color"
            :state="isSubmitClicked ? !v$.statuscode.color.$error : null"
            :description="$trans('Use this color in dispatch.')"
            invalid-feedback="Please choose a color">
            <color-picker
                id="statuscode_color"
                class="color-picker-placeholder"
                v-model="statuscode.color"
              ></color-picker>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Text color')"
            label-for="statuscode_text_color"
            :description="$trans('Use this text color in dispatch.')">
            <color-picker
                id="statuscode_color"
                class="color-picker-placeholder"
                v-model="statuscode.text_color"
              ></color-picker>
          </BFormGroup>

        </div>

        <div class="panel">
          <h6>{{ $trans("Usage") }}</h6>
          <BFormGroup
            v-if="list_type === 'order'"
            label-cols="3"
            v-bind:label="$trans('Use in dispatch')"
            label-for="statuscode_color_for_assignedorders"
            :description="$trans('Use this color for assigned orders in dispatch.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_color_for_assignedorders"
              v-model="statuscode.color_for_assignedorders"
            >
            <IBiCheck v-if="statuscode.color_for_assignedorders"></IBiCheck>
            {{ $trans('Use in dispatch') }}
            </BFormCheckbox>
          </BFormGroup>

          <h6>{{ $trans("Workflow") }}</h6>

          <BFormGroup
            v-if="list_type === 'order'"
            label-cols="3"
            v-bind:label="$trans('Start order')"
            label-for="statuscode_start_order"
            :description="$trans('This statuscode marks the start of an order. This is used in the App for the start order button.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_start_order"
              v-model="statuscode.start_order"
            >
              <IBiCheck v-if="statuscode.start_order"></IBiCheck>

              {{ $trans('Start order') }}
            </BFormCheckbox>
          </BFormGroup>
          <BFormGroup
            v-if="list_type === 'trip'"
            label-cols="3"
            v-bind:label="$trans('Starts trip')"
            label-for="statuscode_start_trip"
            :description="$trans('This statuscode marks the start of a trip. This is used in the App for the start trip button.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_start_trip"
              v-model="statuscode.start_trip"
            >
            <IBiCheck v-if="statuscode.start_trip"></IBiCheck>

            {{ $trans('Starts trip') }}
            </BFormCheckbox>
          </BFormGroup>

          <BFormGroup
            v-if="list_type === 'order'"
            label-cols="3"
            v-bind:label="$trans('Completes order')"
            label-for="statuscode_end_order"
            :description="$trans('This statuscode marks the end of an order. This is used in the App for the end order button.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_end_order"
              v-model="statuscode.end_order"
            >
            <IBiCheck v-if="statuscode.end_order"></IBiCheck>

            {{ $trans('Completes order') }}
            </BFormCheckbox>
          </BFormGroup>
          <BFormGroup
            v-if="list_type === 'trip'"
            label-cols="3"
            v-bind:label="$trans('End trip?')"
            label-for="statuscode_end_trip"
            :description="$trans('This statuscode marks the end of a trip. This is used in the App for the end trip button.')"
          >
            <BFormCheckbox
              id="statuscode_end_trip"
              v-model="statuscode.end_trip"
            >
            </BFormCheckbox>
          </BFormGroup>

          <BFormGroup
            v-if="list_type === 'order'"
            button
            button-variant="primary"
            label-cols="3"
            v-bind:label="$trans('After end order')"
            label-for="statuscode_after_end_order"
            :description="$trans('These statuscodes will show up as buttons in the App after the order is completed.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_after_end_order"
              v-model="statuscode.after_end_order"
            >
            <IBiCheck v-if="statuscode.after_end_order"></IBiCheck>

            {{$trans('After end order') }}
            </BFormCheckbox>
          </BFormGroup>

          <BFormGroup
            v-if="list_type === 'order'"
            label-cols="3"
            v-bind:label="$trans('Re-assignable')"
            label-for="statuscode_can_be_reassigned_after_end"
            :description="$trans('When checked, the order can be re-assigned after ending it. For example after no workorder has been reported.')"
          >
            <BFormCheckbox
              button
              button-variant="primary"
              id="statuscode_can_be_reassigned_after_end"
              v-model="statuscode.can_be_reassigned_after_end"
            >
            <IBiCheck v-if="statuscode.can_be_reassigned_after_end"></IBiCheck>

            {{ $trans('Re-assignable') }}
            </BFormCheckbox>
          </BFormGroup>
        </div>
      </div>
  </div>
</template>

<style scoped>
input[type="color"] {
  width: calc(1.5em + 0.75rem + 2px);
}
</style>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import statuscodeOrderModel from '@/models/orders/Statuscode.js'
import statuscodeTripModel from '@/models/mobile/TripStatuscode.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
  },
  props: {
    list_type: {
      type: [String],
      default: 'order'
    },
    pk: {
      type: [String, Number],
      default: null
    }
  },
  validations() {
    return {
      statuscode: {
        statuscode: {
          required,
        },
        color: {
          required,
        }
      }
    }
  },
  data() {
    return {
      // type based variables
      statuscodeModel: null,

      isLoading: false,
      submitClicked: false,
      statuscode: {},
      errorMessage: null,
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    switch(this.list_type) {
      case 'order':
        this.statuscodeModel = statuscodeOrderModel
        break
      case 'trip':
        this.statuscodeModel = statuscodeTripModel
        break
      default:
        throw `unknown list_type: ${this.list_type}`
    }

    if (this.isCreate) {
      this.statuscode = this.statuscodeModel.getFields()
    } else {
      this.loadData()
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

      // remove null fields
      const null_fields = ['new_status_template', 'description']
      for (let i=0; i<null_fields.length; i++) {
        if (this.statuscode[null_fields[i]] === null || this.statuscode[null_fields[i]] === '') {
          delete this.statuscode[null_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await this.statuscodeModel.insert(this.statuscode)
          infoToast(this.create, $trans('Created'), $trans('Statuscode has been created'))
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating statuscode', error)
          errorToast(this.create, $trans('Error creating statuscode'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.statuscodeModel.update(this.pk, this.statuscode)
        infoToast(this.create, $trans('Updated'), $trans('Statuscode has been updated'))
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating statuscode', error)
        errorToast(this.create, $trans('Error updating statuscode'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.statuscode = await this.statuscodeModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching statuscode', error)
        errorToast(this.create, $trans('Error loading statuscode'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
