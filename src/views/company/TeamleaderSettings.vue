<template>
  <div class="app-page">
    <DepartmentChooser
      id="department-chooser-modal"
      ref="department-chooser-modal"
      @department-chosen="departmentChosen"
    />

    <DocumentTemplateChooser
      id="template-chooser-modal"
      ref="template-chooser-modal"
      :department-id="settings.department_uuid"
      @template-chosen="invoiceTemplateChosen"
    />

    <b-modal
      id="delete-tokens"
      ref="delete-tokens"
      :title="$trans('Tokens verwijderen?')"
      @ok="doEmptyTokens"
    >
      <p class="my-4">{{ $trans('Weet u zeker dat u de tokens wilt verwijderen?') }}</p>
    </b-modal>

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
          <ol>
            <li>
              <div class="section rounded-sm revert">
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
                <div class="btn-group d-flex justify-content-end">
                  <div class="p-2">
                    <button
                      class="btn btn-primary m-1"
                      @click="updateEnabled()"
                    >
                      {{ $trans('Submit') }}
                    </button>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>Verbinding</h5>
                <div class="bg-success p-2 rounded-sm text-white" v-if="settings.has_tokens">
                  {{ $trans('Actief')}}
                </div>
                <div v-else class="bg-warning p-2 rounded-sm">
                  {{ $trans('Niet actief')}}
                </div>

                <div class="btn-group d-flex justify-content-end">
                  <div
                    class="p-2"
                    v-if="settings.has_tokens && false"
                  >
                    <button
                      class="btn btn-danger m-1"
                      @click="emptyTokens()"
                    >
                      {{ $trans('Verwijder') }}
                    </button>
                  </div>
                  <div
                    class="p-2"
                    v-if="!settings.has_tokens"
                  >
                    <button
                      class="btn btn-primary m-1"
                      @click="authorize()"
                    >
                      {{ $trans('Verleen toegang') }}
                    </button>
                  </div>

                </div>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>Department</h5>
                <b-form-group
                  label-size="sm"
                  label-cols="4"
                  v-bind:label="$trans('Department ID')"
                  label-for="department_uuid">
                  <div class="d-flex">
                    <b-form-input
                      id="department_name"
                      size="sm"
                      type="text"
                      :state="isDepartmentOk"
                      v-model="settings.department_name"
                    ></b-form-input>
                    <button
                      class="btn-sm btn-secondary"
                      @click="chooseDepartment()"
                    >Kies</button>
                  </div>
                </b-form-group>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>Factuur template</h5>
                <b-form-group
                  label-size="sm"
                  label-cols="4"
                  :label="$trans('Invoice template ID')"
                  label-for="invoice_template_uuid"
                >
                  <div class="d-flex">
                    <b-form-input
                      id="invoice_template_name"
                      size="sm"
                      type="text"
                      :state="isInvoiceTemplateOk"
                      v-model="settings.invoice_template_name"
                    ></b-form-input>
                    <button
                      class="btn-sm btn-secondary"
                      @click="chooseInvoiceTemplate()"
                    >Kies</button>
                  </div>
                </b-form-group>
                <h5>BTW-tarieven</h5>
                <b-table
                  id="tax-rates-table"
                  small
                  :busy="isLoading"
                  :fields="fields"
                  :items="taxRates"
                  responsive="md"
                  v-if="taxRates.length"
                >
                </b-table>
                <p v-if="!taxRates.length">
                  Nog geen BTW-tarieven aanwezig
                </p>
                <div class="btn-group d-flex justify-content-end">
                  <div
                    class="p-2"
                  >
                    <button
                      class="btn btn-primary"
                      @click="resetTaxRates()"
                    >Ververs</button>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </b-form>
    </div>
  </div>
</template>
<script>
import {TeamleaderService} from '@/models/company/Teamleader'
import DepartmentChooser from "@/views/company/teamleader/DepartmentsChooser.vue";
import DocumentTemplateChooser from "@/views/company/teamleader/DocumentTemplateChooser.vue";

export default {
  components: {
    DocumentTemplateChooser,
    DepartmentChooser,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      settings: {},
      service: new TeamleaderService(),
      authorizationUrl: null,
      authorizeClicked: false,
      taxRates: [],
      fields: [
        {key: 'description', label: this.$trans('Description')},
        {key: 'rate', label: this.$trans('Rate')},
      ]
    }
  },
  computed: {
    isDepartmentOk() {
      return !this.isEmpty(this.settings.department_uuid)
    },
    isInvoiceTemplateOk() {
      return !this.isEmpty(this.settings.invoice_template_uuid)
    },
  },
  created() {
    this.loadData()
  },
  methods: {
    isEmpty(val) {
      return val === null || val === ""
    },
    async departmentChosen(item) {
      this.$refs['department-chooser-modal'].hide()
      await this.updateDepartmentSetting(item)
    },
    chooseDepartment() {
      this.$refs['department-chooser-modal'].show()
    },
    async invoiceTemplateChosen(item) {
      this.$refs['template-chooser-modal'].hide()
      await this.updateInvoiceDocumentTemplateSetting(item)
    },
    chooseInvoiceTemplate() {
      this.$refs['template-chooser-modal'].show()
    },
    async authorize() {
      const result = await this.service.authorize()
      if (result.status === 'auth') {
        window.open(result.authorization_url, '_blank')
        const id = setInterval(async () => {
          this.settings = await this.service.configDetail()
          if (this.settings.has_tokens) {
            clearInterval(id)
          }
        }, 1000)
      }
      if (result.status === 'ok') {
        this.infoToast('Status', 'Tokens aanwezig')
      }
    },
    async emptyTokens() {
      // button/modal not used at the moment
      this.$refs['delete-tokens'].show()
    },
    async doEmptyTokens() {
      // not used at the moment
      await this.service.emptyTokens()
      await this.loadData()
    },
    async updateInvoiceDocumentTemplateSetting(item) {
      await this.service.updateInvoiceDocumentTemplateSetting(item.id, item.name)
      await this.loadData()
    },
    async updateDepartmentSetting(item) {
      await this.service.updateDepartmentSetting(item.id, item.name)
      await this.loadData()
    },
    async updateEnabled() {
      await this.service.updateEnabled(this.settings.api_enabled)
      await this.loadData()
    },
    async resetTaxRates() {
      const response = await this.service.resetTaxRates(this.settings.department_uuid)
      this.infoToast("BTW-tarieven",
        `${response.delete_result[0]} verwijderd, ${response.created} aangemaakt`)
      await this.fetchTaxRates()
    },
    async fetchTaxRates() {
      this.taxRates = []
      const response = await this.service.fetchTaxRates()
      this.taxRates = response.results
    },
    async loadData() {
      this.isLoading = true
      try {
        this.settings = await this.service.configDetail()
        await this.fetchTaxRates()
        this.isLoading = false
      } catch(error) {
        console.log('error fetching data', error)
        this.errorToast(this.$trans('Error fetching data'))
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
ol {
  font-size: 2.6em;
  list-style-type: upper-roman;
}
.revert {
  font-size: 0.9rem;
}
</style>
