<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>  
          <b-icon icon="minecart-loaded"></b-icon>
          <span class="backlink" @click="cancelForm">Actions</span> /
          <strong>{{ action.name  }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !action.name"> ({{ $trans('new') }})</span>
            <span v-if="!isCreate"> ({{ $trans('edit')}})</span>
          </span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" type="button" variant="secondary">
            <b-icon icon="x"></b-icon>
            {{ $trans('Cancel') }}</b-button>
          <b-button v-if="!isCreate" @click="showDeleteModal" type="button" variant="danger">
            <b-icon icon="trash"></b-icon>
            {{ $trans('Delete') }}</b-button>
          <b-button @click="submitForm" type="button" variant="primary">
            <b-icon icon="check"></b-icon>
            {{ isCreate ? $trans('Create action') : $trans('Save') }}
          </b-button>
        </div>
      </div>
    </header>
  
    
      <div class="page-detail flex-columns">
        <div class="panel">
            <b-col>
              <b-row>
                <b-col cols="6" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="action_name"
                  >
                    <b-form-input
                    autofocus
                    id="action_name"
                    size="sm"
                    v-model="action.name"
                    :state="isSubmitClicked ? !v$.action.name.$error : null"
                    ></b-form-input>
                    <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.action.name.$error : null">
                    {{ $trans('Please enter a name') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="6" role="group">
                  <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Type')"
                  label-for="action_type"
                  >
                  <b-form-select v-model="action.type" :options="actionTypes" size="sm"></b-form-select>
                </b-form-group>
              </b-col>
            </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Description')"
                  label-for="action_description"
                  >
                  <b-form-textarea
                  id="action_description"
                  v-model="action.description"
                  rows="3"
                  ></b-form-textarea>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <h4>{{ $trans('Conditions') }}</h4>
                <b-table small :fields="conditionFields" :items="action.json_conditions" responsive="md">
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <b-link class="h5 mx-2" @click.prevent="deleteCondition(data.index)">
                        <b-icon-trash></b-icon-trash>
                      </b-link>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('field')"
                label-for="action-condition-field"
                >
                <b-form-input
                id="action-condition-field"
                size="sm"
                      v-model="condition_field"
                    ></b-form-input>
                  </b-form-group>
                </b-col>
                <b-col cols="4" role="group">
                  <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('operator')"
                  label-for="action-condition-operator"
                  >
                  <b-form-select v-model="condition_operator" :options="operators" size="sm"></b-form-select>
                </b-form-group>
              </b-col>
              <b-col cols="4" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('value')"
                label-for="action-condition-value"
                >
                <b-form-input
                id="action-condition-value"
                size="sm"
                v-model="condition_value"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="12">
              <footer class="modal-footer">
                <b-button @click="addCondition" class="btn btn-primary" size="sm" type="button" variant="warning">
                  {{ $trans('Add condition') }}
                </b-button>
              </footer>
            </b-col>
          </b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Condition handling')"
              label-for="action_type"
              >
                <b-form-select v-model="action.querymode" :options="querymodes" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
          </b-col>
        </div>
        <div class="panel">
          <div v-if="action.type === 'status'">
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Override status?')"
                  label-for="action_status_override"
                  :description="$trans('Set a different status in the original order.')"
                  >
                  <b-form-checkbox
                    id="action_status_override"
                    v-model="action.override_status"
                    >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                  v-if="action.type === 'status' && action.override_status"
                  label-size="sm"
                  v-bind:label="$trans('Status')"
                  label-for="action_status_override_template"
                  >
                  <b-form-input
                  id="action_status_override_template"
                  size="sm"
                  v-model="action.template"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'copy'">
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('Partner')"
                label-for="action_partner"
                >
                <b-form-select v-model="action.company_partner" :options="partners" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
            </b-row>
          </div>
          <div v-if="action.type.indexOf('email') !== -1">
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="action_email_address"
                  >
                  <b-form-input
                  id="action_email_address"
                  size="sm"
                  v-model="action.address"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Subject')"
                  label-for="action_email_subject"
                  >
                  <b-form-input
                  id="action_email_subject"
                  size="sm"
                  v-model="action.subject"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('Body')"
                label-for="action_email_body"
                >
                <b-form-textarea
                id="action_email_body"
                v-model="action.template"
                rows="10"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'send_sms'">
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('Address')"
                label-for="action_sms_address"
                >
                    <b-form-input
                      id="action_sms_address"
                      size="sm"
                      v-model="action.address"
                    ></b-form-input>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Body')"
                  label-for="action_sms_body"
                  >
                  <b-form-textarea
                  id="action_sms_body"
                  v-model="action.template"
                  rows="10"
                  ></b-form-textarea>
                </b-form-group>
              </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'send_fcm'">
            <b-row>
              <b-col cols="12" role="group">
                <b-form-group
                label-size="sm"
                v-bind:label="$trans('User')"
                label-for="action_fcm_address"
                >
                <b-form-input
                id="action_fcm_address"
                size="sm"
                v-model="action.address"
                ></b-form-input>
              </b-form-group>
            </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Title')"
                    label-for="action_fcm_title"
                    >
                    <b-form-input
                    id="action_fcm_title"
                    size="sm"
                    v-model="action.subject"
                    ></b-form-input>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Body')"
                  label-for="action_fcm_body"
                  >
                  <b-form-textarea
                  id="action_fcm_body"
                  v-model="action.template"
                  rows="10"
                  ></b-form-textarea>
                </b-form-group>
              </b-col>
            </b-row>
          </div>
        </div>
        

      <b-modal
        id="delete-action-modal"
        ref="delete-action-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ $trans('Are you sure you want to delete this action?') }}</p>
      </b-modal>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import actionOrderModel from '@/models/orders/Action.js'
import actionTripModel from '@/models/mobile/TripStatuscodeAction.js'
import partnerModel from '@/models/company/Partner.js'

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    list_type: {
      type: [String],
      default: 'order'
    },
    pk: {
      type: [String, Number],
      default: null
    },
    statuscode_pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    return {
      action: {
        name: {
          required,
        },
      }
    }
  },
  data() {
    return {
      actionModel: null,

      isLoading: false,
      partners: [],

      condition_field: '',
      condition_operator: '',
      condition_value: '',
      conditionFields: [
        {key: 'field', label: this.$trans('Field')},
        {key: 'operator', label: this.$trans('Operator')},
        {key: 'value', label: this.$trans('Value')},
        {key: 'icons'}
      ],

      submitClicked: false,
      action: actionOrderModel.getFields(),
      operators: ['=', '!=', '<', '<=', '>', '>=', 'REGEXP', 'NOTREGEXP', 'CONTAINS'],
      querymodes: [
        {value: 'and', text: this.$trans('must match all of the conditions')},
        {value: 'or', text: this.$trans('match any of the conditions')},
      ],
      actionTypes: null,
      actionTypesOrder: [
        {value: 'email', text: this.$trans('send email')},
        {value: 'email_assigned', text: this.$trans('email assigned engineers')},
        {value: 'copy', text: this.$trans('copy order to partner')},
        {value: 'status', text: this.$trans('status change original order')},
        {value: 'email_workorders', text: this.$trans('email workorders')},
        {value: 'send_sms', text: this.$trans('send sms')},
        {value: 'send_fcm', text: this.$trans('send FCM')},
      ],
      actionTypesTrip: [
        {value: 'email', text: this.$trans('send email')},
        {value: 'send_sms', text: this.$trans('send sms')},
        {value: 'send_fcm', text: this.$trans('send FCM')},
      ],
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
  async created() {
    switch(this.list_type) {
      case 'order':
        this.actionTypes = this.actionTypesOrder
        this.actionModel = actionOrderModel

        const partners = await partnerModel.list()
        for (let i=0; i<partners.results.length; i++) {
          this.partners.push({
            value: partners.results[i].id,
            text: partners.results[i].partner_view.name
          })
        }

        if (this.isCreate) {
          this.action = this.actionModel.getFields()
        } else {
          this.loadData()
        }

        break
      case 'trip':
        this.actionTypes = this.actionTypesTrip
        this.actionModel = actionTripModel

        if (this.isCreate) {
          this.action = this.actionModel.getFields()
        } else {
          this.loadData()
        }

        break
      default:
        throw `unknown list_type: ${this.list_type}`
    }

  },
  methods: {
    showDeleteModal() {
      this.$refs['delete-action-modal'].show()
    },
    async doDelete() {
      this.isLoading = true

      try {
        await this.actionModel.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Action has been deleted'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error deleting action', error)
        this.errorToast(this.$trans('Error deleting action'))
        this.isLoading = false
      }
    },
    addCondition() {
      this.action.json_conditions.push({
        field: this.condition_field,
        operator: this.condition_operator,
        value: this.condition_value
      })
    },
    deleteCondition(index) {
      this.action.json_conditions.splice(index, 1)
    },
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
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
        try {
          this.action.statuscode = this.statuscode_pk
          await this.actionModel.insert(this.action)
          this.infoToast(this.$trans('Created'), this.$trans('Action has been created'))
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('error creating action', error)
          this.errorToast(this.$trans('Error creating action'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.actionModel.update(this.pk, this.action)
        this.infoToast(this.$trans('Updated'), this.$trans('Action has been updated'))
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('error updating action', error)
        this.errorToast(this.$trans('Error updating action'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.action = await this.actionModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching action', error)
        this.errorToast(this.$trans('Error loading action'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
