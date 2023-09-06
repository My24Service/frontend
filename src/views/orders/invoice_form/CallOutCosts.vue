<template>
  <b-overlay :show="isLoading" rounded="sm">
    <Collapse
      :title="$trans('Call out costs')"
    >
      <div
        class="costs=table"
        v-if="hasStoredData"
      >
        <b-table
          small
          id="document-table"
          :fields="tableFields"
          :items="costService.collection"
          responsive="md"
          class="data-table"
        >
          <template #cell(margin)="data">
            {{ data.item.margin_dinero.toFormat('$0.00') }} ({{ data.item.margin_perc }}%)
          </template>
          <template #cell(vat)="data">
            {{ data.item.vat_dinero.toFormat('$0.00') }} ({{ data.item.vat_type }}%)
          </template>
          <template #cell(total)="data">
            {{ data.item.total_dinero.toFormat('$0.00') }}
          </template>
        </b-table>

        <div class="save-collection">
          <b-container>
            <b-row>
              <b-col cols="8"></b-col>
              <b-col cols="4" class="pull-right">
                <b-button
                  @click="() => { emptyCollection() }"
                  class="btn btn-danger update-button"
                  type="button"
                  variant="danger"
                >
                  {{ $trans("Remove saved costs") }}
                </b-button>
              </b-col>
            </b-row>
          </b-container>
        </div>

      </div>

      <b-container fluid v-if="!isLoading && !hasStoredData">
        <b-row>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Amount")'
            />
          </b-col>
          <b-col cols="6">
            <HeaderCell
              :text='$trans("Rate")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Margin")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("VAT type")'
            />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row>
          <b-col cols="2">
            <b-form-input
              @blur="updateTotals"
              v-model="coc_item.amount_int"
              size="sm"
              class="input-margin"
            ></b-form-input>
          </b-col>
          <b-col cols="6">
            <b-form-radio-group
              @change="updateTotals"
              v-model="coc_item.use_price"
            >
              <b-form-radio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="coc_item.price_other"
                    :currency="coc_item.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val)"
                  />
                </p>
              </b-form-radio>
            </b-form-radio-group>
          </b-col>
          <b-col cols="1">
            <MarginInput
              :margin="coc_item.margin_perc"
              @inputChanged="(val) => marginChanged(coc_item, val)"
            />
          </b-col>
          <b-col cols="1">
            <VAT @vatChanged="(val) => changeVatType(coc_item, val)" />
          </b-col>
          <b-col cols="2">
            <Totals
              :total="coc_item.total_dinero"
              :margin="coc_item.margin_dinero"
              :vat="coc_item.vat_dinero"
            />
          </b-col>
        </b-row>
        <TotalRow
          :items_total="coc_item.amount_int"
          :total="total"
          :total_vat="totalVAT"
        />

        <div class="save-collection">
          <b-container>
            <b-row>
              <b-col cols="8"></b-col>
              <b-col cols="4" class="pull-right">
                <p>
                  <i>{{ $trans('Saving costs will give insights in profit') }}</i>
                </p>
                <b-button
                  @click="() => { saveCollection() }"
                  class="btn btn-danger update-button"
                  type="button"
                  variant="danger"
                >
                  {{ $trans("Save costs") }}
                </b-button>
              </b-col>
            </b-row>
          </b-container>
        </div>
      </b-container>

      <div class="use-on-invoice-container">
        <h4>{{ $trans("What to add as invoice lines")}}</h4>
        <b-form-group>
          <b-form-radio-group
            v-model="useOnInvoiceSelected"
            :options="useOnInvoiceOptions"
          ></b-form-radio-group>
        </b-form-group>
      </div>

    </Collapse>
  </b-overlay>
</template>

<script>
import {toDinero} from "../../../utils";
import {
  OPTION_CALL_OUT_COSTS_TOTALS,
  OPTION_NONE, USE_PRICE_CUSTOMER, USE_PRICE_OTHER, USE_PRICE_SETTINGS
} from "./constants";
import PriceInput from "../../../components/PriceInput";
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import invoiceMixin from "./mixin";
import CostService, {COST_TYPE_CALL_OUT_COSTS} from "../../../models/orders/Cost";

export default {
  name: "CallOutCostsComponent",
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
  },
  props: {
    order_pk: {
      type: [Number],
      default: null
    },
    invoice_default_call_out_costs: {
      type: [Number, String],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_call_out_costs_dinero: null,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      costService: new CostService(),
      coc_item: null,

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_CALL_OUT_COSTS_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

      tableFields: [
        {key: 'amount_int', label: this.$trans('Amount')},
        {key: 'use_price', label: this.$trans('Use price')},
        {key: 'margin', label: this.$trans('Margin')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
      ],

      hasStoredData: false
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.invoice_default_margin = this.invoice_default_margin
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_CALL_OUT_COSTS}`)

    this.invoice_default_call_out_costs_dinero = toDinero(
      this.invoice_default_call_out_costs,
      this.default_currency
    )

    await this.loadData()

    this.isLoading = false
  },
  methods: {
    async loadData() {
      this.costService.collection = []
      this.hasStoredData = false
      // check if we already stored costs
      const response = await this.costService.list()
      if (response.results.length > 0) {
        this.costService.collection = response.results.map((cost) => (
          new this.costService.model(cost)
        ))
        this.hasStoredData = true
      } else {
        // create Cost model and set collection
        this.coc_item = this.costService.newModelFromCallOutCosts({
            amount_int: 1,
            ...this.getDefaultProps(),
          },
          this.getPrice({use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          this.getCurrency({use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          this.getDefaultProps()
        )
        this.costService.collection.push(this.coc_item)
        this.updateTotals()
      }
    },
    async emptyCollection() {
      this.isLoading = true
      try {
        await this.costService.emptyCollection()
        await this.loadData()
      } catch (e) {
        console.log(e)
        this.errorToast(this.$trans('Error removing costs'))
      }
      this.isLoading = false
    },
    async saveCollection() {
      this.isLoading = true
      try {
        await this.costService.updateCollection()
        await this.loadData()
        this.infoToast(this.$trans('Saved'), this.$trans('Costs saved'))
      } catch (e) {
        console.log(e)
        this.errorToast(this.$trans('Error saving costs'))
      }
      this.isLoading = false
    },
    getDefaultProps() {
      return {
        order: this.order_pk,
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
      }
    },
    getPriceFor(type) {
      switch (type) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_dinero
        default:
          throw `getPrice: unknown use_price: ${type}`
      }
    },
    getPrice(item) {
      switch (item.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_call_out_costs
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs
        case this.usePriceOptions.USE_PRICE_OTHER:
          return item.price_other
        default:
          throw `getPrice: unknown use_price: ${this.coc_item.use_price}`
      }
    },
    getCurrency(item) {
      switch (item.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.call_out_costs_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return item.price_other_currency
        default:
          throw `getCurrency: unknown use_price: ${this.coc_item.use_price}`
      }
    },
    otherPriceChanged(priceDinero) {
      this.coc_item.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    updateTotals() {
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()
    },
  }
}
</script>

<style scoped>
.save-collection {
  padding-top: 10px;
}
</style>
