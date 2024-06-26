<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="file-earmark-medical"></b-icon>
          <span class="backlink" @click="cancelForm">{{ $trans('Purchase orders') }}</span> /
          <span v-if="isCreate">{{ $trans('New purchase order') }}</span>
          <span v-if="!isCreate">{{ $trans('Edit purchase order') }}</span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </b-button>
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </b-button>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">

          <b-form class="flex-columns">
            <div class="panel col-1-3">
              <h6>{{ $trans('Supplier') }}</h6>
              <b-row v-if="isCreate">
                <b-col cols="6" role="group">
                  <b-form-group
                    label-size="sm"
                    label-class="form-group-no-bottom"
                    v-bind:label="$trans('Search suppliers')"
                    label-for="purchaseorder-supplier-search"
                  >
                    <multiselect
                      id="purchaseorder-supplier-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                      :options="suppliersSearch"
                      :multiple="false"
                      :loading="isLoading"
                      :internal-search="false"
                      :clear-on-select="true"
                      :close-on-select="true"
                      :options-limit="30"
                      :limit="10"
                      :max-height="600"
                      :show-no-results="false"
                      :hide-selected="true"
                      @search-change="getSuppliers"
                      @select="selectSupplier"
                      :custom-label="supplierLabel"
                    >
                      <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                    </multiselect>
                  </b-form-group>
                </b-col>
                <b-col cols="6" role="group">
                  <b-form-group
                    label-size="sm"
                    label-class="form-group-no-bottom"
                    v-bind:label="$trans('Search reservations')"
                    label-for="purchaseorder-reservation-search"
                  >
                    <multiselect
                      id="purchaseorder-reservation-search"
                      track-by="id"
                      :placeholder="$trans('Type to search')"
                      open-direction="bottom"
                    supplier :options="reservationsSearch"
                      :multiple="false"
                      :loading="isLoading"
                      :internal-search="false"
                      :clear-on-select="true"
                      :close-on-select="true"
                      :options-limit="30"
                      :limit="10"
                      :max-height="600"
                      :show-no-results="false"
                      :hide-selected="true"
                      @search-change="getReservations"
                      @select="selectReservation"
                      :custom-label="reservationLabel"
                    >
                      <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                    </multiselect>
                  </b-form-group>
                </b-col>
              </b-row>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Name')"
                  label-for="purchaseorder_name"
                >
                  <b-form-input
                    readonly
                    v-model="purchaseOrder.order_name"
                    id="purchaseorder_name"
                    size="sm"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Address')"
                  label-for="purchaseorder_address"
                >
                  <b-form-input
                    readonly
                    id="purchaseorder_address"
                    size="sm"
                    v-model="purchaseOrder.order_address"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Postal')"
                  label-for="purchaseorder_postal"
                >
                  <b-form-input
                    readonly
                    id="purchaseorder_postal"
                    size="sm"
                    v-model="purchaseOrder.order_postal"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('City')"
                  label-for="purchaseorder_city"
                >
                  <b-form-input
                    readonly
                    id="purchaseorder_city"
                    size="sm"
                    v-model="purchaseOrder.order_city"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Country')"
                  label-for="purchaseorder_country_code"
                >
                  <b-form-input
                    readonly
                    id="purchaseorder_city"
                    size="sm"
                    v-model="purchaseOrder.order_country_code"
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.supplier.$error : null">
                    {{ chooseErrorText }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Reference')"
                  label-for="purchaseorder_reference"
                >
                  <b-form-input
                    id="purchaseorder_reference"
                    size="sm"
                    v-model="purchaseOrder.order_reference"
                  ></b-form-input>
                </b-form-group>

                <b-form-group
                  readonly
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Mobile')"
                  label-for="order_mobile"
                >
                  <b-form-input
                    id="order_mobile"
                    size="sm"
                    v-model="purchaseOrder.order_mobile"
                  ></b-form-input>
                </b-form-group>


                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Tel.')"
                  label-for="order_tel"
                >
                  <b-form-input
                    id="order_tel"
                    size="sm"
                    v-model="purchaseOrder.order_tel"
                  ></b-form-input>
                </b-form-group>

                <b-form-group
                  label-size="sm"
                  label-cols="3"
                  v-bind:label="$trans('Expected entry date')"
                  label-for="expected_entry_date"
                >
                  <b-form-datepicker
                    id="expected_entry_date"
                    size="sm"
                    class="p-sm-0"
                    v-model="purchaseOrder.expected_entry_date"
                    v-bind:placeholder="$trans('Choose a date')"
                    value="purchaseOrder.expected_entry_date"
                    locale="nl"
                    :state="isSubmitClicked ? !v$.purchaseOrder.expected_entry_date.$error : null"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                  ></b-form-datepicker>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.purchaseOrder.expected_entry_date.$error : null">
                    {{ $trans('Please enter a date') }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <hr>


                  <b-form-group
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Contacts')"
                    label-for="purchaseorder_contact"
                  >
                    <b-form-textarea
                      id="purchaseorder_contact"
                      v-model="purchaseOrder.order_contact"
                      rows="2"
                    ></b-form-textarea>
                  </b-form-group>

                  <b-form-group
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Description')"
                    label-for="purchaseorder_description"
                  >
                    <b-form-textarea
                      id="purchaseorder_description"
                      v-model="purchaseOrder.description"
                      rows="2"
                    ></b-form-textarea>
                  </b-form-group>

                  <b-form-group
                    label-size="sm"
                    label-cols="3"
                    v-bind:label="$trans('Supplier remarks')"
                    label-for="supplier_remarks"
                  >
                    <b-form-textarea
                      id="supplier_remarks"
                      v-model="purchaseOrder.supplier_remarks"
                      rows="2"
                    ></b-form-textarea>
                  </b-form-group>

            </div>

            <div class="panel col-2-3">
              <div class="purchaseorder-materials" v-if="purchaseOrder.order_name">
                <h6>{{ $trans('Products') }}</h6>
                <b-row>
                  <b-col cols="12">
                    <b-table
                      v-if="purchaseOrder.materials.length > 0"
                      small
                      :fields="materialFields"
                      :items="purchaseOrder.materials" responsive="md"
                    >
                      <template #cell(icons)="data">
                        <div class="float-right">
                          <b-link class="h5 mx-2" @click="editMaterial(data.item, data.index)">
                            <b-icon-pencil></b-icon-pencil>
                          </b-link>
                          <b-link class="h5 mx-2" @click.prevent="deleteMaterial(data.index)">
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
                      v-bind:label="$trans('Search product')"
                    >
                      <multiselect
                        id="purchaseorder-material-name"
                        track-by="id"
                        label="name"
                        :placeholder="$trans('Type to search')"
                        open-direction="bottom"
                        :options="materialsSearch"
                        :multiple="false"
                        :loading="isLoading"
                        :internal-search="false"
                        :clear-on-select="true"
                        :close-on-select="true"
                        :options-limit="30"
                        :limit="10"
                        :max-height="600"
                        :show-no-results="false"
                        :hide-selected="true"
                        @search-change="getMaterials"
                        @select="selectMaterial"
                      >
                        <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                      </multiselect>
                    </b-form-group>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4" role="group">
                    <b-form-group
                      label-size="sm"
                      v-bind:label="$trans('Name')"
                      label-for="purchaseorder-material-name"
                    >
                      <b-form-input
                        readonly
                        id="purchaseorder-material-name"
                        size="sm"
                        v-model="material.material_view.name"
                      ></b-form-input>
                      <b-form-invalid-feedback
                        :state="!v$.material.material.$error">
                        {{ $trans('Please select a product') }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </b-col>
                  <b-col cols="4" role="group">
                    <b-form-group
                      label-size="sm"
                      v-bind:label="$trans('Amount')"
                      label-for="purchaseorder-material-amount"
                    >
                      <b-form-input
                        ref="amount"
                        id="purchaseorder-material-amount"
                        size="sm"
                        v-model="material.amount"
                      ></b-form-input>
                      <b-form-invalid-feedback
                        :state="!v$.material.amount.$error">
                        {{ $trans('Please enter an amount') }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </b-col>
                  <b-col cols="4" role="group">
                    <b-form-group
                      label-size="sm"
                      v-bind:label="$trans('Remarks')"
                      label-for="purchaseorder-material-remarks"
                    >
                      <b-form-textarea
                        id="purchaseorder-material-remarks"
                        v-model="material.remarks"
                        rows="1"
                      ></b-form-textarea>
                    </b-form-group>
                  </b-col>
                </b-row>
                <footer class="modal-footer">
                  <b-button
                    @click="cancelEditMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {{ $trans('Cancel') }}
                  </b-button>
                  &nbsp;
                  <b-button
                    v-if="isEditMaterial"
                    @click="doEditMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="warning">
                    {{ $trans('Edit product') }}
                  </b-button>
                  <b-button
                    v-if="!isEditMaterial"
                    @click="addMaterial"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="primary"
                    :disabled="!isMaterialValid"
                  >
                    {{ $trans('Add product') }}
                  </b-button>
                </footer>
              </div>
              <div v-else>
                <h6>{{ $trans("Products") }}</h6>
                <h3 class="dimmed">{{ $trans("Select a supplier or reservation") }}</h3>
              </div>
            </div>
          </b-form>

      </b-overlay>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import Multiselect from 'vue-multiselect'

import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import purchaseOrderMaterialModel from '@/models/inventory/PurchaseOrderMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'

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
    reservation_pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      chooseErrorText: this.$trans('Please select a supplier or reservation'),
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      purchaseOrder: purchaseOrderModel.getFields(),
      material: purchaseOrderMaterialModel.getFields(),
      errorMessage: null,

      suppliersSearch: [],
      selectedSupplier: null,

      reservationsSearch: [],
      selectedReservation: null,

      editIndex: null,
      isEditMaterial: false,
      materialFields: [
        { key: 'material_view.name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      materialsSearch: [],
      deletedMaterials: []
    }
  },
  validations() {
    return {
      purchaseOrder: {
        supplier: {
          required,
        },
        expected_entry_date: {
          required,
        },
      },
      material: {
        material: {
          required
        },
        amount: {
          required,
          greaterThanZero
        },
      }
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    isMaterialValid() {
      this.v$.material.material.$touch()
      this.v$.material.amount.$touch()
      return !this.v$.material.amount.$invalid && !this.v$.material.material.$invalid;
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    try {
      this.countries = await this.$store.dispatch('getCountries')

      if (!this.isCreate) {
        return this.loadOrder()
      } else {
        this.purchaseOrder = purchaseOrderModel.getFields()
      }

      await this.getSuppliers('')
    } catch {
      this.errorToast(this.$trans('Error fetching countries'))
      this.buttonDisabled = false
    }
  },
  methods: {
    // materials
    deleteMaterial(index) {
      this.deletedMaterials.push(this.purchaseOrder.materials[index])
      this.purchaseOrder.materials.splice(index, 1)
    },
    editMaterial(item, index) {
      this.editIndex = index
      this.isEditMaterial = true

      this.material = item
    },
    emptyMaterial() {
      this.material = purchaseOrderMaterialModel.getFields()
    },
    cancelEditMaterial() {
      this.isEditMaterial = false
      this.emptyMaterial()
    },
    doEditMaterial() {
      this.purchaseOrder.materials.splice(this.editIndex, 1, this.material)
      this.editIndex = null
      this.isEditMaterial = false
      this.emptyMaterial()
    },
    addMaterial() {
      if (!this.isMaterialValid) {
        return
      }
      this.purchaseOrder.materials.push(this.material)
      this.emptyMaterial()
      this.v$.$reset()
    },
    selectMaterial(option) {
      this.material.material = option.id
      this.material.material_view.name = option.name
      if (!this.isEditMaterial) {
        this.material.amount = 0
        this.material.remarks = ''
      }
      this.v$.material.material.$touch()
      this.v$.material.amount.$touch()
      this.$refs.amount.focus()
    },
    materialLabel(material) {
      return `${material.name}`
    },
    async getMaterials(query) {
      if (!this.purchaseOrder.supplier) {
        return
      }

      this.isLoading = true

      try {
        this.materialsSearch = await materialModel.search(query, this.purchaseOrder.supplier)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching materials', error)
        this.errorToast(this.$trans('Error fetching products'))
        this.isLoading = false
      }
    },

    // suppliers
    async getSuppliers(query) {
      this.isLoading = true
      try {
        this.suppliersSearch = await supplierModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching suppliers', error)
        this.errorToast(this.$trans('Error fetching suppliers'))
        this.isLoading = false
      }
    },
    supplierLabel ({ name, city }) {
      return `${name} - ${city}`
    },
    selectSupplier(option) {
      this.purchaseOrder.supplier = option.id
      this.purchaseOrder.order_name = option.name
      this.purchaseOrder.order_address = option.address
      this.purchaseOrder.order_city = option.city
      this.purchaseOrder.order_postal = option.postal
      this.purchaseOrder.order_country_code = option.country_code
      this.purchaseOrder.order_tel = option.tel
      this.purchaseOrder.order_mobile = option.mobile
      this.purchaseOrder.order_email = option.email
      this.purchaseOrder.order_contact = option.contact
      this.purchaseOrder.supplier_remarks = option.remarks
      this.purchaseOrder.materials = []

      this.getMaterials('')
    },

    // reservations
    async getReservations(query) {
      this.isLoading = true
      try {
        this.reservationsSearch = await supplierReservationModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error searching reservations', error)
        this.errorToast(this.$trans('Error searching reservations'))
        this.isLoading = false
      }
    },
    reservationLabel ({ supplier }) {
      return `${supplier.name}`
    },
    selectReservation(option) {
      this.purchaseOrder.supplier_reservation = option.id
      this.purchaseOrder.supplier = option.supplier.id
      this.purchaseOrder.order_name = option.supplier.name
      this.purchaseOrder.order_address = option.supplier.address
      this.purchaseOrder.order_city = option.supplier.city
      this.purchaseOrder.order_postal = option.supplier.postal
      this.purchaseOrder.order_country_code = option.supplier.country_code
      this.purchaseOrder.order_tel = option.supplier.tel
      this.purchaseOrder.order_mobile = option.supplier.mobile
      this.purchaseOrder.order_email = option.supplier.email
      this.purchaseOrder.order_contact = option.supplier.contact
      this.purchaseOrder.supplier_remarks = option.supplier.remarks

      this.purchaseOrder.materials = option.products
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.purchaseOrder.supplier.$touch()
      if (this.v$.purchaseOrder.supplier.$invalid) {
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        delete this.purchaseOrder.purchase_order_id

        try {
          const purchase_order = await purchaseOrderModel.insert(this.purchaseOrder)

          for (let material of this.purchaseOrder.materials) {
            material.purchase_order = purchase_order.id
            await purchaseOrderMaterialModel.insert(material)
          }

          this.infoToast(this.$trans('Created'), this.$trans('Purchase order has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating purchase order', error)
          this.errorToast(this.$trans('Error creating purchase order'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await purchaseOrderModel.update(this.pk, this.purchaseOrder)
        this.infoToast(this.$trans('Updated'), this.$trans('Purchase order has been updated'))

        for (let material of this.purchaseOrder.materials) {
          material.purchase_order = this.pk
          if (material.id) {
            await purchaseOrderMaterialModel.update(material.id, material)
            this.infoToast(this.$trans('Product updated'), this.$trans('Purchase order product has been updated'))
          } else {
            await purchaseOrderMaterialModel.insert(material)
            this.infoToast(this.$trans('Product created'), this.$trans('Purchase order product has been created'))
          }
        }

        for (const material of this.deletedMaterials) {
          if (material.id) {
            await purchaseOrderMaterialModel.delete(material.id)
            this.infoToast(this.$trans('Product removed'), this.$trans('Purchase order product has been removed'))
          }
        }

        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating purchase order', error)
        this.errorToast(this.$trans('Error updating purchase order'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadOrder() {
      this.isLoading = true
      let expected_entry_date

      try {
        this.purchaseOrder = await purchaseOrderModel.detail(this.pk)
        expected_entry_date = this.$moment(this.purchaseOrder.expected_entry_date, 'DD/MM/YYYY')
        this.purchaseOrder.expected_entry_date = expected_entry_date.toDate()
        this.isLoading = false

        await this.getMaterials('')
      } catch(error) {
        console.log('error fetching purchase order', error)
        this.errorToast(this.$trans('Error fetching purchase order'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
