<template>
  <b-modal
    id="attach-order-modal"
    ref="attach-order-modal"
    v-bind:title="$trans('Attach order')"
    @ok="submitForm"
    @cancel="cancelForm"
  >
    <div>
      <h4>{{ $trans("No order found, create one")}}</h4>
      <div class="container app-form">
        <b-form>
          <b-row>
            <b-col cols="8" role="group">
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
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :hide-selected="true"
                  @search-change="getCustomersDebounced"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <span slot="noResult">{{ $trans('Nothing found.') }}</span>
                </multiselect>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                label-class="p-sm-0"
                v-bind:label="$trans('Licence plate')"
                label-for="order_reference"
              >
                <b-form-input
                  id="order_reference"
                  size="sm"
                  class="p-sm-0"
                  v-model="order.order_reference"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-form>
        <b-row>
          <b-col cols="12" role="group">
            <h5 v-if="order.order_name || order.order_reference">{{ order.order_name}} - {{ order.order_reference }}</h5>
          </b-col>
        </b-row>
      </div>
    </div>
  </b-modal>
</template>

<script>

import Multiselect from "vue-multiselect";
import moment from "moment";
import orderModel from "../../models/orders/Order";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import customerModel from '../../models/customer/Customer.js'
import engineerModel from '../../models/company/UserEngineer.js'
import Assign from "../../models/mobile/Assign";
import engineerEventModel from "../../models/company/EngineerEvent";

export default {
  name: "EngineerEventOrderForm",

  components: {
    Multiselect,
  },
  data() {
    return {
      moment,
      event_id: null,
      engineer: null,
      order: orderModel.getFields(),
      customers: [],
      customerSearch: '',
      getCustomersDebounced: null,
      isLoading: false
    }
  },
  computed: {
    buttonDisabled() {
      return this.order.order_name === null
    },
  },
  methods: {
    async show(event_id, engineer_user_id) {
      this.event_id = event_id
      this.engineer = await engineerModel.detail(engineer_user_id)
      this.$refs['attach-order-modal'].show()
    },
    hide() {
      this.$refs['attach-order-modal'].hide()
    },
    async submitForm() {
      this.isLoading = true
      try {
        this.order.start_date = moment().toDate()
        this.order.end_date = moment().toDate()
        const newOrder = await orderModel.insert(this.order)

        // assign order
        const assigned_result = await Assign.assignToUser(this.engineer.id, [newOrder.order_id], true)
        const assigned_order_id = assigned_result.assigned_data[newOrder.order_id]

        // update event which should trigger a reload
        await engineerEventModel.sendUpdate(this.event_id, assigned_order_id)

        // reset order
        this.order = orderModel.getFields()

        this.isLoading = false
        this.$emit('assigned', this.query)
        this.hide()
      } catch(error) {
        console.log('Error creating/assigning order', error)
        errorToast(create, this.$trans('Error creating/assigning order'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.order = {}
      this.hide()
    },
    customerLabel({ name, address, city}) {
      return `${name} - ${address} - ${city}`
    },
    selectCustomer(option) {
      this.fillCustomer(option)
    },
    fillCustomer(customer) {
      this.order.customer_relation = customer.id
      this.order.customer_id = customer.customer_id
      this.order.order_name = customer.name
      this.order.order_address = customer.address
      this.order.order_city = customer.city
      this.order.order_postal = customer.postal
      this.order.order_country_code = customer.country_code
      this.order.order_tel = customer.tel
      this.order.order_mobile = customer.mobile
      this.order.order_email = customer.email
      this.order.order_contact = customer.contact
      this.order.customer_remarks = customer.remarks
    },
    async getCustomers(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.customers = await customerModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching customers', error)
        errorToast(create, this.$trans('Error fetching customers'))
        this.isLoading = false
      }
    },
  },
  async created() {
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
  }
}
</script>

<style scoped>

</style>
