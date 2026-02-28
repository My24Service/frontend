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
      v-if="settings.department_uuid"
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
          <IBiTools></IBiTools>
          {{ $trans("Teamleader API settings") }}
        </h3>
      </div>
    </header>
    <div class="app-detail panel overflow-auto">
      <b-form class="page-detail flex-columns">
        <div class="panel col-1-1">
          <ol class="m-2">
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
                      @click="updateEnabled"
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
                      @click="emptyTokens"
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
                      @click="authorize"
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
                      class="btn btn-primary m-1"
                      @click="chooseDepartment"
                    >Kies</button>
                  </div>
                </b-form-group>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>Rekening</h5>
                <b-form-group
                  label-size="sm"
                  label-cols="4"
                  v-bind:label="$trans('Rekening')"
                  label-for="product_category_uuid">
                  <div class="d-flex">
                    <BFormSelect
                      id="product_category_uuid"
                      v-model="settings.product_category_uuid"
                      :options="productCategories"
                      size="sm"
                    ></BFormSelect>
                    <button
                      class="btn btn-primary m-1"
                      @click="updateProductCategory"
                    >Submit</button>
                  </div>
                </b-form-group>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>Product voor uren</h5>
                <b-form-group
                  label-size="sm"
                  label-cols="4"
                  v-bind:label="$trans('Product')"
                  label-for="hours_product_uuid"
                >
                  <div class="d-flex">
                    <b-form-input
                      id="hours_product_uuid"
                      size="sm"
                      type="text"
                      :state="isHoursProductOk"
                      v-model="settings.hours_product_uuid"
                    ></b-form-input>
                    <button
                      class="btn btn-primary m-1"
                      @click="openProductChooserModal"
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
                      class="btn btn-primary m-1"
                      @click="chooseInvoiceTemplate"
                    >Kies</button>
                  </div>
                </b-form-group>
              </div>
            </li>
            <li>
              <div class="section rounded-sm revert">
                <h5>BTW-tarieven</h5>
                <b-table
                  id="tax-rates-table"
                  small
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
                      class="btn btn-primary m-1"
                      @click="resetTaxRates()"
                    >Ververs</button>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </b-form>
      <TeamleaderProductChooserTeamleader
        ref="product-chooser-teamleader"
        @product-chosen="productChosenTl"
        :with-create-button="false"
      />
    </div>
  </div>
</template>
<script>
import {TeamleaderService} from '@/models/company/Teamleader'
import DepartmentChooser from "@/views/company/teamleader/DepartmentsChooser.vue";
import DocumentTemplateChooser from "@/views/company/teamleader/DocumentTemplateChooser.vue";
import {errorToast, infoToast} from "@/utils";
import {useToast} from "bootstrap-vue-next";
import componentMixin from "@/mixins/common";
import {useLoading} from "vue-loading-overlay";
import TeamleaderProductChooserTeamleader from "@/components/TeamleaderProductChooser.vue";

export default {
  setup() {
    const {create} = useToast()
    const loading = useLoading({
      // options
    });

    return {
      create,
      loading
    }
  },
  mixins: [componentMixin],
  components: {
    TeamleaderProductChooserTeamleader,
    DocumentTemplateChooser,
    DepartmentChooser,
  },
  data() {
    return {
      buttonDisabled: false,
      submitClicked: false,
      settings: {},
      service: new TeamleaderService(),
      authorizationUrl: null,
      authorizeClicked: false,
      taxRates: [],
      productCategories: [],
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
    isHoursProductOk() {
      return !this.isEmpty(this.settings.hours_product_uuid)
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
    async openProductChooserModal() {
      await this.$refs['product-chooser-teamleader'].show();
    },
    productChosenTl(obj) {
      console.log('productChosenTl', obj)
      this.settings.hours_product_uuid = obj.uuid
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
        infoToast(this.create, 'Status', 'Tokens aanwezig')
      }
    },
    async emptyTokens() {
      // button/modal not used at the moment
      await this.$refs['delete-tokens'].show()
    },
    async doEmptyTokens() {
      // not used at the moment
      let loader = this.loading.show();
      await this.service.emptyTokens()
      await this.loadData()
      loader.hide()
    },
    async updateInvoiceDocumentTemplateSetting(item) {
      let loader = this.loading.show();
      await this.service.updateInvoiceDocumentTemplateSetting(item.id, item.name)
      loader.hide()
      await this.loadData()
    },
    async updateDepartmentSetting(item) {
      let loader = this.loading.show();
      await this.service.updateDepartmentSetting(item.id, item.name)
      loader.hide()
      await this.loadData()
    },
    async updateEnabled() {
      let loader = this.loading.show();
      await this.service.updateEnabled(this.settings.api_enabled)
      loader.hide()
      await this.loadData()
    },
    async updateProductCategory() {
      let loader = this.loading.show();
      await this.service.updateProductCategory(this.settings.product_category_uuid)
      loader.hide()
      await this.loadData()
    },
    async resetTaxRates() {
      let loader = this.loading.show();
      const response = await this.service.resetTaxRates(this.settings.department_uuid)
      infoToast(this.create, "BTW-tarieven",
        `${response.delete_result[0]} verwijderd, ${response.created} aangemaakt`)
      await this.fetchTaxRates()
      loader.hide()
    },
    async fetchTaxRates() {
      this.taxRates = []
      if (this.settings.has_tokens) {
        let loader = this.loading.show();
        const response = await this.service.fetchTaxRates()
        this.taxRates = response.results
        loader.hide()
      }
    },
    async loadData() {
      let loader = this.loading.show();
      try {
        this.settings = await this.service.configDetail()
        if (this.settings.has_tokens) {
          await this.fetchTaxRates()
          await this.fetchCategories()
        }
        loader.hide()
      } catch(error) {
        console.error('error fetching data', error)
        errorToast(this.create, this.$trans('Error fetching data'))
        loader.hide()
      }
    },
    async fetchCategories() {
      let loader = this.loading.show()
      try {
        const response = await this.service.fetchProductCategories()
        this.productCategories = response.data.map((item) => {
          return {
            value: item.id,
            text: item.name
          }
        })
        loader.hide()
      } catch(error) {
        console.error('error fetching product categories', error)
        errorToast(this.create, this.$trans('Error fetching product categories'))
        loader.hide()
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
