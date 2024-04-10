<template>
  <section :class="`dispatch-calendar ${this.mode}`">

    <ul :class="`listing calendar week ${this.isLoading ? 'loading': ''}`">
      <li class="planning-head">
        <div class="weekdays">
          <div><b-spinner v-if="this.isLoading" small></b-spinner> week <strong>{{ currentWeek }} </strong>({{ currentMonth }})</div>
          <span v-for="day of displayWeekdays" :key="day.date" :data-day="day.day">
            <h5>
              <strong v-if="day.date === todaysDate.date && day.month === todaysDate.month" class="today">{{ day.date }}</strong>
              <strong v-else>{{ day.date }}</strong>
              <small>{{  day.day }}</small>
            </h5>
          </span>
        </div>
      </li>

      <li v-for="item of this.results.data" :key="item.id" class="planning-row">

          <UserData
            @click.native="userClick(item.user_id, item.full_name)"
            :orders="item"
            :startDate="startDate"
            v-if="item.assignedorders"
            :is-assign-mode="isAssignMode"
            :already-assigned="alreadyAssignedUsers.find(user => user.user_id === item.user_id)"
            :clickHandler="handleOrderClick"
          />
          <div v-else>
            <span class="dimmed">{{  item.full_name }}</span>
          </div>

      </li>
    </ul>
  </section>
</template>

<script>
import moment from 'moment/min/moment-with-locales';
import axios from '@/services/api.js'
import UserData from './UserData.vue';

export default {
  name: "DispatchWeek",
  components: {UserData},
  emits: ['addSelectedUser'],
  props: {
    title: {
      type: [String],
    },
    startDate: {
      type: [Date],
    },
    mode: {
      type: String
    },
    orderClickHandler: {
      type: Function
    },
    isAssignMode: {
      type: Boolean,
      default: false
    },
    alreadyAssignedUsers: {
      type: Array,
    },
  },
  data() {
    return {
      isLoading: false,
      results: [],
      url: '/company/dispatch-assignedorders-user-list-v4/',
      visibleOrders: [],
      displayWeekdays: [],
      statuscodes: null,
      today: new Date()
    }
  },
  methods: {
    userClick(user_id, full_name) {
      if (!this.isAssignMode) {
        return
      }

      this.$emit('addSelectedUser', {
        user_id,
        full_name
      })
    },

    async loadData () {
      this.isLoading = true
      const url = `${this.url}?start_date=${this.currentDate}`
      this.results = []
      this.results = await axios.get(url).then(response => response.data)
      // this.results.data = temp.data.filter((row) => row.full_name === 'Michael de Greef');
      this.makeDays()
      this.isLoading = false;
    },

    makeDays () {
      let days = [];

      let start = moment(this.startDate)
      let current = start.clone();

      days.push( {
        day: current.format("ddd"),
        date: current.format("D"),
        month: current.format("MMM")
      })

      for(let i=0; i<6; i++) {
        current.add(1, 'd')

        days.push({
            day: current.format("ddd"),
            date: current.format("D"),
            month: current.format("MMM")
          }
        );
      }
      this.displayWeekdays = days;
    },

    handleOrderClick (orderId, assignedOrderId) {
      this.orderClickHandler(orderId, assignedOrderId)
    }
  },
  watch: {
    startDate(newStartDate, oldStartDate) {
      console.log('startDate', this.startDate)
      this.loadData();
      this.makeDays();
    }
  },
  computed : {
    currentDate: function () {
      let dateString = '';
      if (this.startDate) {
        dateString = moment(this.startDate).format('YYYY-MM-DD')
      } else {
        let d = new Date();
        dateString = moment(d).format('YYYY-MM-DD')
      }
      return dateString;
    },
    currentWeek: function () {
      return moment(this.startDate).format('w')
    },
    currentMonth: function () {
      return moment(this.startDate).format('MMM')
    },
    todaysDate : function () {
      return {date: moment(this.today).format('DD'), month: moment(this.today).format('MMM')}
    }
  },
  created() {
    console.log("isAssignMode", this.isAssignMode)
    this.makeDays();
    this.loadData();
  },
  async mounted() {
    this.statuscodes = await this.$store.dispatch('getStatuscodes');
  }
}
</script>
