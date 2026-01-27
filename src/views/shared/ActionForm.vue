<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiMinecartLoaded></IBiMinecartLoaded>
          <span class="backlink" @click="cancelForm">{{ this.$trans("Actions") }}</span> /
          <strong>{{ action.name  }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !action.name"> ({{ this.$trans('new') }})</span>
            <span v-if="!isCreate"> ({{ this.$trans('edit')}})</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            <IBiX></IBiX>
            {{ this.$trans('Cancel') }}</BButton>
          <BButton v-if="!isCreate" @click="showDeleteModal" type="button" variant="danger">
            <IBiTrash></IBiTrash>
            {{ this.$trans('Delete') }}</BButton>
          <BButton @click="submitForm" type="button" variant="primary">
            <IBiCheck></IBiCheck>
            {{ isCreate ? this.$trans('Create action') : this.$trans('Save') }}
          </BButton>
        </div>
      </div>
    </header>


      <div class="page-detail flex-columns">
        <div class="panel">
            <b-col>
              <b-row>
                <b-col cols="6" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Name')"
                    label-for="action_name"
                  >
                    <BFormInput
                    autofocus
                    id="action_name"
                    size="sm"
                    v-model="action.name"
                    :state="isSubmitClicked ? !v$.action.name.$error : null"
                    ></BFormInput>
                    <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.action.name.$error : null">
                    {{ this.$trans('Please enter a name') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="6" role="group">
                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Type')"
                  label-for="action_type"
                  >
                  <BFormSelect v-model="action.type" :options="actionTypes" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Description')"
                  label-for="action_description"
                  >
                  <BFormTextarea
                  id="action_description"
                  v-model="action.description"
                  rows="3"
                  ></BFormTextarea>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <h4>{{ this.$trans('Conditions') }}</h4>
                <b-table small :fields="conditionFields" :items="action.json_conditions" responsive="md">
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <BLink class="h5 mx-2" @click.prevent="deleteCondition(data.index)">
                        <IBiTrash></IBiTrash>
                      </BLink>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('field')"
                label-for="action-condition-field"
                >
                <BFormInput
                id="action-condition-field"
                size="sm"
                      v-model="condition_field"
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
                <b-col cols="4" role="group">
                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('operator')"
                  label-for="action-condition-operator"
                  >
                  <BFormSelect v-model="condition_operator" :options="operators" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('value')"
                label-for="action-condition-value"
                >
                <BFormInput
                id="action-condition-value"
                size="sm"
                v-model="condition_value"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="12">
              <footer class="modal-footer">
                <BButton @click="addCondition" class="btn btn-primary" size="sm" type="button" variant="warning">
                  {{ this.$trans('Add condition') }}
                </BButton>
              </footer>
            </b-col>
          </b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Condition handling')"
              label-for="action_type"
              >
                <BFormSelect v-model="action.querymode" :options="querymodes" size="sm"></BFormSelect>
              </BFormGroup>
            </b-col>
          </b-col>
        </div>
        <div class="panel">
          <div v-if="action.type === 'status'">
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Override status?')"
                  label-for="action_status_override"
                  :description="$trans('Set a different status in the original order.')"
                  >
                  <BFormCheckbox
                    id="action_status_override"
                    v-model="action.override_status"
                    >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  v-if="action.type === 'status' && action.override_status"
                  label-size="sm"
                  v-bind:label="$trans('Status')"
                  label-for="action_status_override_template"
                  >
                  <BFormInput
                  id="action_status_override_template"
                  size="sm"
                  v-model="action.template"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'copy'">
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Partner')"
                label-for="action_partner"
                >
                <BFormSelect v-model="action.company_partner" :options="partners" size="sm"></BFormSelect>
              </BFormGroup>
            </b-col>
            </b-row>
          </div>
          <div v-if="action.type.indexOf('email') !== -1">
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="action_email_address"
                  >
                  <BFormInput
                  id="action_email_address"
                  size="sm"
                  v-model="action.address"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Subject')"
                  label-for="action_email_subject"
                  >
                  <BFormInput
                  id="action_email_subject"
                  size="sm"
                  v-model="action.subject"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Body')"
                label-for="action_email_body"
                >
                <BFormTextarea
                id="action_email_body"
                v-model="action.template"
                rows="10"
                ></BFormTextarea>
              </BFormGroup>
            </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'send_sms'">
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Address')"
                label-for="action_sms_address"
                >
                    <BFormInput
                      id="action_sms_address"
                      size="sm"
                      v-model="action.address"
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Body')"
                  label-for="action_sms_body"
                  >
                  <BFormTextarea
                  id="action_sms_body"
                  v-model="action.template"
                  rows="10"
                  ></BFormTextarea>
                </BFormGroup>
              </b-col>
            </b-row>
          </div>
          <div v-if="action.type === 'send_fcm'">
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                label-size="sm"
                v-bind:label="$trans('User')"
                label-for="action_fcm_address"
                >
                <BFormInput
                id="action_fcm_address"
                size="sm"
                v-model="action.address"
                ></BFormInput>
              </BFormGroup>
            </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <BFormGroup
                    label-size="sm"
                    v-bind:label="$trans('Title')"
                    label-for="action_fcm_title"
                    >
                    <BFormInput
                    id="action_fcm_title"
                    size="sm"
                    v-model="action.subject"
                    ></BFormInput>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Body')"
                  label-for="action_fcm_body"
                  >
                  <BFormTextarea
                  id="action_fcm_body"
                  v-model="action.template"
                  rows="10"
                  ></BFormTextarea>
                </BFormGroup>
              </b-col>
            </b-row>
          </div>

          <div>
            <a href="https://my24service.github.io/docs/#orders" target="_blank">
              {{ this.$trans("documentation") }}
            </a>
          </div>

        </div>

      <b-modal
        id="delete-action-modal"
        ref="delete-action-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ this.$trans('Are you sure you want to delete this action?') }}</p>
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
import my24 from "@/services/my24";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";

export default {
  mixins: [componentMixin],
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()
    return {
      v$: useVuelidate(),
      create,
      mainStore
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
        this.actionTypes = this.actionTypesOrder.slice()

        const hasAccessToGripp = my24.hasAccessToModule({
          isStaff: this.isStaff,
          isSuperuser: this.isSuperuser,
          contract: this.mainStore.memberContract,
          module: 'company',
          part: 'connector-gripp'});

        if (hasAccessToGripp) {
          this.actionTypes.push( {value: 'send_to_gripp', text: this.$trans('send to Gripp')} );
        }

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
        infoToast(this.create, this.$trans('Deleted'), this.$trans('Action has been deleted'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error deleting action', error)
        errorToast(this.create, this.$trans('Error deleting action'))
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
          infoToast(this.create, this.$trans('Created'), this.$trans('Action has been created'))
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('error creating action', error)
          errorToast(this.create, this.$trans('Error creating action'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.actionModel.update(this.pk, this.action)
        infoToast(this.create, this.$trans('Updated'), this.$trans('Action has been updated'))
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('error updating action', error)
        errorToast(this.create, this.$trans('Error updating action'))
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
        errorToast(this.create, this.$trans('Error loading action'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
