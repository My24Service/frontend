<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail" v-if="!isLoading">
      <b-row align-v="center">
        <b-col cols="2">
          <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Quarter totals for') }} {{ fullName }} {{ $trans('in') }} {{ year }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-table
        small
        id="quarter-table"
        :fields="quarterHeaders"
        :items="quarterData"
        responsive="md"
        class="data-table"
      />

      <b-row align-v="center">
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter1"
            v-if="!isLoading"
            :chart-data="pieChartdataQuarters[0]"
            :options="options[0]"
          />
          <p v-if="!pieChartdataQuarters[0]">{{ $trans('No data') }}</p>
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter2"
            v-if="!isLoading"
            :chart-data="pieChartdataQuarters[1]"
            :options="options[1]"
          />
          <p v-if="!pieChartdataQuarters[1]">{{ $trans('No data') }}</p>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter3"
            v-if="!isLoading && pieChartdataQuarters[2]"
            :chart-data="pieChartdataQuarters[2]"
            :options="options[2]"
          />
          <p v-if="!pieChartdataQuarters[2]">{{ $trans('No data') }}</p>
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter4"
            v-if="!isLoading && pieChartdataQuarters[3]"
            :chart-data="pieChartdataQuarters[3]"
            :options="options[3]"
          />
          <p v-if="!pieChartdataQuarters[3]">{{ $trans('No data') }}</p>
        </b-col>
      </b-row>

      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}
        </b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import PieChart from "@/components/PieChart"
import engineerModel from '@/models/company/UserEngineer'

let d = new Date();

export default {
  components: {
    PieChart,
  },
  data() {
    return {
      options: [],
      year: d.getYear() + 1900,
      isLoading: false,
      fullName: null,
      quarterHeaders: [],
      quarterData: [],
      pieChartdataQuarters: [],
      orderTypeColors: {}
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  methods: {
    nextYear() {
      this.year = this.year + 1
      this.loadData()
    },
    backYear() {
      this.year = this.year - 1
      this.loadData()
    },
    goBack() {
      this.$router.push({name: 'users-engineers'})
    },
    getOrderTypeColor(orderType) {
      if (!(orderType in this.orderTypeColors)) {
        this.orderTypeColors[orderType] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.orderTypeColors[orderType]
    },
    setChartdata(totals) {
      for (let i=0; i<totals.length; i++) {
        let pieGraphDataOrderTypes = [], labelsOrderTypes = [], colors = []

        for (const [orderType, data] of Object.entries(totals[i].work_hours_status_perc)) {
          labelsOrderTypes.push(`${orderType} (${totals[i].work_hours_status[orderType]})`)
          pieGraphDataOrderTypes.push(data)
          colors.push(this.getOrderTypeColor(orderType))
        }

        this.options[i] = {
          responsive: true,
          maintainAspectRatio: false,
          title: {
            display: true,
            text: `Workhours per order type for quarter ${i+1}`
          }
        }

        this.pieChartdataQuarters[i] = {
          labels: labelsOrderTypes,
          datasets: [{
            data: pieGraphDataOrderTypes,
            backgroundColor: colors,
          }]
        }
      }
    },

    setQuarterHeaders(totals) {
      this.quarterHeaders = [{
        key: 'type',
        label: this.$trans('Type')
      }]

      for (let i=0; i<totals.length; i++) {
        this.quarterHeaders.push({
          key: `quarter${totals[i].quarter}`,
          label: totals[i].month
        })
      }
    },
    setQuarterData(totals) {
      this.quarterData = []

      const types = [
      {
        label: 'Work total',
        key: 'work_total'
      },
      {
        label: 'Travel total',
        key: 'travel_total'
      },
      {
        label: 'Distance total',
        key: 'distance_total'
      }]

      for (let i=0; i<types.length; i++) {

        let row = {
          type: types[i].label
        }

        for (let j=0; j<totals.length; j++) {
          const key = `quarter${totals[j].quarter}`
          let val = {}
          row[key] = totals[j].totals[types[i].key] ? totals[j].totals[types[i].key] : 0
        }

        this.quarterData.push(row)
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await engineerModel.stats(this.pk, this.year)
        this.fullName = data.engineer

        this.setQuarterHeaders(data.totals)
        this.setQuarterData(data.totals)
        this.setChartdata(data.totals)

        this.isLoading = false
      } catch(error) {
        console.log('error fetching engineer details', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching engineer details')
        })

        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
