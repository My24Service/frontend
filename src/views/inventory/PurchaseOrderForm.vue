<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New purchase order') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit purchase order') }}</h2>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              label-class="form-group-no-bottom"
              v-bind:label="$trans('Search existing address')"
              label-for="purchaseorder-supplier-search"
            >
              <multiselect
                id="purchaseorder-supplier-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="suppliers"
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
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="purchaseorder_reference"
            >
              <b-form-input
                id="purchaseorder_reference"
                size="sm"
                v-model="purchaseOrder.order_reference"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
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
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Supplier')"
              label-for="purchaseorder_name"
            >
              <b-form-input
                v-model="purchaseOrder.order_name"
                id="purchaseorder_name"
                size="sm"
                :state="isSubmitClicked ? !v$.purchaseOrder.order_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseOrder.order_name.$error : null">
                {{ $trans('Please enter a supplier') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
            >
              <b-form-input
                id="order_mobile"
                size="sm"
                v-model="purchaseOrder.order_mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="order_tel"
            >
              <b-form-input
                id="order_tel"
                size="sm"
                v-model="purchaseOrder.order_tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="purchaseorder_address"
            >
              <b-form-input
                id="purchaseorder_address"
                size="sm"
                v-model="purchaseOrder.order_address"
                :state="isSubmitClicked ? !v$.purchaseOrder.order_address.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseOrder.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="purchaseorder_postal"
            >
              <b-form-input
                id="purchaseorder_postal"
                size="sm"
                v-model="purchaseOrder.order_postal"
                :state="isSubmitClicked ? !v$.purchaseOrder.order_postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseOrder.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="purchaseorder_city"
            >
              <b-form-input
                id="purchaseorder_city"
                size="sm"
                v-model="purchaseOrder.order_city"
                :state="isSubmitClicked ? !v$.purchaseOrder.order_city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.purchaseOrder.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="purchaseorder_country_code"
            >
              <b-form-select v-model="purchaseOrder.order_country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="purchaseorder_contact"
            >
              <b-form-textarea
                id="purchaseorder_contact"
                v-model="purchaseOrder.order_contact"
                rows="2"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="purchaseorder_description"
            >
              <b-form-textarea
                id="purchaseorder_description"
                v-model="purchaseOrder.description"
                rows="2"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Supplier remarks')"
              label-for="supplier_remarks"
            >
              <b-form-textarea
                id="supplier_remarks"
                v-model="purchaseOrder.supplier_remarks"
                rows="2"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="purchaseorder-materials">
          <h4>{{ $trans('Materials') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table
                v-if="purchaseOrder.purchase_order_materials.length > 0"
                small
                :fields="materialFields"
                :items="purchaseOrder.purchase_order_materials" responsive="md"
              >
                <template #cell(icons)="data">
                  <div v-if="data.item.num_entries === 0" class="float-right">
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
                v-bind:label="$trans('Search material')"
              >
                <multiselect
                  id="purchaseorder-material-name"
                  track-by="id"
                  label="name"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="materials"
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
                  v-model="material_name"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Amount')"
                label-for="purchaseorder-material-amount"
              >
                <b-form-input
                  id="purchaseorder-material-amount"
                  size="sm"
                  v-model="amount"
                ></b-form-input>
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
                  v-model="remarks"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <b-button v-if="isEditMaterial" @click="doEditMaterial" class="btn btn-primary" size="sm" type="button" variant="warning">
              {{ $trans('Edit material') }}
            </b-button>
            <b-button v-if="!isEditMaterial" @click="addMaterial" class="btn btn-primary" size="sm" type="button" variant="primary">
              {{ $trans('Add material') }}
            </b-button>
          </footer>
        </div>

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
import moment from 'moment'
import Multiselect from 'vue-multiselect'

import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'

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
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      purchaseOrder: purchaseOrderModel.getFields(),
      errorMessage: null,
      suppliers: [],
      supplierSearch: '',
      selectedSupplier: null,
      editIndex: null,
      isEditMaterial: false,
      material: null,
      material_name: '',
      amount: '',
      remarks: '',
      materialFields: [
        { key: 'material_name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      materials: [],
      materialSearch: null
    }
  },
  validations: {
    purchaseOrder: {
      order_name: {
        required,
      },
      order_address: {
        required,
      },
      order_postal: {
        required,
      },
      order_city: {
        required,
      },
      expected_entry_date: {
        required,
      },
    },
  },
  computed: {
    isCreate() {
      return !this.pk && !this.reservation_pk
    },
    isCreateFromReservation() {
      return this.reservation_pk && !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    try {
      this.countries = await this.$store.dispatch('getCountries')

      if (this.isCreateFromReservation) {
        this.purchaseOrder.supplier_reservation = this.reservation_pk

        this.isLoading = true

        const reservation = await supplierReservationModel.detail(this.reservation_pk)

        this.selectSupplier(reservation.supplier_view)
        this.selectMaterial(reservation.material_view)
        this.isLoading = false
      } else {
        if (!this.isCreate) {
          return this.loadOrder()
        } else {
          this.purchaseOrder = purchaseOrderModel.getFields()
        }

        this.getSuppliers('')
      }
    } catch {
      this.errorToast(this.$trans('Error fetching countries'))
      this.buttonDisabled = false
    }
  },
  methods: {
    // materials
    deleteMaterial(index) {
      this.purchaseOrder.purchase_order_materials.splice(index, 1)
    },
    editMaterial(item, index) {
      this.editIndex = index
      this.isEditMaterial = true

      this.material = item.material
      this.material_name = item.material_name
      this.amount = item.amount
      this.remarks = item.remarks
    },
    emptyMaterial() {
      this.material = null
      this.material_name = null
      this.amount = null
      this.remarks = null
    },
    doEditMaterial() {
      const material = {
        material: this.material,
        material_name: this.material_name,
        amount: this.amount,
        remarks: this.remarks
      }
      this.purchaseOrder.purchase_order_materials.splice(this.editIndex, 1, material)
      this.editIndex = null
      this.isEditMaterial = false
      this.emptyMaterial()
    },
    addMaterial() {
      this.purchaseOrder.purchase_order_materials.push({
        material: this.material,
        material_name: this.material_name,
        amount: this.amount,
        remarks: this.remarks,
        num_entries: 0
      })
      this.emptyMaterial()
    },
    async getSuppliers(query) {
      this.isLoading = true
      try {
        this.suppliers = await supplierModel.search(query)
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
    async getMaterials(query) {
      if (!this.purchaseOrder.supplier) {
        return
      }

      this.isLoading = true

      try {
        this.materials = await materialModel.search(query, this.purchaseOrder.supplier)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching materials', error)
        this.errorToast(this.$trans('Error fetching materials'))
        this.isLoading = false
      }
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

      this.getMaterials('')
    },

    selectMaterial(option) {
      this.material = option.id
      this.material_name = option.name
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['expected_entry_date']
      for (let i=0; i<null_fields.length; i++) {
        if (this.purchaseOrder[null_fields[i]] === null) {
          delete this.purchaseOrder[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate || this.isCreateFromReservation) {
        delete this.purchaseOrder.purchase_order_id

        try {
          await purchaseOrderModel.insert(this.purchaseOrder)
          this.infoToast(this.$trans('Created'), this.$trans('Purchase order has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          if (this.isCreateFromReservation) {
            this.$router.push({name: 'supplier-reservation-list'})

            return
          }

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
        expected_entry_date = this.$moment(this.purchaseOrder.expected_entry_date, 'YYYY-MM-DD')
        this.purchaseOrder.expected_entry_date = expected_entry_date.toDate()
        this.isLoading = false

        this.getMaterials('')
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
