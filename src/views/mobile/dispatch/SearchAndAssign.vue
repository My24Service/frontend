<template>
  <div>
    <b-modal
      id="search-modal-wide"
      ref="search-modal-wide"
      v-bind:title="$trans('Search')"
      :cancel-disabled="true"
      @ok="searchAndAssignDone"
    >
      <b-row v-if="selectedOrders.length > 0">
        <b-col cols="12">
          <strong>{{ $trans('Selected orders') }}:</strong>&nbsp;
          <span v-for="(order, index) in selectedOrders" :key="order.id">
          {{ order.order_id }}
          <b-link class="px-1" @click.prevent="removeSelectedOrder(index)">[ x ]</b-link>
        </span>
          <b-link class="px-1" @click.prevent="doAssign()" v-bind:title="$trans('Assign these orders')">
            <b-icon-arrow-bar-right font-scale="1"></b-icon-arrow-bar-right>
          </b-link>
        </b-col>
      </b-row>

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
              <span class="order-id">#{{ order.order_id }}<span v-if="$store.getters.getOrderListMustIncludeReference && order.order_reference && order.order_reference.length > 0"> / {{ order.order_reference }}</span></span>
              <span class="order-type">{{ order.order_type }}</span>
              <span class="order-company-name">{{ order.order_name }}</span>
              <span class="order-start-date" :title="`${order.start_date} ${order.start_time ? ' ' + order.start_time :'' }`">
                {{ order.start_date }}<b v-if="order.start_time !== null" :title="order.start_time"><b-icon icon="clock"></b-icon></b>
              </span>
              <span class="order-status" :title="order.last_status_full">
                <b-icon icon="circle-fill" v-bind:style="`color:${orderStatusColorCode}`"></b-icon>
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
      orders: [],
      selectedOrders: []
    }
  },
  methods: {
    selectOrder(order) {
      for( let i=0; i<this.selectedOrders.length; i++) {
        if (this.selectedOrders[i].id === order.id) {
          return
        }
      }

      this.selectedOrders.push(order)
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1)
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    doAssign() {
      this.searchAndAssignDone();
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
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
      this.$emit('search-and-assign-done', this.selectedOrders.length>0 )
      // this.$router.push({name: 'mobile-dispatch', params: {assignModeProp: true}})
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.orders = data.results
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
  width: 75vw;
  max-width: 855px;
}

#search-modal-wide input.form-control.form-control-sm {
  max-width: 200px;
  margin: 0 auto 2em auto;
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: 3rem;
  border-color: transparent;
  box-shadow: 0 0.25ex 0.5ex rgba(0, 0, 0, 0.25);
  min-height: 2.6rem;
  padding: 2ex;
  font-size: 0.85rem;
}

/* this is a bit of a cheat but hey ho */
#search-modal-wide .btn.btn-secondary.disabled {
  display: none;
}

#search-modal-wide .headings span {
  width: 10rem;
}

#search-modal-wide .order-actions {
  width: 30px;
  max-width: 30px;
  min-width: 30px;
}
#search-modal-wide .order-status {
  min-width: 10rem;
  width: 10rem;
}

#search-modal-wide .listing-item .order-type {
  font-weight: bold;
  min-width: 6rem;
  width: 6rem;
}

#search-modal-wide .headings span.order-type {
  min-width: 6rem;
  width: 6rem;
}

#search-modal-wide .listing-item .order-start-date {
  max-width: 9rem;
  min-width: 9rem;
  width: 9rem;
}

#search-modal-wide .headings .order-company-name,
#search-modal-wide .listing-item .order-company-name {
  min-width: 7rem;
  max-width: 7rem;
  width: 7rem;
}

#search-modal-wide .listing-item .order-actions {
  /* position: absolute;
  right: 40px; */
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

#search-modal-wide .overflow-auto {
  max-height: calc(75vh - 200px);
}
</style>
