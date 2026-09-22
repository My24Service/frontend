<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiTools></IBiTools>
          {{ $trans("Gripp API settings") }}
        </h3>
        <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
          {{ $trans('Submit') }}
        </BButton>
      </div>
    </header>
    <div class="app-detail panel overflow-auto">
<!--      <p>This is where Gripp API settings can be configured, like the API key, and other settings.</p>-->
<!--      <h4>Webhook configuration</h4>-->
<!--      <p>The following webhooks need to be configured:</p>-->
<!--      <ul><li>Trigger</li></ul>-->
      <h4>{{ $trans('Gripp API settings') }}</h4>
      <p>{{ $trans('The following data is needed to communicate with the Gripp API. An API key can be created within the Gripp environment under the API settings. It is recommended to create a separate API role with a limited number of rights. The following rights on the following modules are required:') }}</p>
      <ul>
        <li>company: <strong>read</strong></li>
        <li>contact: <strong>read</strong></li>
        <li>file: <strong>create read update</strong></li>
        <li>hour: <strong>create read update</strong></li>
        <li>offer: <strong>read update</strong></li>
        <li>offerprojectline: <strong>read update</strong></li>
        <li>project: <strong>read update</strong></li>
        <li>product: <strong>read</strong></li>
        <li>task: <strong>create read update</strong></li>
        <li>timelineentry: <strong>create read</strong></li>
      </ul>

      <b-form id="gripp_settings_form" class="page-detail flex-columns">
        <div class="panel col-1-1">
          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Gripp API connection')"
            label-for="api_enabled">
            <BFormCheckbox
              id="api_enabled"
              size="sm"
              v-model="settings.gripp_api_enabled">
              {{ $trans('Active') }}
            </BFormCheckbox>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Gripp API key')"
            label-for="api_key">
            <BFormInput
              id="api_key"
              size="sm"
              type="text"
              v-model="settings.gripp_api_key"></BFormInput>
            <p>{{ $trans('The API key created within the Gripp platform should be entered below.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Webhook password')"
            label-for="webhook_password">
            <BFormInput
              id="webhook_password"
              size="sm"
              type="text"
              v-model="settings.gripp_webhook_password"></BFormInput>
            <p>{{ $trans('The webhook password is a random string of alphanumeric characters that is included in the request the Gripp platform sends to My24Service to verify that the request actually comes from Gripp.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Order type')"
            label-for="default_order_type">
            <BFormInput
              id="default_order_type"
              size="sm"
              type="text"
              v-model="settings.gripp_default_order_type"></BFormInput>
            <p>{{ $trans('This is the order type assigned to all orders originating from Gripp.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Employee (numeric)')"
            label-for="default_employee">
            <BFormInput
              id="default_employee"
              size="sm"
              type="number"
              v-model="settings.gripp_default_employee"></BFormInput>
             <p>{{ $trans('This is the default employee assigned to the tasks.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Project phase for import (numeric)')"
            label-for="project_phase_match">
            <BFormInput
              id="project_phase_match"
              size="sm"
              type="number"
              v-model="settings.gripp_project_phase_match"></BFormInput>
             <p>{{ $trans('Only when the Gripp order is placed in this phase will the order be fully imported into My24Service.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Project phase after export (numeric)')"
            label-for="project_phase_workorder_signed">
            <BFormInput
              id="project_phase_workorder_signed"
              size="sm"
              type="number"
              v-model="settings.gripp_project_phase_workorder_signed"></BFormInput>
             <p>{{ $trans('When the order within My24Service is set to the status "signed work order", the order is synchronized to Gripp and given this project phase within Gripp. If this setting is left empty, the phase will not be adjusted.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Task type for work hours (numeric)')"
            label-for="tasktype_hours">
            <BFormInput
              id="tasktype_hours"
              size="sm"
              type="number"
              v-model="settings.gripp_tasktype_hours"></BFormInput>
           <p>{{ $trans('The hours registered within My24Service are synchronized within Gripp under a separate task. This task needs a task type (this could for example correspond to Assembly or Installation). If this setting is empty or 0, the task (and associated hours) is not exported.') }}</p>
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Task type for travel hours (numeric)')"
            label-for="tasktype_travel">
            <BFormInput
              id="tasktype_travel"
              size="sm"
              type="number"
              v-model="settings.gripp_tasktype_travel"></BFormInput>
          </BFormGroup>
           <p>{{ $trans('The hours registered within My24Service are synchronized within Gripp under a separate task. This task needs a task type. A separate task type "Travel" may need to be created. If this setting is empty or 0, the task (and associated hours) is not exported.') }}</p>
        </div>
      </b-form>

      <h4 class="mt-2">{{ $trans('Automation settings') }}</h4>
       <p>{{ $trans('This data must be configured on the Gripp side under the Automation options. This ensures My24Service can fetch order data when it changes.') }}</p>
      <b-alert variant="warning" v-if="!hasWebhookPassword">{{ $trans('No webhook password is set. Enter the details above and save them.') }}</b-alert>
      <table class="data-table" v-if="hasWebhookPassword" style="width:100%;">
        <tbody>
          <tr><td>{{ $trans('Name') }}: </td><td><strong>{{ $trans('My24Service request') }}</strong></td></tr>
          <tr><td>{{ $trans('When') }}: </td><td><strong>{{ $trans('Order') }}</strong> {{ $trans('is') }} <strong>{{ $trans('modified') }}</strong></td></tr>
          <tr><td>{{ $trans('Action') }}: </td><td><strong>{{ $trans('Web request') }}</strong></td></tr>
          <tr><td>{{ $trans('Request method') }}:</td><td><strong>POST</strong></td></tr>
                    <tr><td>Headers:</td><td><strong>User-Agent: My24Service/Gripp<br/>Content-Type: application/json</strong></td></tr>
          <tr><td>{{ $trans('Web address') }}:</td><td><code>https://{{member["companycode"]}}.my24service.com/api/connector/gripp/{{settings["gripp_webhook_password"]}}/automation-updated-order</code></td></tr>
                    <tr><td>Body:</td><td><code>{ "number": {nummer} }</code></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import {memberFieldDefaults} from '@/features/member'
import {
  connectorGrippSettingsPartialUpdate,
  connectorGrippSettingsRetrieve,
  memberMemberMeRetrieve,
} from '@/api/sdk.gen'

import {errorToast, infoToast, $trans} from "@/services/i18n";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      settings: {}, // the ones from server
      currentSettings: {}, // the ones in the page
      member: memberFieldDefaults(),
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    },
    hasWebhookPassword() {
      return (this.settings['gripp_webhook_password'] ?? '') !== '';
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.buttonDisabled = true
      this.isLoading = true

      try {
        // Only what changed goes over: the endpoint merges, and the two
        // secrets never come back from the server, so an untouched empty
        // field must not blank them.
        const body = {}
        for (const key in this.settings) {
          if (this.settings[key] !== this.currentSettings[key]) body[key] = this.settings[key]
        }
        const {data} = await connectorGrippSettingsPartialUpdate({body, throwOnError: true})
        this.applyServerSettings(data)
        infoToast(this.create, $trans('Updated'), $trans('Settings updated'))
        this.buttonDisabled = false
        this.isLoading = false
      } catch(error) {
        console.log('Error updating settings', error)
        errorToast(this.create, $trans('Error updating settings'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    applyServerSettings(data) {
      // the secrets are write-only: the fields start empty
      this.settings = {
        gripp_api_key: '',
        gripp_webhook_password: '',
        ...data,
      }
      this.currentSettings = {...this.settings}
    },
    async loadData() {
      this.isLoading = true
      const {data} = await memberMemberMeRetrieve()
      this.member = data
      try {
        const {data: grippSettings} = await connectorGrippSettingsRetrieve({throwOnError: true})
        this.applyServerSettings(grippSettings)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching settings', error)
        errorToast(this.create, $trans('Error fetching settings'))
        this.isLoading = false
      }
    },
  }
}
</script>
<style scoped>
input#api_key.form-control:not(:focus) {
  color: transparent;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
  -webkit-filter: blur(3px);
  filter: blur(3px);
  border:0;
}
input[type="number"] {
  max-width: 5em;
  text-align: right;
}
</style>
