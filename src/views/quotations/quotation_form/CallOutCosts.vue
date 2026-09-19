<template>
  <b-overlay :show="isLoading" rounded="sm">
    <details :open="isView ? 'open' : ''">
      <SectionHeader
        :parent-has-quotation-lines="parentHasQuotationLines"
        :section-header="sectionHeader"
        :title="$trans('Call-out costs')"
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
                  v-bind:label="$trans('Amount')"
                  v-if="cost.quotation"
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
                >
                  <PriceInput
                    v-model="cost.price"
                    :currency="cost.price_currency"
                    @priceChanged="(val) => priceChanged(val, cost)"
                    v-if="!isView"
                  />
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
            {{ $trans("Add call-out cost") }}
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
import PriceInput from "@/components/PriceInput";

import {errorToast, infoToast, $trans} from "@/services/i18n";

import {COST_TYPE, CostService} from "@/models/quotations/Cost";
import {QuotationLineService} from "@/models/quotations/QuotationLine";

import quotationMixin from "./mixin.js";
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
  name: "CallOutCosts",
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
      type: Object,
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
      costService: new CostService(),
      default_currency: this.mainStore.getDefaultCurrency,
      default_vat: this.mainStore.getQuotationDefaultVat,
      default_call_out_costs: this.mainStore.getQuotationDefaultCallOutCosts,
      quotationLineType: COST_TYPE.CALL_OUT_COSTS,
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

    if (this.chapter.id) {
      this.costService.addListArg(`chapter=${this.chapter.id}`)
      this.costService.addListArg(`cost_type=${COST_TYPE.CALL_OUT_COSTS}`)
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    priceChanged(priceDinero, cost) {
      cost.setPriceField('price', priceDinero)
      this.updateTotals()
      this.hasChanges = true
    },
    addCost() {
      this.costService.collection.push(
        new this.costService.model({
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: this.default_call_out_costs,
          price_currency: this.default_currency,
          cost_type: COST_TYPE.CALL_OUT_COSTS,
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
        infoToast(this.create, $trans('Created'), $trans('Call-out costs have been updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error creating call out costs', error)
        errorToast(this.create, $trans('Error creating call-out costs'))
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
        await this.costService.loadCollection()
        this.costService.collection = this.costService.collection.map((cost) => {
          cost.callOutCostSaved = true
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
        console.log('error fetching call out costs costs', error)
        errorToast(this.create, $trans('Error fetching costs'))
        this.isLoading = false
        this.isLoaded = true
      }
    },
    getDefaultProps() {
      return {
        quotation: this.chapter.quotation,
        chapter: this.chapter.id,
        vat_type: this.default_vat
      }
    },
    getPrice(cost) {
      return cost.price
    },
    getCurrency(cost) {
      return cost.price_currency || this.default_currency
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
      return `${$trans("Call-out costs")}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${$trans("Call-out costs")}`
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    }
  }
}
</script>
<style scoped>
</style>
