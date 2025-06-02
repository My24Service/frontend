<template>
  <div>
    <b-modal
      id="edit-start-date-modal-wide"
      ref="edit-start-date-modal-wide"
      v-bind:title="$trans('Edit Order Dates')"
      @ok="editStartDateDone"
      @cancel="editStartDateCancel"
      :ok-title="$trans('Close')">
      <p>{{ this.$trans('Edit the dates for this order.')}}</p>
      <!-- <p>Order #<span>{{ order_id }}</span></p> -->
      <form ref="start-date-form">
        <b-container>
          <b-form-group
            :label="$trans('Start date')"
            label-for="start_date"
            cols="1">
            <b-form-datepicker
              id="start_date"
              v-model="start_date"
              :placeholder="$trans('Select date')"
              locale="nl"
              :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
            ></b-form-datepicker>
          </b-form-group>

          <b-form-group
            label-class=""
            v-bind:label="$trans('End date')"
            label-for="end_date"
            cols="2">
              <b-form-datepicker
                id="end_date"
                v-model="end_date"
                class="mb-2"
                :placeholder="$trans('Select date')"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
        </b-container>
      </form>
    </b-modal>
  </div>
</template>
<script>
// import {OrderService} from "@/models/orders/Order";
import moment from "moment/moment";

export default {
  async created () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)
  },
  data() {
    console.log('EditStartDate data');
    return {
      start_date: null,
      end_date: null,
      order_id: null
    }
  },
  methods: {
    setFromOrder(order) {
      console.log('EditStartDate setFromOrder');
      this.order_id = order.id;

      this.start_date = this.$moment(order.start_date, 'DD/MM/YYYY').toDate()
      this.end_date = this.$moment(order.end_date, 'DD/MM/YYYY').toDate()

      debugger
      console.log("order_id="+this.order_id+", start="+this.start_date+", end="+this.end_date);
    },
    editStartDateCancel() {
      debugger
      this.hide();
    },
    editStartDateDone() {
      ///this.$store.dispatch('setAssignOrders', this.selectedOrders)
      ///
      this.$emit('edit-start-date-done', this.order_id, this.start_date, this.end_date )
      this.hide();
    },
    show() {
      console.log('EditStartDate SHOW');
      this.$refs['edit-start-date-modal-wide'].show()
    },
    hide() {
      console.log('EditStartDate HIDE');
      this.$refs['edit-start-date-modal-wide'].hide()
    }

  }
};

</script>
