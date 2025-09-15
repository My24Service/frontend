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
      <p>De volgende gegevens zijn nodig om met de Gripp API te kunnen communiceren. Een <strong>API key</strong> kan binnen de
      Gripp omgeving aangemaakt worden bij de API instellingen. Het wordt aangeraden een aparte <strong>API rol</strong> aan te
      maken met een beperkt aantal rechten. De volgende rechten op de volgende modules zijn noodzakelijk:</p>
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
          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Gripp API koppeling')"
            label-for="api_enabled">
            <b-form-checkbox
              id="api_enabled"
              size="sm"
              v-model="settings.gripp_api_enabled">
              Actief
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
            <p>De <strong>API key</strong> dat binnen het Gripp platform is aangemaakt dient hieronder ingevuld te worden.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Webhook wachtwoord')"
            label-for="webhook_password">
            <b-form-input
              id="webhook_password"
              size="sm"
              type="text"
              v-model="settings.gripp_webhook_password"></b-form-input>
            <p>Het <strong>Webhook wachtwoord</strong> is een willekeurige reeks alfanumerieke tekens dat onderdeel
              wordt van het verzoek dat het Gripp platform stuurt naar My24Service als verificatie dat het verzoek
              daadwerkelijk van Gripp komt.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Order type')"
            label-for="default_order_type">
            <b-form-input
              id="default_order_type"
              size="sm"
              type="text"
              v-model="settings.gripp_default_order_type"></b-form-input>
            <p>Dit is het opdracht-type dat aan alle uit Gripp afkomstige opdrachten wordt toegewezen.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Werknemer (numeriek)')"
            label-for="default_employee">
            <b-form-input
              id="default_employee"
              size="sm"
              type="number"
              v-model="settings.gripp_default_employee"></b-form-input>
            <p>Dit is de standaard werknemer die aan de taken wordt toegewezen</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Projectfase voor importeren (numeriek)')"
            label-for="project_phase_match">
            <b-form-input
              id="project_phase_match"
              size="sm"
              type="number"
              v-model="settings.gripp_project_phase_match"></b-form-input>
            <p>Als de Gripp opdracht in deze fase wordt gezet, alleen dan wordt deze opdracht volledig
            binnen My24Service geimporteerd.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Projectfase na exporteren (numeriek)')"
            label-for="project_phase_workorder_signed">
            <b-form-input
              id="project_phase_workorder_signed"
              size="sm"
              type="number"
              v-model="settings.gripp_project_phase_workorder_signed"></b-form-input>
            <p>Als de opdracht binnen My24Service in de status "werkbon getekend" wordt gezet, wordt
              de opdracht naar Gripp gesynchroniseerd en krijgt deze binnen Gripp deze projectfase.
            Als deze instelling leeg blijft, zal de fase niet worden aangepast.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Taaktype voor werkuren (numeriek)')"
            label-for="tasktype_hours">
            <b-form-input
              id="tasktype_hours"
              size="sm"
              type="number"
              v-model="settings.gripp_tasktype_hours"></b-form-input>
            <p>De binnen My24Service geregistreerde uren zullen onder een aparte taak worden gesynchroniseerd
            binnen Gripp. Deze taak heeft een taaktype nodig (dit kan bijvoorbeeld overeenkomen met Montage of Installatie).
            Als deze instelling leeg of 0 is, wordt de taak (en bijbehorende uren) niet geëxporteerd.</p>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Taaktype voor reisuren (numeriek)')"
            label-for="tasktype_travel">
            <b-form-input
              id="tasktype_travel"
              size="sm"
              type="number"
              v-model="settings.gripp_tasktype_travel"></b-form-input>
          </b-form-group>
          <p>De binnen My24Service geregistreerde uren zullen onder een aparte taak worden gesynchroniseerd
            binnen Gripp. Deze taak heeft een taaktype nodig. Mogelijk dient een apart taaktype "Reizen" aangemaakt
            worden. Als deze instelling leeg of 0 is, wordt de taak (en bijbehorende uren) niet geëxporteerd.</p>
        </div>
      </b-form>

      <h4 class="mt-2">Automation instellingen</h4>
      <p>Deze gegevens moeten aan de kant van Gripp worden geconfigureerd bij de Automation opties. Dit zorgt ervoor
      dat My24Service opdrachtgegevens kan ophalen op het moment dat deze wijzigen.</p>
      <b-alert variant="warning" v-if="!hasWebhookPassword">Er is geen webhook wachtwoord ingesteld. Voer hierboven de gegevens in en sla deze op.</b-alert>
      <table class="data-table" v-if="hasWebhookPassword" style="width:100%;">
        <tr><td>Naam: </td><td><strong>My24Service verzoek</strong></td></tr>
        <tr><td>Wanneer: </td><td><strong>Opdracht</strong> wordt <strong>gewijzigd</strong></td></tr>
        <tr><td>Actie: </td><td><strong>Web verzoek</strong></td></tr>
        <tr><td>Verzoek methode:</td><td><strong>POST</strong></td></tr>
        <tr><td>Web adres:</td><td><code>https://{{member["companycode"]}}.my24service.com/api/connector/gripp/{{settings["gripp_webhook_password"]}}/automation-updated-order</code></td></tr>
        <tr><td>Body:</td><td><code>{ "number": {nummer} }</code></td></tr>
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


      this.submitClicked = true
      this.buttonDisabled = true
      this.isLoading = true

      try {
        // If we don't send all the settings, all the other settings
        // will be reset to defaults, so we /must/ include everything.
        const allSettings = await memberModel.getSettings()
        const localKeys = Object.keys(this.settings);
        for (const key in allSettings) {
          if (localKeys.indexOf(key) > -1) {
            allSettings[ key ] = this.settings[ key ];
          }
        }
        
        await memberModel.updateSettings(allSettings);
        this.infoToast(this.$trans('Updated'), this.$trans('Settings updated'))
        this.buttonDisabled = false
        this.isLoading = false
      } catch(error) {
        console.log('Error updating settings', error)
        this.errorToast(this.$trans('Error updating settings'))
        this.isLoading = false
        this.buttonDisabled = false
      }
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
          'gripp_webhook_password': '',
          'gripp_default_order_types': '',
          'gripp_default_employee': '',
          'gripp_project_phase_match': '0',
          'gripp_project_phase_workorder_signed': '',
          'gripp_tasktype_hours': '',
          'gripp_tasktype_travel': ''
        };

        const localKeys = Object.keys(this.settings);

        // This fetches *all* the settings, we are only interested in a
        // subset to show on this page.
        const data = await memberModel.getSettings()
        for (const key in data) {
          if (localKeys.indexOf(key) > -1) {
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
