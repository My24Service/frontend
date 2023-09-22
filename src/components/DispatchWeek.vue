<template>
  <section :class="`dispatch-calendar ${this.mode}`">
    
    <ul :class="`listing calendar week ${this.isLoading ? 'loading': ''}`">
      <li class="planning-head">
        <div class="weekdays">
          <div><b-spinner v-if="this.isLoading" small></b-spinner> week <strong>{{ currentWeek }} </strong>({{ currentMonth }})</div>
          <span v-for="day of displayWeekdays" :key="day.date" :data-day="day.day">
            <strong v-if="day.date === todaysDate.date && day.month === todaysDate.month" class="today">{{ day.date }}</strong>
            <strong v-else>{{ day.date }}</strong>
            <small>{{  day.day }}</small>
          </span>
        </div>
      </li>

      <li v-for="item of this.results.data" :key="item.id" class="planning-row">

        <DispatchOrders
          :orders="item"
          :startDate="startDate"
          v-if="item.assignedorders && Object.keys(item.assignedorders.start)[0]"
          :clickHandler="handleOrderClick"/>
        
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
import DispatchOrders from './DispatchOrders.vue';

export default {
  name: "DispatchWeek",
  components: {DispatchOrders},
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
    }
  },
  data() {
    return {
      isLoading: true,
      results: [],
      url: '/company/dispatch-assignedorders-user-list-v3/',
      visibleOrders: [],
      displayWeekdays: [],
      statuscodes: null,
      today: new Date()
    }
  },
  methods: {
    async loadData () {
      this.isLoading = true;
      const url = `${this.url}?start_date=${this.currentDate}`
      const temp = await axios.get(url).then(response => response.data)
      this.results.length = 0;
      this.results = temp;
      this.isLoading = false;
    },

    makeDays () {
      
      let days = [];
      
      let start = moment(this.startDate);
      let current = start.clone();

      days.push( {
        day: current.format("ddd"), 
        date: current.format("D"), 
        month: current.format("MMM")
      })

      for(let i=0; i<4; i++) {  
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
    this.loadData();
    this.makeDays();
  },
  async mounted() {
    this.statuscodes = await this.$store.dispatch('getStatuscodes');
  }
}
</script>
