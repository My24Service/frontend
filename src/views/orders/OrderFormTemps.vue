<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <b-row>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search existing address')"
              label-for="order-customer-search"
            >
              <VueMultiselect
                id="order-customer-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="customers"
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
                @search-change="getCustomers"
                @select="selectCustomer"
                :custom-label="customerLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </VueMultiselect>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start date')"
              label-for="start_date"
            >
              <VueDatePicker
                id="start_date"
                size="sm"
                class="p-sm-0"
                v-model="order.start_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="order.start_date"
                locale="nl"
                :state="isSubmitClicked ? !v$.order.start_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.start_date.$error : null">
                {{ $trans('Please enter a start date') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start time')"
              label-for="start_time"
            >
              <b-form-timepicker
                id="start_time"
                size="sm"
                v-model="order.start_time"
                placeholder="Choose a time"
                :hour12=false
              ></b-form-timepicker>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('End date')"
              label-for="end_date"
            >
              <VueDatePicker
                id="end_date"
                size="sm"
                v-model="order.end_date"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a date')"
                locale="nl"
                :state="isSubmitClicked ? !v$.order.end_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.end_date.$error : null">
                {{ $trans('Please enter an end date') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('End time')"
              label-class="p-sm-0"
              label-for="end_time"
            >
              <b-form-timepicker
                id="end_time"
                size="sm"
                v-model="order.end_time"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="order_name"
            >
              <BFormInput
                v-model="order.order_name"
                id="order_name"
                size="sm"
                :state="isSubmitClicked ? !v$.order.order_name.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_name.$error : null">
                {{ $trans('Please enter the customer') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-for="customer_id"
            >
              <BFormInput
                v-model="order.customer_id"
                readonly
                id="customer_id"
                size="sm"
                :state="isSubmitClicked ? !v$.order.customer_id.$error : null"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="order_address"
            >
              <BFormInput
                id="order_address"
                size="sm"
                v-model="order.order_address"
                :state="isSubmitClicked ? !v$.order.order_address.$error: null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
            >
              <BFormSelect v-model="order.order_country_code" :options="countries" size="sm"></BFormSelect>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
            >
              <BFormInput
                id="order_postal"
                size="sm"
                v-model="order.order_postal"
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="order_city"
            >
              <BFormInput
                id="order_city"
                size="sm"
                v-model="order.order_city"
                :state="isSubmitClicked ? !v$.order.order_city.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Order type')"
              label-for="order_type"
            >
              <OrderTypesSelect
                v-if="(!isCreate && !isLoading) || isCreate"
                :orderTypeIn="order.order_type"
                :order-type="order.order_type"
                :include-all="false"
              />
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Required users')"
              label-for="required_users"
            >
              <BFormInput
                id="required_users"
                size="sm"
                v-model="order.required_users"
              ></BFormInput>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="order_reference"
            >
              <BFormInput
                id="order_reference"
                size="sm"
                v-model="order.order_reference"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="order_email"
            >
              <BFormInput
                id="order_email"
                size="sm"
                v-model="order.order_email"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
            >
              <BFormInput
                id="order_mobile"
                size="sm"
                v-model="order.order_mobile"
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="order_tel"
            >
              <BFormInput
                id="order_tel"
                size="sm"
                v-model="order.order_tel"
              ></BFormInput>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
            >
              <BFormTextarea
                id="order_contact"
                v-model="order.order_contact"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
          <b-col cols="6" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Customer remarks')"
              label-for="customer_remarks"
            >
              <BFormTextarea
                id="customer_remarks"
                v-model="order.customer_remarks"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
        </b-row>

        <div class="order-orderlines">
          <h4>{{ $trans('Order lines') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table v-if="order.orderlines.length > 0" small :fields="orderLineFields" :items="order.orderlines" responsive="md">
                <template #cell()="data">
                  {{ data.value }}
                </template>
                <template #cell(icons)="data">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click="editOrderLine(data.item, data.index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteOrderLine(data.index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </template>
              </b-table>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Product')"
                label-for="order-orderline-product"
              >
                <BFormInput
                  id="order-orderline-product"
                  size="sm"
                  v-model="product"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Location')"
                label-for="order-orderline-location"
              >
                <BFormInput
                  id="order-orderline-location"
                  size="sm"
                  v-model="location"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Remarks')"
                label-for="order-orderline-remarks"
              >
                <BFormTextarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></BFormTextarea>
              </BFormGroup>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <BButton v-if="isEditOrderLine" @click="doEditOrderLine" class="btn btn-primary" size="sm" type="button" variant="warning">
              {{ $trans('Edit orderline') }}
            </BButton>
            <BButton v-if="!isEditOrderLine" @click="addOrderLine" class="btn btn-primary" size="sm" type="button" variant="primary">
              {{ $trans('Add orderline') }}
            </BButton>
          </footer>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer" v-if="!unaccepted">
            <BButton
              @click="cancelForm"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              @click="submitForm"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              variant="primary"
            >
              {{ $trans('Submit') }}
            </BButton>
          </footer>
          <footer class="modal-footer" v-if="!isCreate && (unaccepted || !order.customer_order_accepted)">
            <BButton
              @click="reject"
              class="btn btn-danger"
              type="button"
              variant="danger"
            >
              {{ $trans('Reject') }}
            </BButton>
            <BButton
              @click="editAndAccept"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              variant="primary"
            >
              {{ $trans('Edit and accept') }}
            </BButton>
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
import VueMultiselect from 'vue-multiselect'

import {OrderService} from '@/models/orders/Order.js'
import customerModel from '@/models/customer/Customer.js'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import orderlineModel from "../../models/orders/Orderline";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";


export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    return {
      v$: useVuelidate(),
      create,
      mainStore
    }
  },
  components: {
    VueMultiselect,
    OrderTypesSelect
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    unaccepted: {
      type: [Boolean],
      default: false
    },
  },
  watch: {
    startDate(val) {
      if (new Date(this.endDate) < new Date(val)) {
        this.order.end_date = val
      }
    },
    endDate(val) {
      if (new Date(val) < new Date(this.startDate)) {
        this.order.start_date = val
      }
    }
  },
  data () {
    return {
      isLoading: false,
      buttonDisabled: false,
      editIndex: null,
      isEditOrderLine: false,
      product: '',
      location: '',
      remarks: '',
      orderLineFields: [
        { key: 'product', label: $trans('Product') },
        { key: 'location', label: $trans('Location') },
        { key: 'remarks', label: $trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      submitClicked: false,
      countries: [],
      orderTypes: [],
      order: new OrderModel({}),
      service: new OrderService(),
      errorMessage: null,
      customers: [],
      customerSearch: '',
      selectedCustomer: null,
      deletedOrderlines: [],
      acceptOrder: false,
    }
  },
  validations() {
    return {
      order: {
        customer_id: {
          required,
        },
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
        start_date: {
          required,
        },
        end_date: {
          required,
        },
      }
    }
  },
  computed: {
    startDate() {
      return this.order.start_date
    },
    endDate() {
      return this.order.end_date
    },
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.countries = this.mainStore.getCountries
    this.orderTypes = await this.mainStore.getOrderTypes

    if (this.isCreate) {
      this.order = new OrderModel({})
      await this.getCustomers('')
    } else {
      await this.loadOrder()
    }
  },
  methods: {
    // order lines
    deleteOrderLine(index) {
      this.deletedOrderlines.push(this.order.orderlines[index])
      this.order.orderlines.splice(index, 1)
    },
    editOrderLine(item, index) {
      this.editIndex = index
      this.isEditOrderLine = true

      this.product = item.product
      this.location = item.location
      this.remarks = item.remarks
    },
    emptyOrderLine() {
      this.product = ''
      this.location = ''
      this.remarks = ''
    },
    doEditOrderLine() {
      const orderLine = {
        product: this.product,
        location: this.location,
        remarks: this.remarks
      }
      this.order.orderlines.splice(this.editIndex, 1, orderLine)
      this.editIndex = null
      this.isEditOrderLine = false
      this.emptyOrderLine()
    },
    addOrderLine() {
      this.order.orderlines.push({
        product: this.product,
        location: this.location,
        remarks: this.remarks
      })
      this.emptyOrderLine()
    },

    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },

    selectCustomer(option) {
      this.order.customer_id = option.customer_id
      this.order.order_name = option.name
      this.order.order_address = option.address
      this.order.order_city = option.city
      this.order.order_postal = option.postal
      this.order.order_country_code = option.country_code
      this.order.order_tel = option.tel
      this.order.order_mobile = option.mobile
      this.order.order_email = option.email
      this.order.order_contact = option.contact
      this.order.customer_remarks = option.remarks
    },
    async editAndAccept() {
      this.buttonDisabled = true
      this.acceptOrder = true
      await this.submitForm()
    },
    async reject() {
      await this.orderService.setRejected(this.pk)
      this.cancelForm()
    },
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['start_time', 'end_time', 'maintenanceproduct_relation']
      for (let i=0; i<null_fields.length; i++) {
        if (this.order[null_fields[i]] === null) {
          delete this.order[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          const orderlines = this.order.orderlines
          this.order.orderlines = []

          const newOrder = await this.orderService.insert(this.order)

          // add orderlines
          try {
            for (const orderline of orderlines) {
              orderline.order = newOrder.id
              await orderlineModel.insert(orderline)
            }
          } catch(error) {
            console.log('Error creating infolines', error)
          }

          infoToast(this.create, $trans('Created'), $trans('Order has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          if (confirm(($trans('Do you want to add documents to this order?')))) {
            await this.$router.push({name: 'order-document-add', params: {orderPk: order.id}})
          } else {
            this.$router.go(-1)
          }
        } catch(error) {
          console.log('Error creating order', error)
          errorToast(this.create, $trans('Error creating order'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        const orderlines = this.order.orderlines
        this.order.orderlines = []

        await orderModel.update(this.pk, this.order)

        // orderlines create/update
        for (let orderline of orderlines) {
          orderline.order = this.pk
          if (orderline.id) {
            await orderlineModel.update(orderline.id, orderline)
            // infoToast(this.create, $trans('Orderline updated'), $trans('Orderline has been updated'))
          } else {
            await orderlineModel.insert(orderline)
            // infoToast(this.create, $trans('Orderline created'), $trans('Orderline has been created'))
          }
        }

        // orderlines delete
        for (const orderline of this.deletedOrderlines) {
          if (orderline.id) {
            await orderlineModel.delete(orderline.id)
            // infoToast(this.create, $trans('Orderline removed'), $trans('Orderline has been removed'))
          }
        }

        infoToast(this.create, $trans('Updated'), $trans('Order has been updated'))
        this.isLoading = false
        this.buttonDisabled = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating order', error)
        errorToast(this.create, $trans('Error updating order'))
        this.isLoading = false
        this.buttonDisabled = false
      }

      if (this.acceptOrder) {
        try {
          await this.orderService.setAccepted(this.pk)

          infoToast(this.create, $trans('Accepted'), $trans('Order has been accepted'))
        } catch(error) {
          console.log('Error accepting order', error)
          errorToast(this.create, $trans('Error accepting order'))
        }
      }

    },
    async getCustomers(query) {
      this.isLoading = true

      try {
        this.customers = await customerModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching customers', error)
        errorToast(this.create, $trans('Error fetching customers'))
        this.isLoading = false
      }
    },
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = await this.orderService.detail(this.pk)
        this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.order.end_date = this.$moment(this.order.end_date, 'DD/MM/YYYY').toDate()
        this.isLoading = false
      } catch(error) {
        console.log('error fetching order', error)
        errorToast(this.create, $trans('Error fetching order'))
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
