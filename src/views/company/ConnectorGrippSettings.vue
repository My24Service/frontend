<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="tools"></b-icon>
          {{ $trans("Gripp API settings") }}
        </h3>
        <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
          {{ $trans('Submit') }}
        </b-button>
      </div>
    </header>
    <div class="app-detail panel overflow-auto">
<!--      <p>This is where Gripp API settings can be configured, like the API key, and other settings.</p>-->
<!--      <h4>Webhook configuration</h4>-->
<!--      <p>The following webhooks need to be configured:</p>-->
<!--      <ul><li>Trigger</li></ul>-->
      <h4>Gripp API instellingen</h4>
      <p>Deze gegevens zijn nodig om met de Gripp API te kunnen communiceren. Een API token kan binnen de Gripp omgeving
      aangemaakt worden bij de API instellingen.</p>

      <b-form class="page-detail flex-columns">
        <div class="panel col-1-1">
          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Gripp API koppeling actief')"
            label-for="api_enabled">
            <b-form-checkbox
              id="api_enabled"
              size="sm"
              v-model="settings.gripp_api_enabled">
            </b-form-checkbox>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Gripp API key')"
            label-for="api_key">
            <b-form-input
              id="api_key"
              size="sm"
              type="text"
              v-model="settings.gripp_api_key"></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Webhook password')"
            label-for="webhook_password">
            <b-form-input
              id="webhook_password"
              size="sm"
              type="text"
              v-model="settings.gripp_webhook_password"></b-form-input>
          </b-form-group>
          </div>
      </b-form>

      <h4 class="mt-2">Automation instellingen</h4>
      <p>Deze gegevens moeten aan de kant van Gripp worden geconfigureerd bij de Automation opties. Dit zorgt ervoor
      dat My24Service gegevens kan ophalen wanneer deze wijzigen.</p>
      <b-alert variant="warning" v-if="!hasWebhookPassword">Er is geen webhook wachtwoord ingesteld. Voer hierboven de gegevens in en sla deze op.</b-alert>
      <table class="data-table" v-if="hasWebhookPassword" style="width:100%;">
        <tr><td>Naam: </td><td><strong>My24Service verzoek</strong></td></tr>
        <tr><td>Wanneer: </td><td><strong>Opdracht</strong> wordt <strong>gewijzigd</strong></td></tr>
        <tr><td>Actie: </td><td><strong>Web verzoek</strong></td></tr>
        <tr><td>Verzoek methode:</td><td><strong>POST</strong></td></tr>
        <tr><td>Web adres:</td><td><code>https://{{member["companycode"]}}.my24service.com/api/connector/gripp/{{settings["gripp_webhook_password"]}}/automation-updated-order</code></td></tr>
        <tr><td>Body:</td><td><code>{ "number": {number} }</code></td></tr>
      </table>
    </div>
  </div>
</template>
<script>
import memberModel from '@/models/member/Member.js'

export default {
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      settings: {}, // the ones from server
      currentSettings: {}, // the ones in the page
      member: memberModel.getFields(),
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
      debugger;
      alert('hi');
      // const newValues = this.fromForm(this.settings);
      // this.submitClicked = true
      // this.buttonDisabled = true
      // this.isLoading = true
      // const newValues = this.fromForm(this.settings)
      //
      // try {
      //   await memberModel.updateSettings(newValues)
      //   this.infoToast(this.$trans('Updated'), this.$trans('Settings updated'))
      //   this.buttonDisabled = false
      //   this.isLoading = false
      // } catch(error) {
      //   console.log('Error updating settings', error)
      //   this.errorToast(this.$trans('Error updating settings'))
      //   this.isLoading = false
      //   this.buttonDisabled = false
      // }
    },
    async loadData() {
      this.isLoading = true
      this.member = await memberModel.getMe()
      try {

        this.currentSettings = {};
        this.settings = {
          'gripp_api_enabled': false,
          'gripp_api_key': '',
          'gripp_default_order_type': '',
          'gripp_project_phase_match': 0,
          'gripp_webhook_password': ''
        };

        const defaultKeys = Object.keys(this.settings);

        // This fetches *all* the settings, we are only interested in a subset to show
        // on this page.
        const data = await memberModel.getSettings()


        for (const key in data) {
          if (defaultKeys.indexOf(key) > -1) {
            this.settings[ key ] = data[ key ];
          }
        }

        for (const key in this.settings) {
          this.currentSettings[ key ] = this.settings[ key ];
        }

        this.isLoading = false

      } catch(error) {
        console.log('error fetching settings', error)
        this.errorToast(this.$trans('Error fetching settings'))
        this.isLoading = false
      }
    },
  }
}
</script>
<style scoped>
</style>
