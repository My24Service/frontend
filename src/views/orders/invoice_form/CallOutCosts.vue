<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div
      class="costs-table"
      v-if="!isLoading && hasStoredData"
    >
      <CostsTable
        :collection="costService.collection"
        :type="costType"
      />

      <CollectionEmptyContainer
        @buttonClicked="() => { emptyCollectionClicked() }"
      />
      <hr>
      <AddToInvoiceLinesDiv
        v-if="!parentHasInvoiceLines"
        :useOnInvoiceOptions="useOnInvoiceOptions"
        @buttonClicked="createInvoiceLinesClicked"
      />

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
        <b-col cols="2">
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
          ></b-form-input>
        </b-col>
        <b-col cols=6>
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
            </b-form-radio><br/>

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
        <b-col cols="2">
          <VAT @vatChanged="(val) => changeVatType(coc_item, val)" />
        </b-col>
        <b-col cols="2">
          <TotalsInputs
            :total="coc_item.total_dinero"
            :vat="coc_item.vat_dinero"
          />
        </b-col>
      </b-row>
      <TotalRow
        :items_total="totalAmount"
        :total="total_dinero"
        :total_vat="totalVAT_dinero"
      />

      <CollectionSaveContainer
        @buttonClicked="() => { saveCollection() }"
      />

    </b-container>
  </b-overlay>
</template>

<script>
import {toDinero} from "@/utils";
import {
  INVOICE_LINE_TYPE_CALL_OUT_COSTS,
  USE_PRICE_CUSTOMER,
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS
} from "./constants";
import PriceInput from "../../../components/PriceInput";
import Collapse from "../../../components/Collapse";
import HeaderCell from "./Header";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import invoiceMixin from "./mixin";
import CostService, {COST_TYPE_CALL_OUT_COSTS} from "../../../models/orders/Cost";
import {InvoiceLineService} from "../../../models/orders/InvoiceLine";
import CollectionSaveContainer from "./CollectionSaveContainer";
import CollectionEmptyContainer from "./CollectionEmptyContainer";
import CostsTable from "./CostsTable";
import AddToInvoiceLinesDiv from "./AddToInvoiceLinesDiv";
import TotalsInputs from "../../../components/TotalsInputs";

export default {
  name: "CallOutCostsComponent",
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Collapse,
    HeaderCell,
    VAT,
    TotalRow,
    CollectionSaveContainer,
    CollectionEmptyContainer,
    CostsTable,
    AddToInvoiceLinesDiv,
    TotalsInputs,
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
    invoiceLinesParent: {
      type: [Array],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_call_out_costs_dinero: null,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,

      costService: new CostService(),
      coc_item: null,

      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,

      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

      hasStoredData: false,
      costType: COST_TYPE_CALL_OUT_COSTS,
      parentHasInvoiceLines: false,
      invoiceLineType: INVOICE_LINE_TYPE_CALL_OUT_COSTS,
      invoiceLineService: new InvoiceLineService(),
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_CALL_OUT_COSTS}`)

    this.invoice_default_call_out_costs_dinero = toDinero(
      this.invoice_default_call_out_costs,
      this.default_currency
    )

    await this.loadData()
    this.checkParentHasInvoiceLines(this.invoiceLinesParent)

    this.isLoading = false
  },
  methods: {
    emptyCollectionClicked() {
      this.emptyCollection()
      this.$emit('emptyCollectionClicked', this.invoiceLineType)
    },
    async loadData() {
      this.costService.collection = []
      this.hasStoredData = false
      // check if we already stored costs
      const response = await this.costService.list()
      if (response.results.length > 0) {
        this.costService.collection = response.results.map((cost) => (
          new this.costService.model(cost)
        ))

        this.total_dinero = this.costService.getItemsTotal()
        this.totalVAT_dinero = this.costService.getItemsTotalVAT()

        // calc total amount
        this.totalAmount = this.costService.collection.reduce(
          (total, m) => (total + m.amount_int),
          0
        )

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

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()

      // calc total amount
      this.totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_int),
        0
      )
    },
    getDescriptionUserTotalsInvoiceLine(cost) {
      return `${this.$trans("Call out costs")}`
    },
    getDescriptionOnlyTotalInvoiceLine() {
      return `${this.$trans("Call out costs")}`
    },
    getTotalAmountInvoiceLine() {
      return this.totalAmount
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
