<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="tools"></b-icon>
          {{ $trans("Teamleader API settings") }}
        </h3>
      </div>
    </header>
    <div class="app-detail panel overflow-auto">
      <b-form class="page-detail flex-columns">
        <div class="panel col-1-1">
          <div class="section rounded-sm">
            <h5>API Actief</h5>
            <b-form-group
              label-size="sm"
              label-cols="4"
              :label="$trans('Gripp API koppeling')"
              label-for="api_enabled">
              <b-form-checkbox
                id="api_enabled"
                size="sm"
                v-model="settings.api_enabled">
                Actief
              </b-form-checkbox>
            </b-form-group>

            <button
              class="btn btn-primary"
              @click="updateEnabled()"
            >
              {{ $trans('Submit') }}
            </button>
          </div>

          <div class="section rounded-sm">
            <h5>Tokens</h5>

            <div class="bg-success p-2 rounded-sm text-white" v-if="settings.token">
              {{ $trans('Tokens aanwezig')}}
            </div>
            <div v-else class="bg-warning p-2 rounded-sm">
              {{ $trans('Geen tokens aanwezig')}}
            </div>

            <div class="btn-group">
              <button class="btn btn-danger m-1">
                {{ $trans('Verwijder tokens') }}
              </button>
              <button
                class="btn btn-primary m-1"
                v-if="!settings.token"
                @click="checkTokens()"
              >
                {{ $trans('Geef toegang') }}
              </button>
            </div>

          </div>

          <div class="section rounded-sm">
            <h5>Instellingen</h5>
            <b-form-group
              label-size="sm"
              label-cols="4"
              :label="$trans('Invoice template ID')"
              label-for="invoice_template_uuid"
            >
              <div class="d-flex">
                <b-form-input
                  id="invoice_template_uuid"
                  size="sm"
                  type="text"
                  v-model="settings.invoice_template_uuid"
                ></b-form-input>
                <button class="btn-sm btn-secondary">Kies</button>
              </div>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Department ID')"
              label-for="department_uuid">
              <div class="d-flex">
                <b-form-input
                  id="department_uuid"
                  size="sm"
                  type="text"
                  v-model="settings.department_uuid"
                ></b-form-input>
                <button class="btn-sm btn-secondary">Kies</button>
              </div>
            </b-form-group>
          </div>
        </div>
      </b-form>
    </div>
  </div>
</template>
<script>
import {TeamleaderService} from '@/models/company/Teamleader'

export default {
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      settings: {},
      service: new TeamleaderService(),
      authorizationUrl: null,
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    },
  },
  created() {
    this.loadData()
  },
  methods: {
    async checkTokens() {
      const result = await this.service.checkTokens()
      if (result.status === 'auth') {
        window.open(result.authorization_url, '_blank');
      }
      if (result.status === 'ok') {
        this.infoToast('Status', 'Tokens aanwezig')
      }
    },
    async emptyTokens() {
      await this.service.emptyTokens()
      await this.loadData()
    },
    async updateInvoiceDocumentTemplateSetting() {
      await this.service.updateInvoiceDocumentTemplateSetting(this.settings.invoice_template_uuid)
      await this.loadData()
    },
    async updateDepartmentSetting() {
      await this.service.updateDepartmentSetting(this.settings.department_uuid)
      await this.loadData()
    },
    async updateEnabled() {
      await this.service.updateEnabled(this.settings.api_enabled)
      await this.loadData()
    },
    async loadData() {
      this.isLoading = true
      try {
        this.settings = await this.service.configDetail()
        this.isLoading = false

      } catch(error) {
        console.log('error fetching config', error)
        this.errorToast(this.$trans('Error fetching config'))
        this.isLoading = false
      }
    },
  }
}
</script>
<style scoped>
.section {
  background: lightgray;
  padding: 2em;
  margin-bottom: 1em;
}
input[type="number"] {
  max-width: 5em;
  text-align: right;
}
</style>
