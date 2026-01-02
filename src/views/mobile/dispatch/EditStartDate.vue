<template>
  <div>
    <b-modal
      id="edit-start-date-modal-wide"
      ref="edit-start-date-modal-wide"
      v-bind:title="$trans('Edit Order Dates')"
      @ok="editStartDateDone"
      @cancel="editStartDateCancel"
      :ok-title="$trans('Save')">
      <p>{{ $trans('Edit the dates for this order.')}}</p>
      <!-- <p>Order #<span>{{ order_id }}</span></p> -->
      <form ref="start-date-form">
        <b-container>
          <BFormGroup
            :label="$trans('Start date')"
            label-for="start_date"
            cols="1">
            <VueDatePicker
              id="start_date"
              v-model="start_date"
              :placeholder="$trans('Select date')"
              v-bind:locale="lang"
              value-as-date=true
              :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              @input="check_date_start()"
            ></VueDatePicker>
          </BFormGroup>

          <BFormGroup
            label-class=""
            v-bind:label="$trans('End date')"
            label-for="end_date"
            cols="2">
              <VueDatePicker
                id="end_date"
                v-model="end_date"
                class="mb-2"
                :placeholder="$trans('Select date')"
                v-bind:locale="lang"
                value-as-date=true
                :state="this.error == null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                @input="check_date_end()"
              ></VueDatePicker>
            </BFormGroup>
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
    // this.lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(this.lang)
  },
  data() {
    return {
      lang: 'nl',
      start_date: null,
      end_date: null,
      order_id: null,
      error: null,
    }
  },
  methods: {
    setFromOrder(order) {
      this.order_id = order.id;
      this.start_date = this.$moment(order.start_date, 'DD/MM/YYYY').toDate();
      this.end_date = this.$moment(order.end_date, 'DD/MM/YYYY').toDate();
    },
    check_date_start() {
      this.error = null;
      if (this.end_date < this.start_date) {
        this.end_date = this.start_date;
      }
    },
    check_date_end() {
      if (this.end_date < this.start_date) {
        this.error = $trans('The end date cannot lie before start date')
      } else {
        this.error = null;
      }
    },
    editStartDateCancel() {
      this.hide();
    },
    editStartDateDone(e) {
      if (this.error == null) {
        this.$emit('edit-start-date-done', this.order_id, this.start_date, this.end_date)
        this.hide();
      } else {
        e.preventDefault();
      }
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
