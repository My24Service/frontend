<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New statuscode') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit statuscode') }}</h2>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Statuscode')"
              label-for="statuscode_statuscode"
            >
              <b-form-input
                autofocus
                id="statuscode_statuscode"
                size="sm"
                v-model="statuscode.statuscode"
                :state="isSubmitClicked ? !$v.statuscode.statuscode.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.statuscode.statuscode.$error : null">
                {{ $trans('Please enter a statuscode') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Color')"
              label-for="statuscode_color"
            >
              <color-picker
                id="statuscode_color"
                class="color-picker-placeholder"
                v-model="statuscode.color"
                :position="{ left: '-180px', top: '40px' }"
              >
              </color-picker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              v-if="list_type === 'order'"
              label-size="sm"
              v-bind:label="$trans('Start order?')"
              label-for="statuscode_start_order"
            >
              <b-form-checkbox
                id="statuscode_start_order"
                v-model="statuscode.start_order"
              >
              </b-form-checkbox>
            </b-form-group>
            <b-form-group
              v-if="list_type === 'trip'"
              label-size="sm"
              v-bind:label="$trans('Start trip?')"
              label-for="statuscode_start_trip"
            >
              <b-form-checkbox
                id="statuscode_start_trip"
                v-model="statuscode.start_trip"
              >
              </b-form-checkbox>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              v-if="list_type === 'order'"
              label-size="sm"
              v-bind:label="$trans('End order?')"
              label-for="statuscode_end_order"
            >
              <b-form-checkbox
                id="statuscode_end_order"
                v-model="statuscode.end_order"
              >
              </b-form-checkbox>
            </b-form-group>
            <b-form-group
              v-if="list_type === 'trip'"
              label-size="sm"
              v-bind:label="$trans('End trip?')"
              label-for="statuscode_end_trip"
            >
              <b-form-checkbox
                id="statuscode_end_trip"
                v-model="statuscode.end_trip"
              >
              </b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="statuscode_description"
            >
              <b-form-textarea
                id="statuscode_description"
                v-model="statuscode.description"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('New status template')"
              label-for="statuscode_new_status_template"
            >
              <b-form-input
                id="statuscode_new_status_template"
                size="sm"
                v-model="statuscode.new_status_template"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { required } from 'vuelidate/lib/validators'
import statuscodeOrderModel from '@/models/orders/Statuscode'
import statuscodeTripModel from '@/models/mobile/TripStatuscode'

export default {
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
  validations: {
    statuscode: {
      statuscode: {
        required,
      },
    },
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
    submitForm() {
      this.submitClicked = true
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
        return
      }

      // remove null fields
      const null_fields = []
      for (let i=0; i<null_fields.length; i++) {
        if (this.order[null_fields[i]] === null) {
          delete this.order[null_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        return this.$store.dispatch('getCsrfToken').then((token) => {
          this.statuscodeModel.insert(token, this.statuscode).then((statuscode) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Statuscode has been created')
            })

            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating statuscode')
            })

            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        this.statuscodeModel.update(token, this.pk, this.statuscode).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Updated'),
            message: this.$trans('Statuscode has been updated')
          })

          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error updating statuscode')
          })

          this.isLoading = false
        })
      })
    },
    loadData() {
      this.isLoading = true

      this.statuscodeModel.detail(this.pk).then((statuscode) => {
        this.statuscode = statuscode
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching statuscode', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading statuscode')
        })

        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
