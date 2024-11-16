<template>
  <details :open="isView ? 'open' : ''">
    <SectionHeader
      :parent-has-quotation-lines="parentHasQuotationLines"
      :section-header="sectionHeader"
      :title="$trans('Distance')"
    />
    <b-overlay :show="compLoading" rounded="sm">
      <div
        v-for="(cost, index) in this.costService.collection"
        :key="index"
        style="padding-top: 8px;"
      >
        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Amount')"
          v-if="cost.quotation"
        >
          <b-form-input
            type="number"
            @blur="updateTotals"
            v-model="cost.amount_int"
            size="sm"
            style="width: 100px !important; float:left !important;"
            :disabled="parentHasQuotationLines"
          ></b-form-input>
          <div style="width: 100px !important; float:right !important;">
            {{ $trans('VAT') }}
            <VAT
              v-if="!parentHasQuotationLines"
              @vatChanged="(val) => changeVatType(cost, val)"
              style="width: 60px"
            />
            <span v-else>{{ cost.vat_type }}%</span>
          </div>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Price')"
          v-if="cost.quotation && !cost.savedHours"
        >
          <b-form-radio-group
            @change="updateTotals"
            v-model="cost.use_price"
            v-if="!parentHasQuotationLines"
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
                  v-model="cost.price_other"
                  :currency="cost.price_other_currency"
                  @priceChanged="(val) => otherPriceChanged(val, cost)"
                />
              </p>
            </b-form-radio>
          </b-form-radio-group>
          <b-form-input
            v-else
            :value="cost.price_dinero.toFormat('$0.00')"
            disabled="disabled"
          >
          </b-form-input>
        </b-form-group>

        <b-container>
          <b-row>
            <b-col cols="12">
              <div v-if="cost.total_dinero">
                <TotalsInputs
                  :total="cost.total_dinero"
                  :vat="cost.vat_dinero"
                />
              </div>
            </b-col>
          </b-row>
          <b-row v-if="!parentHasQuotationLines">
            <b-col cols="8"></b-col>
            <b-col cols="4">
              <b-button
                @click="() => deleteCost(index)"
                class="btn btn-danger"
                type="button"
                variant="danger"
              >
                {{ $trans("Delete cost") }}
              </b-button>
            </b-col>
          </b-row>
          <hr/>
        </b-container>
      </div>

      <b-container style="padding-top: 8px;">
        <b-row v-if="totalAmount">
          <b-col cols="12">
            <TotalRow
              class="total-row"
              v-if="!compLoading"
              :items_total="totalAmount"
              :total="total_dinero"
              :total_vat="totalVAT_dinero"
            />
            <hr/>
          </b-col>
        </b-row>
        <b-row v-if="parentHasQuotationLines">
          <b-col cols="12">
            <i><strong>{{ $trans("Delete existing distance quotation lines if you want to add or change items") }}</strong></i>
          </b-col>
        </b-row>
        <b-row v-if="(costService.collection.length || costService.deletedItems.length) && !parentHasQuotationLines">
          <b-col cols="4"></b-col>
          <b-col cols="8">
            <b-button
              :disabled="compLoading"
              @click="addCost"
              class="btn btn-primary"
              type="button"
            >
              {{ $trans('Add distance') }}
            </b-button>
            <span style="width: 80px">&nbsp;</span>
            <b-button
              :disabled="compLoading"
              @click="() => saveCosts()"
              class="btn btn-danger"
              type="button"
              variant="danger"
              v-if="costService.collection.length"
            >
              {{ $trans("Save distance costs") }}
            </b-button>
          </b-col>
        </b-row>
        <b-row v-if="!costService.collection.length && !parentHasQuotationLines">
          <b-col cols="7"></b-col>
          <b-col cols="5">
            <b-button
              :disabled="compLoading"
              @click="addCost"
              class="btn btn-primary"
              type="button"
            >
              {{ $trans('Add distance') }}
            </b-button>
          </b-col>
        </b-row>

        <b-row v-if="showAddQuotationLinesBlock">
          <b-col cols="12">
            <hr />
            <AddToQuotationLines
              :useOnQuotationOptions="useOnQuotationOptions"
              @buttonClicked="createQuotationLinesClicked"
            />
            <hr/>
          </b-col>
        </b-row>

      </b-container>
    </b-overlay>
  </details>
</template>
<script>
import quotationMixin from "./mixin.js";
import Multiselect from 'vue-multiselect'
import DurationInput from "../../../components/DurationInput.vue"
import {
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS
} from "./constants";
import {COST_TYPE_DISTANCE, CostService} from "@/models/quotations/Cost";
import HeaderCell from "./Header";
import VAT from "./VAT";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import TotalsInputs from "../../../components/TotalsInputs";
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import {toDinero} from "@/utils";
import AddToQuotationLines from './AddToQuotationLines.vue'
import {ChapterModel} from "@/models/quotations/Chapter";
import {USE_PRICE_CUSTOMER} from "@/views/quotations/quotation_form/constants";
import {CustomerModel} from "@/models/customer/Customer";
import {QuotationLineService} from "@/models/quotations/QuotationLine";
import SectionHeader from "@/views/quotations/quotation_form/SectionHeader.vue";

export default {
  name: "DistanceComponent",
  mixins: [quotationMixin],
  components: {
    SectionHeader,
    PriceInput,
    IconLinkDelete,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    DurationInput,
    AddToQuotationLines
  },
  props: {
    chapter: {
      type: ChapterModel,
      default: null
    },
    customer:{
      type: CustomerModel,
      default: null
    },
    quotationLinesParent: {
      type: [Array],
      default: null
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  computed: {
    compLoading () {
      return this.isLoading
    },
    showAddQuotationLinesBlock() {
      return this.costService.collection.length && !this.parentHasQuotationLines
    }
  },
  watch: {
    quotationLinesParent(newVal) {
      this.checkParentHasQuotationLines(newVal)
    }
  },
  data() {
    return {
      isLoading: false,
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      costService: new CostService(),
      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      default_hourly_rate: this.$store.getters.getInvoiceDefaultHourlyRate,
      invoice_default_price_per_km: this.$store.getters.getInvoiceDefaultPricePerKm,
      quotationLineType: COST_TYPE_DISTANCE,
      parentHasQuotationLines: false,
      quotationLineService: new QuotationLineService(),
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

    if (this.chapter.id) {
      this.costService.addListArg(`chapter=${this.chapter.id}`)
      this.costService.addListArg(`cost_type=${COST_TYPE_DISTANCE}`)
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    addCost() {
      this.costService.collection.push(
        new this.costService.model({
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: this.getPrice(
            {use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          price_currency: this.getCurrency(
            {use_price: this.usePriceOptions.USE_PRICE_SETTINGS}),
          use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
          price_other_currency: this.getCurrency(
            {use_price: this.usePriceOptions.USE_PRICE_OTHER}),
          cost_type: COST_TYPE_DISTANCE,
          margin_perc: 0
        })
      )
      this.updateTotals()
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      if (this.costService.collection.length === 0) {
        this.addCost()
      }
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Created'), this.$trans('Distance costs updated'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        console.log('Error updating distance costs', error)
        this.errorToast(this.$trans('Error updating distance costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true

      try {
        const response = await this.costService.list()
        this.costService.collection = response.results.map((cost) => {
          if (cost.use_price === this.usePriceOptions.USE_PRICE_OTHER) {
            cost.price_other = cost.price
            cost.price_other_currency = cost.price_currency
          }
          cost.distanceSaved = true
          return new this.costService.model(cost)
        })
        this.updateTotals()
        this.checkParentHasQuotationLines(this.quotationLinesParent)
        if (this.costService.collection.length === 0) {
          this.addCost()
        }
        this.isLoading = false
      } catch(error) {
        this.errorToast(this.$trans('Error fetching distance costs'))
        this.isLoading = false
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id
      }
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
    getCurrency(_activity) {
      return this.default_currency
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
      this.totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_int),
        0
      )
    },
    getDescriptionUserTotalsQuotationLine(_cost) {
      return `${this.$trans("distance")}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${this.$trans("Distance")}`
    },
    getTotalAmountQuotationLine() {
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
