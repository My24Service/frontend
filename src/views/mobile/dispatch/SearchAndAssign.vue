<template>
  <div>
    <b-modal
      id="search-modal-wide"
      ref="search-modal-wide"
      v-bind:title="$trans('Search')"
      :cancel-disabled="true"
      @ok="searchAndAssignDone"
      :ok-title="$trans('Close')"
    >


      <form ref="search-form">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
                <BFormInput size="sm" autofocus v-model="query"
                              v-bind:placeholder="$trans('Type to search orders')"
                              @keydown.enter="search"
                              @change="searchDebounced"
                              @update="searchDebounced"></BFormInput>
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
                {{ order.start_date }}
                <BLink v-bind:title="$trans('Edit start and end dates')" v-on:click="editStartDate(order)">
                  <IBiPencil class="edit-icon"></IBiPencil>
                </BLink>
              </span>
              <span class="order-status" :title="order.last_status_full">
                <IBiCircleFill v-bind:style="`color:${orderStatusColorCode}`"></IBiCircleFill>
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
      <div slot="modal-footer" class="w-100">
        <b-row v-if="selectedOrders.length > 0" class="selected-orders float-left">
          <span class="dimmed">{{ $trans('Selected') }} ({{ selectedOrders.length }}):</span>
          <span v-for="(order, index) in selectedOrders" :key="order.id" class="selected-order">
              {{ order.order_id }}
              <IBiXCircle class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></IBiXCircle>
              <IBiXCircleFill class="icon" variant="primary" @click.prevent="removeSelectedOrder(index)"></IBiXCircleFill>
        </span>
          <!--
          <BButton variant="primary" v-if="selectedOrders.length > 0" @click.prevent="searchAndAssignDone()">
            <b-icon-person-lines-fill></b-icon-person-lines-fill>
            {{ $trans('Assign these orders') }}
          </BButton>
          -->
        </b-row>
        <BButton class="float-right" variant="primary" @click="searchAndAssignDone()" :data-non-zero="hasSelectedOrders()?'1':'0'">
          <IBiPersonLinesFill class="assign-icon"></IBiPersonLinesFill>&nbsp;<span>{{ buttonLabel }}</span>
        </BButton>
      </div>
      <EditStartDate id="edit-start-date" ref="edit-start-date" @edit-start-date-done="editStartDateDone"></EditStartDate>
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
import EditStartDate from "@/views/mobile/dispatch/EditStartDate.vue";

export default {
  components: {
    EditStartDate,
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
    this.lang = this.$store.getters.getCurrentLanguage;
    this.orderStatusColorCode = my24.status2color(this.statuscodes, this.orderStatusCode);
  },
  data() {
    return {
      model: new OrderService(),
      lang: null,
      searchDebounced: null,
      query: '',
      lastQuery: false,
      isLoading: false,
      orderStatusColorCode: '#666',
      orders: [],
      selectedOrders: [],
      buttonLabel: $trans('Close')
    }
  },
  methods: {
    hasSelectedOrders() {
      return this.selectedOrders.length > 0;
    },
    updateButtonLabel() {
      if (this.hasSelectedOrders()) {
        this.buttonLabel = $trans('Assign these orders')
      } else {
        this.buttonLabel = $trans('Close')
      }
    },
    handleOk(bvModalEvent) {
      bvModalEvent.preventDefault()
    },
    async editStartDateDone(order_id, start_date, end_date) {
      // console.log("editStartDateDone "+order_id+", from "+start_date+" to "+end_date);
      const formatHelper = function(date) {
        const m = date.getMonth() + 1; // 0 based
        const y = date.getFullYear();
        const d = date.getDate();
        let formatted = '';
        if (d < 10) formatted += '0';
        formatted += d + '/';
        if (m < 10) formatted += '0';
        formatted += m + '/' + y;
        return formatted;
      };

      const formatted_start = formatHelper(start_date);
      const formatted_end = formatHelper(end_date);

      // If we received new data, then we should  update the actual dates for this order on the backend.
      await this.model.update( order_id, { "start_date": formatted_start, "end_date": formatted_end} );

      // Additionally, we need to find this order in the list, so that
      // we can update the start-date with the updated value.
      // The dates are always dd/mm/yyyy (Dutch locale)
      for (const order of this.orders) {
        if (order.id === order_id) {
          order.start_date = formatted_start;
          break;
        }
      }

      // debugger
      // console.log('done')

    },
    editStartDate(order) {
      // console.log(order);
      // debugger;

      this.$refs['edit-start-date'].setFromOrder(order);
      this.$refs['edit-start-date'].show();
    },
    selectOrder(order) {
      for( let i=0; i<this.selectedOrders.length; i++) {
        if (this.selectedOrders[i].id === order.id) {
          return
        }
      }

      this.selectedOrders.push(order)
      this.updateButtonLabel();

      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1)
      this.updateButtonLabel();

      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    search() {
      // At least 2 characters and prevent searching the same thing over and over,
      // and if its empty, we reset the list of results. If data is currently
      // being fetched, we ignore the search completely to prevent weird race-conditions.
      if (this.isLoading) return;

      const query_length = this.query.trim().length;
      if (query_length > 2) {
        if (this.lastQuery === false || this.lastQuery !== this.query) {
          this.lastQuery = this.query;
          this.model.setSearchQuery(this.query);
          this.loadData();
        }
      } else if (query_length === 0) {
        this.lastQuery = false;
        this.orders = [];
      }
    },
    searchAndAssignDone() {
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
      this.$emit('search-and-assign-done', this.selectedOrders.length>0 )
      this.hide();
    },
    async loadData() {
      this.isLoading = true

      try {
        this.selectedOrders = await this.$store.dispatch('getAssignOrders') || []

        const data = await this.model.list()
        this.orders = data.results

        this.updateButtonLabel();
        this.isLoading = false
      } catch(error) {
        console.log('error fetching orders', error)
        errorToast(this.create, $trans('Error loading orders'))
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

#search-modal-wide .listing-item .order-actions { text-align:right }


#search-modal-wide .list-empty,
#search-modal-wide .headings span { color: #a9adae }

#search-modal-wide .order-status,
#search-modal-wide .order-id { color: #a9adae }

#search-modal-wide .order-id { text-align: end; width: 10rem; }

#search-modal-wide .list-empty div { margin: auto; padding: 5px 10px; }

#search-modal-wide .list-loading div { margin: auto }
#search-modal-wide .overflow-auto { max-height: calc(75vh - 200px) }

#search-modal-wide .btn.btn-primary { color: #fff !important }
#search-modal-wide .btn.btn-primary .assign-icon { display: none }
#search-modal-wide .btn.btn-primary[data-non-zero="1"] .assign-icon { display: inline-block }

.selected-orders { padding: 0.4rem 1rem 0.4rem 1rem }

.selected-order { margin-left: 5px }
.selected-order .icon {cursor: pointer}

.selected-order:not(:hover) .icon:last-of-type,
.selected-order:hover .icon:first-of-type { display: none }

</style>
