<template>
  <b-overlay :show="compLoading" rounded="sm">
    <details :open="isView ? 'open' : ''">
      <SectionHeader
        :parent-has-quotation-lines="parentHasQuotationLines"
        :section-header="sectionHeader"
        :title="$trans('Distance')"
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
                  v-bind:label="$trans('Kilometers')"
                >
                  <BFormInput
                    type="number"
                    @blur="amountChanged"
                    v-model="cost.amount_int"
                    size="sm"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="3">
                <BFormGroup
                  v-bind:label="$trans('Price')"
                  v-if="cost.quotation"
                >
                  <BFormRadioGroup
                    @change="updateTotals"
                    v-model="cost.use_price"
                    v-if="!parentHasQuotationLines"
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
                        @priceChanged="(val) => otherPriceChanged(val, cost)"
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
            {{ $trans("Add distance") }}
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
import {toDinero} from "@/utils";
import PriceInput from "@/components/PriceInput";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

import {COST_TYPE_DISTANCE, CostService} from "@/models/quotations/Cost";
import {ChapterModel} from "@/models/quotations/Chapter";
import {CustomerModel} from "@/models/customer/Customer";
import {QuotationLineService} from "@/models/quotations/QuotationLine";

import {
  USE_PRICE_OTHER,
  USE_PRICE_SETTINGS,
  USE_PRICE_CUSTOMER
} from "./constants";
import quotationMixin from "./mixin.js";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import AddToQuotationLines from './AddToQuotationLines.vue'
import SectionHeader from "./SectionHeader.vue";
import EmptyQuotationLinesContainer from "./EmptyQuotationLinesContainer.vue";
import CostsTable from "./CostsTable.vue";

export default {
  name: "DistanceComponent",
  mixins: [quotationMixin],
  components: {
    CostsTable,
    EmptyQuotationLinesContainer,
    SectionHeader,
    PriceInput,
    VAT,
    TotalRow,
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
    showSaveButton() {
      return !this.hasChanges
    },
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
      default_vat: this.$store.getters.getQuotationDefaultVat,
      default_price_per_km: this.$store.getters.getQuotationDefaultPricePerKm,
      quotationLineType: COST_TYPE_DISTANCE,
      parentHasQuotationLines: false,
      quotationLineService: new QuotationLineService(),
      isLoaded: false,
      hasChanges: false
    }
  },
  async created() {
    this.isLoading = true
    // set vars in service
    this.costService.default_vat = this.default_vat
    this.costService.default_currency = this.default_currency

    this.default_price_per_km_dinero = toDinero(
      this.default_price_per_km,
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
      this.hasChanges = true
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
      this.hasChanges = true
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        infoToast(create, $trans('Created'), $trans('Distance costs updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error updating distance costs', error)
        errorToast(create, $trans('Error updating distance costs'))
        this.isLoading = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
      this.hasChanges = true
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true
      this.isLoaded = false

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
        this.isLoaded = true
      } catch(error) {
        console.log('error fetching distance cost', error)
        errorToast(create, $trans('Error fetching distance costs'))
        this.isLoading = false
        this.isLoaded = true
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SETTINGS,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id,
        vat_type: this.default_vat
      }
    },
    getPriceFor(usePrice) {
      switch (usePrice) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_price_per_km_dinero
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        default:
          console.log(`getPriceFor - unknown use price: ${usePrice}`)
          return "0.00"
      }
    },
    getPrice(cost) {
      switch (cost.use_price) {
        case this.usePriceOptions.USE_PRICE_SETTINGS:
          return this.default_price_per_km
        case this.usePriceOptions.USE_PRICE_CUSTOMER:
          return this.customer.price_per_km
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
    amountChanged() {
      this.hasChanges = true
      this.updateTotals()
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
      this.totalAmount = this.costService.collection.reduce(
        (total, m) => (total + m.amount_int),
        0
      )
    },
    getDescriptionUserTotalsQuotationLine(_cost) {
      return `${$trans("distance")}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${$trans("Distance")}`
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    },
  }
}
</script>
<style scoped>
</style>
