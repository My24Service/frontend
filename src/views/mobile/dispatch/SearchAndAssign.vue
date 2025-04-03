<template>
  <div>
    <b-modal
      id="search-modal-wide"
      ref="search-modal-wide"
      v-bind:title="$trans('Search')"
      :cancel-disabled="true"
      @ok="searchAndAssignDone"
    >
      <form ref="search-form" @submit.stop.prevent="searchAndAssignDone">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
                <b-form-input size="sm" autofocus v-model="query" v-bind:placeholder="$trans('Type to search orders')" @change="searchDebounced" @update="searchDebounced"></b-form-input>
            </b-col>
          </b-row>
        </b-container>
      </form>


      <div class="overflow-auto">
        <ul class="listing order-list full-size">
          <li><!-- FIXME -->

            <div class="headings">
              <span class="order-id">{{ $trans("order id") }}</span>
              <span class="order-type">{{ $trans("type") }}</span>
              <span class="order-company-name">{{ $trans("company") }}</span>
              <span class="order-start-date">{{ $trans("start date") }}</span>
              <span class="order-status">{{ $trans("status") }}</span>
              <span class="order-actions">&nbsp;</span>
            </div>
          </li>
          <li v-if="isLoading" class="text-center my-2 list-loading">
            <div>
              <b-spinner class="align-middle"></b-spinner><br>
              <span>{{ $trans('loading orders') }}</span>
            </div>
          </li>
          <li v-if="orders.length === 0" class="list-empty">
            <div>
              <span>{{ $trans('No results') }}</span>
            </div>
          </li>
          <li v-if="!isLoading" v-for="order in orders" :key="order.id" style="">
            <div class="listing-item" style="">
              <span class="order-id">#{{ order.order_id }}<span v-if="$store.getters.getOrderListMustIncludeReference"> / {{ order.order_reference }}</span></span>
              <span class="order-type">{{ order.order_type }}</span>
              <span class="order-company-name">{{ order.order_name }}</span>
              <span class="order-start-date" :title="`${order.start_date} ${order.start_time ? ' ' + order.start_time :'' }`">
                {{ order.start_date }}<b v-if="order.start_time !== null" :title="order.start_time"><b-icon icon="clock"></b-icon></b>
              </span>
              <span class="order-status">
                <b-icon icon="circle-fill" v-bind:style="`color:${orderStatusColorCode}`" :title="order.last_status_full"></b-icon>
                {{ order.last_status_full }}
              </span>

            <!-- <OrderTableInfo
              v-bind:order="order"
              :model="model"
              @reload-data="loadData"
            /> -->
              <div class="order-actions" style="">
                <IconLinkAssign
                  v-bind:title="$trans('Assign')"
                  v-bind:method="function() { selectOrder(order) }"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
  <!--

      <b-table
        id="order-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="orders"
        responsive="md"
        class="data-table"
        tbody-tr-class="order-row"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>

        <template #cell(order_id)="data">
          {{ data.value }}
        </template>

        <template #cell(order_name)="data">
          <span class="order-company-name">{{ data.value }}</span>
        </template>

        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkAssign
              v-bind:title="$trans('Assign')"
              v-bind:method="function() { selectOrder(data.item) }"
            />
          </div>
        </template>
      </b-table> -->

    </b-modal>
  </div>
</template>

<script>
import ButtonLinkRefresh from "@/components/ButtonLinkRefresh.vue";
import ButtonLinkSort from "@/components/ButtonLinkSort.vue";
import IconLinkDocuments from "@/components/IconLinkDocuments.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";
import ButtonLinkSearch from "@/components/ButtonLinkSearch.vue";
import IconLinkAssign from "@/components/IconLinkAssign.vue";
import my24 from "@/services/my24";
import {OrderService} from "@/models/orders/Order";
import AwesomeDebouncePromise from "awesome-debounce-promise";

export default {
  components: {
    IconLinkAssign,
    ButtonLinkSearch,
    IconLinkEdit,
    IconLinkDocuments,
    ButtonLinkSort,
    ButtonLinkRefresh
  },
  async mounted() {
    this.searchDebounced = AwesomeDebouncePromise(this.search, 500)
  },
  async created() {
    this.orderStatusColorCode = my24.status2color(this.statuscodes, this.orderStatusCode);
  },
  data() {
    return {
      model: new OrderService(),
      searchDebounced: null,
      query: '',
      lastQuery: false,
      isLoading: false,
      orderStatusColorCode: '#666',
      orders: [
        {
            "id": 699,
            "uuid": "93d292f4-ac7e-4201-8959-a89aff03d2e5",
            "customer_id": "2164",
            "order_id": "10798",
            "customer_reference": null,
            "order_reference": "AAABBBCCC",
            "order_type": "Onderhoud",
            "customer_remarks": "",
            "description": null,
            "start_date": "19/09/2025",
            "start_time": null,
            "end_date": "19/09/2025",
            "end_time": null,
            "order_date": "19/09/2025",
            "remarks": null,
            "order_name": "Test B.V.",
            "order_address": "testbvstraat 130",
            "order_postal": "3562LM",
            "order_city": "Utrecht",
            "order_country_code": "NL",
            "order_tel": "",
            "order_mobile": "0650384058",
            "order_email": "my24service.jordey@gmail.com",
            "order_contact": "Test 1",
            "workorder_pdf_url": "",
            "documents": [],
            "user_order_is_available": true,
            "created": "16/09/2024 15:14",
            "statuses": [
            ],
            "orderlines": [
              {
                "id": 1348,
                "product": "S12EW airconditioner met wifi",
                "location": "Kantoor 1",
                "remarks": "1x per jaar in maart",
                "price_purchase": "0.00",
                "price_selling": "0.00",
                "amount": 1,
                "material_relation": null,
                "location_relation_inventory": null,
                "purchase_order_material": null,
                "equipment": 20,
                "equipment_location": 14,
                "maintenance_contract": 13
              }
            ],
            "required_assigned": "3/1 (300.00%)",
            "required_users": 1,
            "user_order_available_set_count": 0,
            "assigned_count": 3,
            "customer_relation": 1169,
            "customer_rate_avg": null,
            "workorder_url": "http://demo.my24service.com:3000/#/orders/orders/workorder/93d292f4-ac7e-4201-8959-a89aff03d2e5",
            "infolines": [],
            "workorder_documents": [],
            "branch": null,
            "assigned_user_info": [
              {
                "user_id": 44,
                "full_name": "Melissa Vedder",
                "license_plate": ""
              },
              {
                "user_id": 57,
                "full_name": "kees kees",
                "license_plate": ""
              },
              {
                "user_id": 65,
                "full_name": "Hugo van Galen M",
                "license_plate": ""
              }
            ],
            "last_update": "2025-03-20T12:53:28.346404",
            "last_status": "Opdracht toegewezen aan mv",
            "last_status_full": "20/03/2025 12:53 Opdracht toegewezen aan mv",
            "last_status_date": "2025-03-20T12:53:28.346404"
        }
      ],
      assigned: []
    }
  },
  methods: {
    selectOrder(item) {
      debugger;
      console.log( 'Select order to list.')
      this.assigned.push( item );
    },
    search() {
      // at least 2 characters...
      if (this.query.trim().length > 2) {
        // prevent searching the same thing over and over...
        if (this.lastQuery === false || this.lastQuery !== this.query) {
          this.lastQuery = this.query;
          this.model.setSearchQuery(this.query);
          this.loadData();
        }
      }
    },
    searchAndAssignDone() {
      this.$emit('search-and-assign-done', this.assigned)
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.orders = data.results
        // this.selectedOrders = await this.$store.dispatch('getAssignOrders') || []
        this.isLoading = false
      } catch(error) {
        console.log('error fetching orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    },
    show() {
      this.$refs['search-modal-wide'].show()
    },
    hide() {
      this.$refs['search-modal-wide'].hide()
    }
  },
}
</script>

<style>
#search-modal-wide .modal-dialog.modal-md {
  max-width: 80vw;
}

#search-modal-wide input.form-control.form-control-sm {
  max-width: 200px;
  margin: 0 auto 2em auto;
}

/* this is a bit of a cheat but hey ho */
#search-modal-wide .btn.btn-secondary.disabled {
  display: none;
}

#search-modal-wide .order-status {
  min-width: 20rem;
}

#search-modal-wide .listing-item .order-type {
  font-weight: bold;
}

#search-modal-wide .listing-item .order-actions {
  position: absolute;
  right: 40px;
  text-align:right;
}

#search-modal-wide .list-empty,
#search-modal-wide .headings span {
  color: #a9adae;
}

#search-modal-wide .order-status,
#search-modal-wide .order-id {
  color: #a9adae;
}

#search-modal-wide .order-id {
  text-align: end;
  width: 10rem;
}

#search-modal-wide .list-empty div {
  margin: auto;
  padding: 5px 10px;
}

#search-modal-wide .list-loading div {
  margin: auto;
}
</style>
