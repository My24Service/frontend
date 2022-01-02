<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New order') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit order') }}</h2>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search existing address')"
              label-for="order-customer-search"
            >
              <multiselect
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
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Start date')"
              label-for="start_date"
            >
              <b-form-datepicker
                id="start_date"
                size="sm"
                class="p-sm-0"
                v-model="order.start_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="order.start_date"
                locale="nl"
                :state="isSubmitClicked ? !$v.order.start_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.start_date.$error : null">
                {{ $trans('Please enter a start date') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
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
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('End date')"
              label-for="end_date"
            >
              <b-form-datepicker
                id="end_date"
                size="sm"
                v-model="order.end_date"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a date')"
                locale="nl"
                :state="isSubmitClicked ? !$v.order.end_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.end_date.$error : null">
                {{ $trans('Please enter an end date') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
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
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="order_name"
            >
              <b-form-input
                v-model="order.order_name"
                id="order_name"
                size="sm"
                :state="isSubmitClicked ? !$v.order.order_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.order_name.$error : null">
                {{ $trans('Please enter the customer') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-for="customer_id"
            >
              <b-form-input
                v-model="order.customer_id"
                readonly
                id="customer_id"
                size="sm"
                :state="isSubmitClicked ? !$v.order.customer_id.$error : null"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="order_address"
            >
              <b-form-input
                id="order_address"
                size="sm"
                v-model="order.order_address"
                :state="isSubmitClicked ? !$v.order.order_address.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
            >
              <b-form-select v-model="order.order_country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
            >
              <b-form-input
                id="order_postal"
                size="sm"
                v-model="order.order_postal"
                :state="isSubmitClicked ? !$v.order.order_postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="order_city"
            >
              <b-form-input
                id="order_city"
                size="sm"
                v-model="order.order_city"
                :state="isSubmitClicked ? !$v.order.order_city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.order.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Order type')"
              label-for="order_type"
            >
              <OrderTypesSelect
                v-if="(!isCreate && !isLoading) || isCreate"
                :orderTypeIn="order.order_type"
                :order-type.sync="order.order_type"
                :include-all="false"
              />
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Order number')"
              label-for="service_number"
            >
              <b-form-input
                id="service_number"
                size="sm"
                v-model="order.service_number"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="order_reference"
            >
              <b-form-input
                id="order_reference"
                size="sm"
                v-model="order.order_reference"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="order_email"
            >
              <b-form-input
                id="order_email"
                size="sm"
                v-model="order.order_email"
              ></b-form-input>
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
                v-model="order.order_mobile"
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
                v-model="order.order_tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
            >
              <b-form-textarea
                id="order_contact"
                v-model="order.order_contact"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer remarks')"
              label-for="customer_remarks"
            >
              <b-form-textarea
                id="customer_remarks"
                v-model="order.customer_remarks"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
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
                    <b-link class="h5 mx-2" @click="editOrderLine(data.item, data.index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteOrderLine(data.index)">
                      <b-icon-trash></b-icon-trash>
                    </b-link>
                  </div>
                </template>
              </b-table>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Equipment')"
                label-for="order-orderline-product"
              >
                <b-form-input
                  id="order-orderline-product"
                  size="sm"
                  v-model="product"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Location')"
                label-for="order-orderline-location"
              >
                <b-form-input
                  id="order-orderline-location"
                  size="sm"
                  v-model="location"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Remarks')"
                label-for="order-orderline-remarks"
              >
                <b-form-textarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <b-button v-if="isEditOrderLine" @click="doEditOrderLine" class="btn btn-primary" size="sm" type="button" variant="warning">
              {{ $trans('Edit orderline') }}
            </b-button>
            <b-button v-if="!isEditOrderLine" @click="addOrderLine" class="btn btn-primary" size="sm" type="button" variant="primary">
              {{ $trans('Add orderline') }}
            </b-button>
          </footer>
        </div>

        <div class="order-infolines">
          <h4>{{ $trans('Info lines') }}</h4>
          <b-row>
            <b-col cols="12">
              <b-table v-if="order.infolines.length > 0" small :fields="infoLineFields" :items="order.infolines" responsive="md">
                <template #thead-top="data">
                  <b-tr>
                    <b-th width="80%">{{ data.column }}</b-th>
                    <b-th width="20%"></b-th>
                  </b-tr>
                </template>
                <template #cell()="data">
                  {{ data.value }}
                </template>
                <template #cell(icons)="data">
                  <div class="float-right">
                    <b-link class="h5 mx-2" @click="editInfoLine(data.item, data.index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteInfoLine(data.index)">
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
                v-bind:label="$trans('Info')"
                label-for="order-infoline-info"
              >
                <b-form-textarea
                  id="order-infoline-info"
                  v-model="info"
                  rows="2"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <b-button v-if="isEditInfoLine" @click="doEditInfoLine" class="btn btn-primary" size="sm" type="button" variant="warning">
              {{ $trans('Edit infoline') }}
            </b-button>
            <b-button v-if="!isEditInfoLine" @click="addInfoLine" class="btn btn-primary" size="sm" type="button" variant="primary">
              {{ $trans('Add infoline') }}
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
import Multiselect from 'vue-multiselect'
import OrderTypesSelect from '@/components/OrderTypesSelect'
import { required } from 'vuelidate/lib/validators'
import orderModel from '@/models/orders/Order'
import customerModel from '@/models/customer/Customer';

export default {
  components: {
    Multiselect,
    OrderTypesSelect
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
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
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      editIndex: null,
      isEditOrderLine: false,
      isEditInfoLine: false,
      product: '',
      location: '',
      remarks: '',
      info: '',
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Info') },
        { key: 'icons', label: '' }
      ],
      submitClicked: false,
      countries: [],
      order: orderModel.getFields(),
      errorMessage: null,
      customers: [],
      customerSearch: '',
      selectedCustomer: null
    }
  },
  validations: {
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
    },
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
  created() {
    this.$store.dispatch('getCountries').then((countries) => {
      this.countries = countries

      if (this.isCreate) {
        this.order = orderModel.getFields()
        this.getCustomers('')
      } else {
        this.loadOrder()
      }
    })
  },
  methods: {
    // order lines
    deleteOrderLine(index) {
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

    // info lines
    deleteInfoLine(index) {
      this.order.infolines.splice(index, 1)
    },
    editInfoLine(item, index) {
      this.editIndex = index
      this.isEditInfoLine = true

      this.info = item.info
    },
    emptyInfoLine() {
      this.info = ''
    },
    doEditInfoLine() {
      const infoLine = {
        info: this.info,
      }
      this.order.infolines.splice(this.editIndex, 1, infoLine)
      this.editIndex = null
      this.isEditInfoLine = false
      this.emptyInfoLine()
    },
    addInfoLine() {
      this.order.infolines.push({
        info: this.info,
      })
      this.emptyInfoLine()
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
    submitForm() {
      this.submitClicked = true
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          orderModel.insert(token, this.order).then((order) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Order has been created')
            })

            this.buttonDisabled = false
            this.isLoading = false

            if (confirm((this.$trans('Do you want to add documents to this order?')))) {
              this.$router.push({name: 'order-document-add', params: {orderPk: order.id}})
            } else {
              this.$router.go(-1)
            }
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating order')
            })

            this.isLoading = false
            this.buttonDisabled = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        orderModel.update(token, this.pk, this.order)
          .then(() => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Updated'),
              message: this.$trans('Order has been updated')
            })

            this.isLoading = false
            this.buttonDisabled = false
            this.$router.go(-1)
          })
          .catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error updating order')
            })

            this.isLoading = false
            this.buttonDisabled = false
          })
      })
    },
    getCustomers(query) {
      this.isLoading = true

      customerModel.search(query).then((response) => {
        this.customers = response
        this.isLoading = false
      }).catch(() => {
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching customers')
        })

        this.isLoading = false
      })
    },
    loadOrder() {
      this.isLoading = true
      let start_date
      let end_date

      orderModel.detail(this.pk).then((order) => {
        start_date = this.$moment(order.start_date, 'DD/MM/YYYY')
        end_date = this.$moment(order.end_date, 'DD/MM/YYYY')
        this.order = order
        this.order.start_date = start_date.toDate()
        this.order.end_date = end_date.toDate()

        this.isLoading = false
      })
      .catch((error) => {
        console.log('error fetching order', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching order')
        })

        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
