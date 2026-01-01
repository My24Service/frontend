<template>
  <details>
    <summary class='flex-columns space-between'>
      <h6>{{$trans('Distance')}}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>
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
            :text='$trans("Engineer")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text="$trans('To/Back')"
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Total")'
            />
          </b-col>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Rate")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("VAT type")'
            />
          </b-col>
          <b-col cols="3" />
        </b-row>
        <b-row v-for="distance in costService.collection" :key="distance.user_id" class="distance_row">
          <b-col cols="2" v-if="!distance.is_partner">
            {{ getFullname(distance.user) }}
          </b-col>
          <b-col cols="2" v-else>
            {{ distance.full_name }} ({{ distance.partner_companycode }})
          </b-col>
          <b-col cols="1">
            <input type="number" class="form-control form-control-sm" v-model.number="distance.distance_to_total" style="display:inline-block;width:3.5em;text-align:right" v-on:change="distanceChange(distance,$event)" />
            <input type="number" class="form-control form-control-sm" v-model.number="distance.distance_back_total" style="display:inline-block;width:3.5em;text-align:right" v-on:change="distanceChange(distance,$event)" />
          </b-col>
          <b-col cols="1">
            {{ distance.distance_total }}
          </b-col>
          <b-col cols="3">
            <BFormRadioGroup
              @change="updateTotals"
              v-model="distance.use_price"
            >
              <BFormRadio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getPriceFor(usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="distance.price_other"
                    :currency="distance.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val, distance)"
                  />
                </p>
              </BFormRadio>
            </BFormRadioGroup>
          </b-col>
          <b-col cols="2">
            <VAT @vatChanged="(val) => changeVatType(distance, val)" />
          </b-col>
          <b-col cols="3">
            <TotalsInputs
              :total="distance.total_dinero"
              :vat="distance.vat_dinero"
            />
          </b-col>
        </b-row>
        <TotalRow
          :items_total="distance_total"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />

        <CollectionSaveContainer
          @buttonClicked="() => { saveCollection() }"
        />

      </b-container>
    </b-overlay>
  </details>
</template>

<script>
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import invoiceLineService from "../../../models/invoices/InvoiceLine";
import {
  INVOICE_LINE_TYPE_DISTANCE,
  USE_PRICE_CUSTOMER,
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS
} from "./constants";
import {toDinero} from "@/utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import CostService,{
  COST_TYPE_DISTANCE,
} from "../../../models/orders/Cost";
import CollectionSaveContainer from "./CollectionSaveContainer";
import CollectionEmptyContainer from "./CollectionEmptyContainer";
import CostsTable from "./CostsTable";
import AddToInvoiceLinesDiv from "./AddToInvoiceLinesDiv";
import TotalsInputs from "../../../components/TotalsInputs";

export default {
  name: "DistanceComponent",
  emits: ['invoiceLinesCreated'],
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
    user_totals: {
      type: [Array],
      default: null
    },
    engineer_models: {
      type: [Array],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
    distance_total: {
      type: [Number],
      default: null
    },
    invoice_default_price_per_km: {
      type: [String],
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
      costService: new CostService(),
      distanceTotal: null,

      total_dinero: null,
      totalVAT_dinero: null,

      invoice_default_price_per_km_dinero: null,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,

      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },

      hasStoredData: false,
      costType: COST_TYPE_DISTANCE,
      parentHasInvoiceLines: false,
      invoiceLineType: INVOICE_LINE_TYPE_DISTANCE,
      invoiceLineService,
    }
  },
  async created() {
    this.isLoading = true

    // set vars in service
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    this.invoice_default_price_per_km_dinero = toDinero(
      this.invoice_default_price_per_km,
      this.default_currency
    )

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_DISTANCE}`)

    await this.loadData()
    this.checkParentHasInvoiceLines(this.invoiceLinesParent)

    this.isLoading = false
  },
  methods: {

    distanceChange( distance, event ) {
      // Recalculate the values to when adding invoice lines, the correct total distance is shown.
      distance.distance_total = distance.distance_to_total + distance.distance_back_total
      distance.amount_int = distance.distance_total

      distance.total = distance.distance_total * distance.price
      distance.total_dinero = toDinero( distance.total, distance.total_currency )

      distance.vat = distance.vat_type > 0 ? (distance.total * (distance.vat_type / 100)).toFixed(2 ) : 0
      distance.vat_dinero = toDinero( distance.vat, distance.vat_currency )

      let distanceTotal = 0
      for (const c of this.costService.collection) {
        if (c.cost_type === 'distance')
          distanceTotal += c.amount_int
      }

      // This only gets assigned if the user overrides the distance (we
      // cannot modify `this.distance_total` because that's a no mutating prop):
      this.distanceTotal = distanceTotal
      // this.distance_total = distanceTotal
    },
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
        this.hasStoredData = true
      } else {
        console.log(this.user_totals)
        // map input to Cost model collection
        this.costService.collection = this.user_totals.map((activity) => (
          this.costService.newModelFromDistance(
            activity,
            this.getPrice({...activity, use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
            this.getCurrency({...activity, use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
            this.getDefaultProps()
          )))
        this.updateTotals()
      }
    },
    getDefaultProps() {
      return {
        order: this.order_pk,
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS
      }
    },
    otherPriceChanged(priceDinero, distance) {
      distance.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    getPriceFor(type) {
      switch (type) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        default:
          throw `getPrice: unknown use_price: ${type}`
      }
    },
    getPrice(distance) {
      switch (distance.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km
        case this.usePriceOptions.USE_PRICE_OTHER:
          return distance.price_other
        default:
          throw `getPrice: unknown use_price: ${distance.use_price}`
      }
    },
    getCurrency(distance) {
      switch (distance.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return distance.price_other_currency
        default:
          throw `getCurrency: unknown use_price: ${distance.use_price}`
      }
    },
    updateTotals() {
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
    },
    getDescriptionUserTotalsInvoiceLine(cost) {
      return `${$trans("distance")}: ${cost.user_full_name}`
    },
    getDescriptionOnlyTotalInvoiceLine() {
      return `${$trans("Distance")}`
    },
    getTotalAmountInvoiceLine() {
      // If there is a user override for distance, the non-mutable distance_total contains
      // the invalid, previous, value.
      return (this.distanceTotal !== null) ? this.distanceTotal : this.distance_total
    },
    // createInvoiceLines in mixin
  },
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
