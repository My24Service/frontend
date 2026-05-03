<template>
  <b-overlay :show="compLoading" rounded="sm">
    <details :open="isView ? 'open' : ''">
      <SectionHeader
        :parent-has-quotation-lines="parentHasQuotationLines"
        :section-header="sectionHeader"
        :title="getTitle()"
      />

      <div v-if="parentHasQuotationLines && isLoaded">
        <CostsTable
          :collection="costService.collection"
          :type="quotationLineType"
        />
        <hr/>
      </div>

      <div v-if="!parentHasQuotationLines && isLoaded">
        <div
          v-for="(cost, index) in this.costService.collection"
          :key="index"
        >
          <b-container>
            <b-row>
              <b-col cols="2">
                <BFormGroup
                  v-bind:label="$trans('Hours')"
                >
                  <DurationInput
                    style="width: 80px !important;"
                    v-model="cost.amount_duration"
                    @durationChanged="(duration) => changeDuration(cost, duration)"
                    v-if="!isView"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="3">
                <BFormGroup
                  v-bind:label="$trans('Engineer rate')"
                >
                  <BFormRadioGroup
                    @change="updateTotals"
                    v-model="cost.use_price"
                    v-if="!isView"
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
                        {{ $trans("Other") }}
                        <PriceInput
                          v-model="cost.price_other"
                          :currency="cost.price_other_currency"
                          @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, cost)"
                          @receivedFocus="cost.use_price = usePriceOptions.USE_PRICE_OTHER"
                        />
                    </BFormRadio>
                  </BFormRadioGroup>
                </BFormGroup>
              </b-col>
              <b-col cols="2">
                <BFormGroup
                  v-bind:label="$trans('VAT type')"
                >
                  <VAT
                    @vatChanged="(val) => changeVatType(cost, val)"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <BFormGroup
                  v-bind:label="$trans('VAT')"
                >
                  <BFormInput
                    readonly
                    disabled
                    :value="cost.vat_dinero.toFormat('$0.00')"
                    class="text-right pr-0"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <BFormGroup
                  v-bind:label="$trans('Total')"
                >
                  <BFormInput
                    readonly
                    disabled
                    class="text-right pr-0"
                    :value="cost.total_dinero.toFormat('$0.00')"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
          </b-container>
          <b-container>
            <b-row>
              <b-col cols="12" class="text-center">
                <BButton
                  @click="() => deleteCost(index)"
                  type="button"
                  variant="danger"
                  size="sm"
                >
                  {{ $trans("Delete cost") }}
                </BButton>
              </b-col>
            </b-row>
            <hr/>
          </b-container>
        </div>
        <div class="text-center">
          <BButton
            :disabled="collectionHasEmptyItem"
            @click="addCost"
            class="btn btn-primary"
            type="button"
          >
            {{ $trans(`Add ${this.getTitle().toLocaleLowerCase()}`) }}
          </BButton>
          <span style="width: 80px">&nbsp;</span>
          <BButton
            :disabled="showSaveButton"
            @click="() => saveCosts()"
            type="button"
            variant="primary"
          >
            {{ $trans("Save changes") }}
          </BButton>
        </div>
        <hr/>
      </div>

      <div v-if="!isCollectionEmpty">
        <TotalRow
          :items_total="totalAmount"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />
        <hr/>
      </div>

      <EmptyQuotationLinesContainer
        v-if="parentHasQuotationLines"
        class="text-center"
        @buttonClicked="() => { emptyQuotationLines() }"
      />

      <div v-if="showAddQuotationLinesBlock" class="text-center">
        <AddToQuotationLines
          :useOnQuotationOptions="useOnQuotationOptions"
          @buttonClicked="createQuotationLinesClicked"
        />
      </div>

    </details>
  </b-overlay>
</template>
<script>
import moment from 'moment'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

import {toDinero} from "@/utils";
import DurationInput from "@/components/DurationInput.vue"
import PriceInput from "@/components/PriceInput";

import {ChapterModel} from "@/models/quotations/Chapter";
import {QuotationLineService} from "@/models/quotations/QuotationLine";
import {
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS,
  CostService
} from "@/models/quotations/Cost";

import quotationMixin from "./mixin.js";
import {
  USE_PRICE_CUSTOMER,
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS
} from "./constants";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import AddToQuotationLines from './AddToQuotationLines.vue'
import SectionHeader from "./SectionHeader.vue";
import EmptyQuotationLinesContainer from "./EmptyQuotationLinesContainer.vue";
import CostsTable from "./CostsTable.vue";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  name: "HoursComponent",
  mixins: [quotationMixin],
  components: {
    CostsTable,
    EmptyQuotationLinesContainer,
    SectionHeader,
    PriceInput,
    VAT,
    TotalRow,
    DurationInput,
    AddToQuotationLines
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    chapter: {
      type: ChapterModel,
      default: null
    },
    customer:{
      type: Object,
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
  watch: {
    quotationLinesParent(newVal) {
      this.checkParentHasQuotationLines(newVal)
    }
  },
  computed: {
    compLoading () {
      return this.isLoading
    },
    quotationLineType() {
      return this.type
    },
    showSaveButton() {
      return !this.hasChanges
    },
  },
  data() {
    return {
      isLoading: false,
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      usePriceOptions: {
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },
      default_currency: this.mainStore.getDefaultCurrency,
      default_vat: this.mainStore.getQuotationDefaultVat,
      default_hourly_rate: this.mainStore.getQuotationDefaultHourlyRate,
      hasStoredData: false,
      costService: new CostService(),
      quotationLineService: new QuotationLineService(),
      parentHasQuotationLines: false,
      isLoaded: false,
      hasChanges: false
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.default_vat = this.default_vat
    this.costService.default_currency = this.default_currency

    if (this.chapter.id) {
      this.costService.addListArg(`chapter=${this.chapter.id}`)
      this.costService.addListArg(`cost_type=${this.type}`)
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price_other', priceDinero)
      this.updateTotals()
      this.hasChanges = true
    },
    getTitle() {
      switch (this.type) {
        case COST_TYPE_WORK_HOURS:
          return $trans("Work hours")
        case COST_TYPE_TRAVEL_HOURS:
          return $trans("Travel hours")
        default:
          throw `getTitle(), unknown type ${this.type}`
      }
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
          cost_type: this.type,
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
        infoToast(this.create, $trans('Created'), $trans('Hours costs have been updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error creating hours costs', error)
        errorToast(this.create, $trans('Error creating hours costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
      this.hasChanges = true
    },
    changeDuration(cost, duration) {
      cost.amount_duration = duration
      cost.amount_duration_secs = moment.duration(duration).asSeconds()
      this.updateTotals()
      this.hasChanges = true
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true
      this.isLoaded = false

      try {
        await this.costService.loadCollection()
        this.costService.collection = this.costService.collection.map((cost) => {
          if (cost.use_price === this.usePriceOptions.USE_PRICE_OTHER) {
            cost.price_other = cost.price
            cost.price_other_currency = cost.price_currency
          }
          cost.savedHours = true
          return new this.costService.model(cost)
        })
        if (this.costService.collection.length === 0) {
          this.addCost()
        }
        this.updateTotals()
        this.checkParentHasQuotationLines(this.quotationLinesParent)
        this.isLoading = false
        this.isLoaded = true
      } catch(error) {
        console.log('error fetching hours costs', error)
        errorToast(this.create, $trans('Error fetching hours cost'))
        this.isLoading = false
        this.isLoaded = true
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id,
        amount_duration_read: "0:00",
        amount_duration_secs: 0,
        vat_type: this.default_vat
      }
    },
    getPriceFor(usePrice) {
      switch (usePrice) {
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.hourly_rate_engineer_dinero
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return toDinero(this.default_hourly_rate, this.default_currency)
        default:
          throw `getPriceFor: unknown usePrice for: ${usePrice}`
      }
    },
    getPrice(cost) {
      switch (cost.use_price) {
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.hourly_rate_engineer
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_hourly_rate
        case this.usePriceOptions.USE_PRICE_OTHER:
          return cost.price_other
        default:
          console.log(`getPrice - unknown use price: ${cost.use_price}`)
          return "0.00"
      }
    },
    getCurrency(_activity) {
      return this.default_currency
    },
    updateTotals() {
      // to make sure our computed gets triggered
      this.isLoading = true
      this.isLoading = false
      if (this.isCollectionEmpty) {
        return
      }

      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
      const totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_duration_secs),
        0
      )
      this.totalAmount = totalAmount ? Math.round(totalAmount / 3600) : 0
    },
    getDescriptionUserTotalsQuotationLine(_cost) {
      return this.getTitle()
    },
    getDescriptionOnlyTotalQuotationLine() {
      return this.getTitle()
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    },
  }
}
</script>
<style scoped>
</style>
