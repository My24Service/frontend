<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New entry') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit entry') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Purchase order')"
              label-for="purchaseorder-entry-order-search"
            >
              <multiselect
                id="purchaseorder-entry-order-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="purchaseOrders"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @search-change="getPurchaseOrders"
                @select="selectPurchaseOrder"
                :custom-label="purchaseOrderLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Order ID')"
              label-for="purchaseorder-entry-order-id"
            >
              <b-form-input
                v-model="selectedPurchaseOrder.purchase_order_id"
                id="purchaseorder-entry-order-id"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Supplier')"
              label-for="purchaseorder-entry-supplier"
            >
              <b-form-input
                v-model="selectedPurchaseOrder.order_name"
                id="purchaseorder-entry-supplier"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="purchaseorder-entry-city"
            >
              <b-form-input
                v-model="selectedPurchaseOrder.order_city"
                id="purchaseorder-entry-city"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="purchaseorder-entry-email"
            >
              <b-form-input
                v-model="selectedPurchaseOrder.order_email"
                id="purchaseorder-entry-email"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Expected entry date')"
              label-for="purchaseorder-entry-expected_entry_date"
            >
              <b-form-input
                v-model="selectedPurchaseOrder.expected_entry_date"
                id="purchaseorder-entry-expected_entry_date"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Material')"
              label-for="purchaseorder-entry-material-search"
            >
              <multiselect
                id="purchaseorder-entry-material-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="purchaseOrderMaterials"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @select="selectPurchaseOrderMaterial"
                :custom-label="purchaseOrderMaterialLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseorderEntry.purchase_order_material.$error : null">
                {{ $trans('Please select a material') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="purchaseorder-entry-material-name"
            >
              <b-form-input
                v-model="selectedPurchaseOrderMaterial.material_view.name"
                id="purchaseorder-entry-material-name"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Ordered')"
              label-for="purchaseorder-entry-material-amount"
            >
              <b-form-input
                v-model="selectedPurchaseOrderMaterial.amount"
                id="purchaseorder-entry-material-amount"
                readonly
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Unit')"
              label-for="purchaseorder-entry-material-unit"
            >
              <b-form-input
                v-model="selectedPurchaseOrderMaterial.material_view.unit"
                id="purchaseorder-entry-material-unit"
                size="sm"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Entry')"
              label-for="purchaseorder-entry-amount"
            >
              <b-form-input
                v-model="purchaseorderEntry.amount"
                id="purchaseorder-entry-amount"
                size="sm"
                :state="isSubmitClicked ? !v$.purchaseorderEntry.amount.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseorderEntry.amount.$error : null">
                {{ $trans('Please enter an amount') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Date')"
              label-for="purchaseorder-entry-date"
            >
              <b-form-datepicker
                id="purchaseorder-entry-date"
                size="sm"
                class="p-sm-0"
                v-model="purchaseorderEntry.entry_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="purchaseorderEntry.entry_date"
                locale="nl"
                :state="isSubmitClicked ? !v$.purchaseorderEntry.entry_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseorderEntry.entry_date.$error : null">
                {{ $trans('Please enter a date') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Move to location')"
              label-for="purchaseorder-entry-location"
            >
              <b-form-select
                id="purchaseorder-entry-location"
                v-model="purchaseorderEntry.stock_location"
                :options="stockLocations"
                size="sm"
                value-field="id"
                text-field="name"
              ></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import purchaseorderEntryModel from '@/models/inventory/PurchaseOrderEntry.js'
import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import stockLocationModel from '@/models/inventory/StockLocation.js'
import materialModel from '@/models/inventory/Material.js'

const greaterThanZero = (value) => parseInt(value) > 0

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      purchaseorderEntry: purchaseorderEntryModel.getFields(),
      errorMessage: null,

      stockLocations: [],

      purchaseOrders: [],
      selectedPurchaseOrder: {},

      purchaseOrderMaterials: [],
      selectedPurchaseOrderMaterial: {
        material_view: materialModel.getFields()
      },
    }
  },
  validations: {
    purchaseorderEntry: {
      purchase_order_material: {
        required,
      },
      amount: {
        required,
        greaterThanZero
      },
      entry_date: {
        required,
      },
    },
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
    this.getPurchaseOrders('')

    stockLocationModel.list().then((data) => {
      this.stockLocations = data.results

      if (!this.isCreate) {
        this.loadData()
      } else {
        this.purchaseorderEntry = purchaseorderEntryModel.getFields()
      }
    })
  },
  methods: {
    async selectPurchaseOrder(option) {
      this.purchaseorderEntry.purchase_order = option.id
      this.selectedPurchaseOrder = option

      this.isLoading = true
      try {
        const data = await purchaseOrderModel.detail(option.id)
        this.purchaseOrderMaterials = data.purchase_order_materials
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching purchase order materials', error)
        this.errorToast(this.$trans('Error fetching purchase order materials'))
        this.isLoading = false
      }
    },
    async getPurchaseOrders(query) {
      this.isLoading = true

      try {
        purchaseOrderModel.setSearchQuery(query)
        const data = await purchaseOrderModel.list()
        this.purchaseOrders = data.results
        this.isLoading = false
      } catch() {
        this.errorToast(this.$trans('Error fetching purchase orders'))
        this.isLoading = false
      }
    },
    purchaseOrderLabel (purchaseOrder) {
      return `${purchaseOrder.purchase_order_id} - ${purchaseOrder.order_name}, ${purchaseOrder.order_city} (materials: ${purchaseOrder.num_materials})`
    },
    selectPurchaseOrderMaterial(option) {
      this.purchaseorderEntry.purchase_order_material = option.id
      this.selectedPurchaseOrderMaterial = option
    },
    purchaseOrderMaterialLabel(purchaseOrderMaterial) {
      return `${purchaseOrderMaterial.material_name} (ordered: ${purchaseOrderMaterial.amount}, entries: ${purchaseOrderMaterial.num_entries})`
    },
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['stock_location']
      for (let i=0; i<null_fields.length; i++) {
        if (this.purchaseorderEntry[null_fields[i]] === null) {
          delete this.purchaseorderEntry[null_fields[i]]
        }
      }

      this.isLoading = true
      this.buttonDisabled = true

      if (this.isCreate) {
        try {
          await purchaseorderEntryModel.insert(this.purchaseorderEntry)
          this.infoToast(this.$trans('Created'), this.$trans('Entry has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch() {
          this.errorToast(this.$trans('Error creating entry'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await purchaseorderEntryModel.update(token, this.pk, this.purchaseorderEntry)
        this.infoToast(this.$trans('Updated'), this.$trans('Entry has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating entry', error)
        this.errorToast(this.$trans('Error updating entry'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.purchaseorderEntry = await purchaseorderEntryModel.detail(this.pk)
        this.selectedPurchaseOrder = purchaseorderEntry.purchase_order_material_view.purchase_order_view
        this.selectedPurchaseOrderMaterial = purchaseorderEntry.purchase_order_material_view
        this.isLoading = false
      } catch(error) {
        console.log('error fetching entry', error)
        this.errorToast(this.$trans('Error fetching entry'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
