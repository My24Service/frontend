<template>
  <div class="app-page" v-if="budget">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="credit-card2-front"></b-icon>
          <span class="backlink" @click="goBack">Budgets</span> / 
          <strong>{{ budget.year }}</strong> 
        </h3>
        <h3 :title="`${budget.year} ${$trans('Budget size')}: ${formatDinero(budget.amount_dinero)}`">
          <small class="dimmed">{{ $trans('Budget size')}}</small>
          {{ formatDinero(budget.amount_dinero) }}
        </h3>
      </div>
    </header>

    <div class="page-detail">
      
      <div v-if="isLoading" class="text-center panel">
        <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
        <strong>{{ $trans('Loading...') }}</strong>
      </div>
      
      <div v-else class="flex-columns">
        
        <div class="panel col-1-2">
          <h6 class="flex-columns" style="justify-content: space-between">
            <span>{{ $trans('Costs') }}</span>
            <span class="dimmed">{{ formatDinero(costs_total_dinero) }} / {{  formatDinero(budget.amount_dinero) }}</span>
          </h6>

          <b-progress>
            <b-progress-bar
            :value="this.chartdataCosts.datasets[0].data[0]" 
            :title="`${this.chartdataCosts.labels[0]}, ${this.chartdataCosts.labels[1]}`"></b-progress-bar>
          </b-progress>
          
          <!-- <pie-chart
            id="pie-chart-costs"
            v-if="!isLoading"
            :chart-data="chartdataCosts"
            :options="options"
          /> -->
          <hr/>
          <h6>{{ $trans('Costs breakdown') }}</h6>
          
          <pie-chart
          id="pie-chart-costs-detail"
          v-if="!isLoading"
          :chart-data="chartdataCostsDetail"
          :options="options"
          />
          
        </div>
        
        <div class="panel col-1-2">
          <h6 class="flex-columns" style="justify-content: space-between">
            {{ $trans('Expected costs') }}
            <span class="dimmed">{{ formatDinero(expected_costs_total_dinero) }}</span>
          </h6>
          <b-progress>
            <b-progress-bar
            style="--delay: 2"
            :value="this.chartdataExpectedCosts.datasets[0].data[0]" 
            :title="`${this.chartdataExpectedCosts.labels[0]}, ${this.chartdataExpectedCosts.labels[1]}`"></b-progress-bar>
          </b-progress>

          <!-- <pie-chart
            id="pie-chart-expected-costs"
            v-if="!isLoading"
            :chart-data="chartdataExpectedCosts"
            :options="options"
          />
          <hr/> -->
          
          <h6>{{ $trans('Expected costs breakdown') }}</h6>
          
          <pie-chart
            id="pie-chart-expected-costs-detail"
            v-if="!isLoading"
            :chart-data="chartdataExpectedCostsDetail"
            :options="options"
          />
        </div>

      </div>
    </div>
    
  </div>
</template>
<script>
import {BudgetService} from "../../models/company/Budget";
import PieChart from "../../components/PieChart";
import ChartJsPluginDataLabels from "chartjs-plugin-datalabels";
import {toDinero} from "../../utils";

export default {
  components: {
    PieChart,
    ChartJsPluginDataLabels,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  created() {
    this.loadData()
  },
  data() {
    return {
      isLoading: true,
      service: new BudgetService(),
      budget: null,
      costs: null,
      costs_total_dinero: null,
      expected_costs: null,
      expected_costs_total_dinero: null,
      chartdataCosts: null,
      chartdataExpectedCosts: null,
      chartdataCostsDetail: null,
      chartdataExpectedCostsDetail: null,
      colors: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
              return `${value}%`
            },
            color: '#fff',
          }
        }
      }
    }
  },
  methods: {
    formatDinero(dinero) {
      const text = dinero.toFormat('$0,0.00')
      const parts = text.split('.')
      return `${parts[0].replace(',', '.',)},${parts[1]}`
    },
    getRandomColorOrderType(txt) {
      if (!(txt in this.colors)) {
        this.colors[txt] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.colors[txt]
    },
    async loadData() {
      this.isLoading = true

      const budgetData = await this.service.detail(this.pk)
      this.budget = new this.service.model(budgetData)

      this.costs = await this.service.getCosts(this.pk)
      this.costs_total_dinero = toDinero(this.costs.total, this.$store.getters.getDefaultCurrency)
      let rest = this.budget.amount - this.costs.total
      let rest_dinero = toDinero(rest, this.$store.getters.getDefaultCurrency)
      let labels = [
        `${this.$trans('Costs')} ${this.formatDinero(this.costs_total_dinero)}`,
        `${this.$trans('Remaining')} ${this.formatDinero(rest_dinero)}`,
      ]

      let colors = [
        this.getRandomColorOrderType(labels[0]),
        this.getRandomColorOrderType(labels[1]),
      ]

      let data = [
        ((this.costs.total / this.budget.amount) * 100).toFixed(2),
        ((rest / this.budget.amount) * 100).toFixed(2),
      ]
      this.chartdataCosts = {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
        }]
      }

      /*
      {
          "total": 312576.0,
          "invoices_partners": {
              "shltr-installation": 108030.0,
              "demo": 94712.0
          },
          "purchase_invoices": 109834.0
      }
       */

      // set up detail chart
      const purchase_invoices_dinero = toDinero(this.costs.purchase_invoices, this.$store.getters.getDefaultCurrency)
      labels = [
        `${this.$trans('Purchase invoices')} (${this.formatDinero(purchase_invoices_dinero)})`,
      ]

      colors = [
        this.getRandomColorOrderType(labels[0]),
      ]

      data = [
        ((this.costs.purchase_invoices / this.costs.total) * 100).toFixed(2),
      ]

      for (const [companycode, amount] of Object.entries(this.costs.invoices_partners)) {
        const amount_dinero = toDinero(amount, this.$store.getters.getDefaultCurrency)
        labels.push(`${this.$trans('Invoices partners')} - ${companycode} (${this.formatDinero(amount_dinero)})`)
        colors.push(this.getRandomColorOrderType('Invoices partners'))
        data.push(((amount / this.costs.total) * 100).toFixed(2))
      }

      this.chartdataCostsDetail = {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
        }]
      }

      this.expected_costs = await this.service.getExpectedCosts(this.pk)
      this.expected_costs_total_dinero = toDinero(this.expected_costs.total, this.$store.getters.getDefaultCurrency)
      /*
      {
          "total": 22490.0,
          "own_maintenance_contracts": {},
          "partner_maintenance_contracts": {
              "shltr-installation": 9204.0,
              "demo": 3537.0
          },
          "equipment_replacements": 9749.0
      }
       */

      rest = this.budget.amount - this.expected_costs.total
      rest_dinero = toDinero(rest, this.$store.getters.getDefaultCurrency)

      labels = [
        `${this.$trans('Expected costs')} (${this.formatDinero(this.expected_costs_total_dinero)})`,
        `${this.$trans('Remaining')} (${this.formatDinero(rest_dinero)})`,
      ]
      colors = [
        this.getRandomColorOrderType(labels[0]),
        this.getRandomColorOrderType(labels[1]),
      ]
      data = [
        ((this.expected_costs.total / this.budget.amount) * 100).toFixed(2),
        ((rest / this.budget.amount) * 100).toFixed(2),
      ]
      this.chartdataExpectedCosts = {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
        }]
      }

      // set up detail chart
      const equipment_replacements_dinero = toDinero(
        this.expected_costs.equipment_replacements, this.$store.getters.getDefaultCurrency)

      labels = [
        `${this.$trans('Equipment replacements')} (${this.formatDinero(equipment_replacements_dinero)})`,
      ]

      colors = [
        this.getRandomColorOrderType(labels[0]),
      ]

      data = [
        ((this.expected_costs.equipment_replacements / this.costs.total) * 100).toFixed(2),
      ]

      for (const [companycode, amount] of Object.entries(this.expected_costs.partner_maintenance_contracts)) {
        const amount_dinero = toDinero(amount, this.$store.getters.getDefaultCurrency)
        labels.push(`${this.$trans('Maintenance contracts partners')} - ${companycode} (${this.formatDinero(amount_dinero)})`)
        colors.push(this.getRandomColorOrderType('Maintenance contracts partners'))
        data.push(((amount / this.expected_costs.total) * 100).toFixed(2))
      }

      for (const [customer_name, amount] of Object.entries(this.expected_costs.own_maintenance_contracts)) {
        const amount_dinero = toDinero(amount, this.$store.getters.getDefaultCurrency)
        const label = `${this.$trans('Own maintenance contracts')} - ${customer_name} (${this.formatDinero(amount_dinero)})`
        labels.push(label)
        colors.push(this.getRandomColorOrderType('Own maintenance contracts'))
        data.push(((amount / this.expected_costs.total) * 100).toFixed(2))
      }

      this.chartdataExpectedCostsDetail = {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
        }]
      }

      this.isLoading = false
    },
    goBack() {
      this.$router.go(-1)
    },
  }
}
</script>
