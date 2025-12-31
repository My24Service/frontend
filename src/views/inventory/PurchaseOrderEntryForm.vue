<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="receipt"></b-icon>
          <span @click="cancelForm" class="backlink">{{ $trans('Entries') }}</span> /
          <span v-if="isCreate">{{ $trans('New entry') }}</span>
          <span v-if="!isCreate">{{ $trans('Edit entry') }}</span>
        </h3>
        <b-button-toolbar>
          <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </b-button>
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </b-button>
        </b-button-toolbar>
      </div>
    </header>
    <div class='page-details panel'>
      <b-overlay :show="isLoading" rounded="sm">
        <div class="container app-form">
          <b-form>

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
              <b-col cols="3" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Default location')"
                  label-for="purchaseorder-entry-default-location"
                >
                  <b-form-select
                    id="purchaseorder-entry-default-location"
                    v-model="defaultLocation"
                    :options="stockLocations"
                    size="sm"
                    value-field="id"
                    text-field="name"
                  ></b-form-select>
                </b-form-group>
              </b-col>
            </b-row>

            <div class="entry-materials">
              <h4>{{ $trans('Products') }}</h4>
              <b-row>
                <b-col cols="12">
                  <b-table
                    v-if="purchaseorderEntries.length > 0"
                    small
                    :fields="entriesFields"
                    :items="purchaseorderEntries" responsive="md"
                  >
                    <template #cell(entry_date)="data">
                      {{ formatEntryDate(data.item.entry_date) }}
                    </template>
                    <template #cell(icons)="data">
                      <div class="float-right">
                        <b-link class="h5 mx-2" @click="editEntry(data.item, data.index)">
                          <b-icon-pencil></b-icon-pencil>
                        </b-link>
                        <b-link class="h5 mx-2" @click.prevent="deleteEntry(data.index)">
                          <b-icon-trash></b-icon-trash>
                        </b-link>
                      </div>
                    </template>
                  </b-table>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Product')"
                    label-for="purchaseorder-entry-material-search"
                  >
                    <multiselect
                      id="purchaseorder-entry-material-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="purchaseOrderMaterials"
                      :multiple="false"
                      :internal-search="true"
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
                      {{ $trans('Please select a product') }}
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
                      v-model="entry.purchase_order_material_view.name"
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
                      v-model="entry.ordered_amount"
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
                      v-model="entry.purchase_order_material_view.unit"
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
                      ref="amount"
                      v-model="entry.amount"
                      id="purchaseorder-entry-amount"
                      size="sm"
                      :state="isSubmitClicked ? !v$.entry.amount.$error : null"
                    ></b-form-input>
                    <b-form-invalid-feedback
                      :state="isSubmitClicked ? !v$.entry.amount.$error : null">
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
                      v-model="entry.entry_date"
                      v-bind:placeholder="$trans('Choose a date')"
                      value="purchaseorderEntry.entry_date"
                      locale="nl"
                      :state="isSubmitClicked ? !v$.entry.entry_date.$error : null"
                      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                    ></b-form-datepicker>
                    <b-form-invalid-feedback
                      :state="isSubmitClicked ? !v$.entry.entry_date.$error : null">
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
                      v-model="entry.stock_location"
                      :options="stockLocations"
                      size="sm"
                      value-field="id"
                      text-field="name"
                    ></b-form-select>
                  </b-form-group>
                </b-col>
              </b-row>
              <footer class="modal-footer">
                <b-button
                  @click="cancelEditEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {{ $trans('Cancel') }}
                </b-button>
                &nbsp;
                <b-button
                  v-if="isEditEntry"
                  @click="doEditEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="warning">
                  {{ $trans('Edit entry') }}
                </b-button>
                <b-button
                  v-if="!isEditEntry"
                  @click="addEntry"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="!isEntryValid"
                >
                  {{ $trans('Add entry') }}
                </b-button>
              </footer>
            </div>

            <div class="mx-auto">
              <footer class="modal-footer">

              </footer>
            </div>
          </b-form>
        </div>
      </b-overlay>
    </div>

  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'
import moment from 'moment'

import purchaseorderEntryModel from '../../models/inventory/PurchaseOrderEntry.js'
import purchaseOrderModel from '../../models/inventory/PurchaseOrder.js'
import stockLocationModel from '../../models/inventory/StockLocation.js'
import materialModel from '../../models/inventory/Material.js'

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
      entry: purchaseorderEntryModel.getFields(),
      purchaseorderEntries: [],
      errorMessage: null,
      defaultLocation: null,

      stockLocations: [],

      purchaseOrders: [],
      selectedPurchaseOrder: {},

      entriesFields: [
        { key: 'purchase_order_material_view.name', label: this.$trans('Name') },
        { key: 'purchase_order_material_view.unit', label: this.$trans('Unit') },
        { key: 'ordered_amount', label: this.$trans('Ordered amount') },
        { key: 'amount', label: this.$trans('Entry amount') },
        { key: 'entry_date', label: this.$trans('Date') },
        { key: 'stock_location_name', label: this.$trans('Location') },
        { key: 'icons', label: '' }
      ],
      editIndex: null,
      isEditEntry: false,
      deletedEntries: [],

      purchaseOrderMaterials: [],
      selectedPurchaseOrderMaterial: {
        material_view: materialModel.getFields()
      },
    }
  },
  watch: {
    defaultLocation: function(val) {
      const location = this.stockLocations.find(material => material.id === val)
      for (const entry of this.purchaseorderEntries) {
        entry.stock_location = location.id
        entry.stock_location_name = location.name
      }
    }
  },
  validations: {
    entry: {
      purchase_order_material: {
        required
      },
      entry_date: {
        required,
      },
      amount: {
        required,
        greaterThanZero
      },
    },
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
    },
    isEntryValid() {
      this.v$.entry.purchase_order_material.$touch()
      this.v$.entry.entry_date.$touch()
      return !this.v$.entry.amount.$invalid && !this.v$.entry.purchase_order_material.$invalid;
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
        this.purchaseOrderMaterials = data.materials
        this.createEntries(data.materials)

        this.isLoading = false
      } catch(error) {
        console.log('Error fetching purchase order products', error)
        errorToast(create, this.$trans('Error fetching purchase order products'))
        this.isLoading = false
      }
    },
    // entries
    formatEntryDate(entry_date) {
      return moment(entry_date).format('YYYY-MM-DD')
    },
    deleteEntry(index) {
      this.deletedEntries.push(this.purchaseorderEntries[index])
      this.purchaseorderEntries.splice(index, 1)
    },
    editEntry(item, index) {
      this.editIndex = index
      this.isEditEntry = true

      this.entry = item
    },
    emptyEntry() {
      this.entry = purchaseorderEntryModel.getFields()
    },
    cancelEditEntry() {
      this.isEditEntry = false
      this.emptyEntry()
    },
    doEditEntry() {
      const location = this.stockLocations.find(location => location.id === this.entry.stock_location)
      this.entry.stock_location_name = location ? location.name : ""
      this.purchaseorderEntries.splice(this.editIndex, 1, this.entry)
      this.editIndex = null
      this.isEditEntry = false
      this.emptyEntry()
    },
    addEntry() {
      if (!this.isEntryValid) {
        return
      }
      this.purchaseorderEntries.push(this.entry)
      this.emptyEntry()
      this.v$.$reset()
    },
    createEntries(materials) {
      this.purchaseorderEntries = []

      for (const material of materials) {
        let entry = purchaseorderEntryModel.getFields();
        entry.purchase_order_material_view = material.material_view
        entry.purchase_order = this.purchaseorderEntry.purchase_order;
        entry.purchase_order_material = material.id
        entry.amount = material.amount
        entry.ordered_amount = material.amount
        this.purchaseorderEntries.push(entry)
      }
    },
    // purchase orders
    async getPurchaseOrders(query) {
      this.isLoading = true

      try {
        purchaseOrderModel.setSearchQuery(query)
        const data = await purchaseOrderModel.list()
        this.purchaseOrders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching purchase orders', error)
        errorToast(create, this.$trans('Error fetching purchase orders'))
        this.isLoading = false
      }
    },
    purchaseOrderLabel (purchaseOrder) {
      return `${purchaseOrder.purchase_order_id} - ${purchaseOrder.order_name}, ${purchaseOrder.order_city} (materials: ${purchaseOrder.num_materials})`
    },

    // materials
    selectPurchaseOrderMaterial(option) {
      this.purchaseorderEntry.purchase_order_material = option.id
      this.selectedPurchaseOrderMaterial = option
      this.$refs.amount.focus()
    },
    purchaseOrderMaterialLabel(purchaseOrderMaterial) {
      return `${purchaseOrderMaterial.material_view.name} (ordered: ${purchaseOrderMaterial.amount}, entries: ${purchaseOrderMaterial.num_entries})`
    },

    // rest
    async submitForm() {
      this.submitClicked = true

      this.isLoading = true
      this.buttonDisabled = true

      if (this.isCreate) {
        try {
          for (const entry of this.purchaseorderEntries) {
            await purchaseorderEntryModel.insert(entry)
            infoToast(create, this.$trans('Created'), this.$trans('Entry has been created'))
          }
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating entry', error)
          errorToast(create, this.$trans('Error creating entry'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      this.v$.$touch()
      if (this.v$.$invalid) {
        return
      }

      // remove null fields
      const null_fields = ['stock_location']
      for (let i=0; i<null_fields.length; i++) {
        if (this.purchaseorderEntry[null_fields[i]] === null) {
          delete this.purchaseorderEntry[null_fields[i]]
        }
      }

      try {
        await purchaseorderEntryModel.update(this.pk, this.purchaseorderEntry)
        infoToast(create, this.$trans('Updated'), this.$trans('Entry has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating entry', error)
        errorToast(create, this.$trans('Error updating entry'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.entry = await purchaseorderEntryModel.detail(this.pk)
        this.entry.purchase_order_material_view = {
          'name': this.entry.material_name,
          "unit": "",
        }

        this.isLoading = false
      } catch(error) {
        console.log('error fetching entry', error)
        errorToast(create, this.$trans('Error fetching entry'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
