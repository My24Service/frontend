<template>
  <b-overlay :show="isLoading" rounded="sm">
    <details :open="isView ? 'open' : ''">
      <SectionHeader
        :parent-has-quotation-lines="parentHasQuotationLines"
        :section-header="sectionHeader"
        :title="$trans('Materials')"
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
          class="material_row"
        >
          <b-container>
            <b-row>
              <b-col cols="12">
                <b-form-group
                  label-cols="3"
                  v-bind:label="$trans('Material')"
                  label-for="material-search"
                  v-if="!cost.material"
                >
                  <multiselect
                    id="material-search"
                    track-by="id"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="materials"
                    :loading="fetchingMaterials"
                    :multiple="false"
                    :internal-search="false"
                    :clear-on-select="false"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="false"
                    :hide-selected="true"
                    @search-change="getMaterialsDebounced"
                    @select="(material) => selectMaterial(material, index)"
                    :custom-label="materialLabel"
                    ref="searchMaterial"
                  >
                    <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                  </multiselect>
                </b-form-group>
                <b-form-group
                  label-for="material-search"
                  v-if="cost.material"
                >
                  <b-form-input
                    readonly
                    :value="cost.material_name"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row v-if="cost.material">
              <b-col cols="2">
                <b-form-group
                  v-bind:label="`${$trans('Amount')}`"
                  label-for="material-amount"
                >
                  <b-form-input
                    :value="Math.round(cost.amount_decimal)"
                    @change="(amount) => changeAmount(cost, amount)"
                  ></b-form-input>
                </b-form-group>
              </b-col>
              <b-col cols="3">
                <b-form-group
                  v-bind:label="$trans('Price')"
                  label-for="material-price"
                >
                  <b-form-radio-group
                    @change="updateTotals"
                    v-model="cost.use_price"
                  >
                    <b-form-radio :value="usePriceOptions.USE_PRICE_PURCHASE">
                      {{ $trans('Pur.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
                    </b-form-radio>

                    <b-form-radio :value="usePriceOptions.USE_PRICE_SELLING">
                      {{ $trans('Sel.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
                    </b-form-radio>

                    <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                      {{ $trans("Other") }}
                      <PriceInput
                        style="margin-left: -24px; margin-top: 2px;"
                        v-model="cost.price_other"
                        :currency="cost.price_other_currency"
                        @priceChanged="(val) => otherPriceChanged(val, cost)"
                        @receivedFocus="cost.use_price = usePriceOptions.USE_PRICE_OTHER"
                      />
                    </b-form-radio>
                  </b-form-radio-group>
                </b-form-group>
              </b-col>
              <b-col cols="2">
                <b-form-group
                  v-bind:label="$trans('VAT type')"
                >
                  <VAT
                    @vatChanged="(val) => changeVatType(cost, val)"
                  />
                </b-form-group>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <b-form-group
                  v-bind:label="$trans('VAT')"
                >
                  <b-form-input
                    readonly
                    disabled
                    :value="cost.vat_dinero.toFormat('$0.00')"
                    class="text-right pr-0"
                  ></b-form-input>
                </b-form-group>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <b-form-group
                  v-bind:label="$trans('Total')"
                >
                  <b-form-input
                    readonly
                    disabled
                    :value="cost.total_dinero.toFormat('$0.00')"
                    class="text-right pr-0"
                  ></b-form-input>
                </b-form-group>
              </b-col>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <b-col cols="12" class="text-center">
                <b-button
                  @click="() => deleteCost(index)"
                  type="button"
                  variant="danger"
                  size="sm"
                >
                  {{ $trans("Delete cost") }}
                </b-button>
              </b-col>
            </b-row>
            <hr/>
          </b-container>
        </div>
        <div class="text-center">
          <b-button
            :disabled="collectionHasEmptyItem"
            @click="addCost"
            class="btn btn-primary"
            type="button"
          >
            {{ $trans("Add material") }}
          </b-button>
          <span style="width: 80px">&nbsp;</span>
          <b-button
            :disabled="showSaveButton"
            @click="() => saveCosts()"
            type="button"
            variant="primary"
          >
            {{ $trans("Save changes") }}
          </b-button>
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
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from "awesome-debounce-promise";

import AmountDecimalInput from "@/components/AmountDecimalInput.vue"
import PriceInput from "@/components/PriceInput";
import TotalsInputs from "@/components/TotalsInputs";
import IconLinkDelete from '@/components/IconLinkDelete.vue'

import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {
  COST_TYPE_USED_MATERIALS,
  CostModel,
  CostService
} from "@/models/quotations/Cost";
import {MaterialModel, MaterialService} from "@/models/inventory/Material";
import {ChapterModel} from "@/models/quotations/Chapter";

import quotationMixin from "./mixin.js";
import {USE_PRICE_OTHER, USE_PRICE_PURCHASE, USE_PRICE_SELLING} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import AddToQuotationLines from './AddToQuotationLines.vue'
import EmptyQuotationLinesContainer from "./EmptyQuotationLinesContainer.vue";
import CostsTable from "./CostsTable.vue";
import SectionHeader from "./SectionHeader.vue";

export default {
  name: "MaterialsCreateComponent",
  mixins: [quotationMixin],
  components: {
    CostsTable,
    EmptyQuotationLinesContainer,
    PriceInput,
    IconLinkDelete,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    AmountDecimalInput,
    AddToQuotationLines,
    SectionHeader
  },
  props: {
    chapter: {
      type: ChapterModel,
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
    showSaveButton() {
      return !this.hasChanges
    },
  },
  data() {
    return {
      materialChosen: false,
      isLoading: false,
      materials: [],
      materialModels: [],
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      costService: new CostService(),
      usePriceOptions: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },
      default_currency: this.$store.getters.getDefaultCurrency,
      default_vat: this.$store.getters.getQuotationDefaultVat,
      hasStoredData: false,
      getMaterialsDebounced: '',
      parentHasQuotationLines: false,
      quotationLineType: COST_TYPE_USED_MATERIALS,
      quotationLineService: new QuotationLineService(),
      materialService: new MaterialService(),
      fetchingMaterials: false,
      isLoaded: false,
      hasChanges: false
    }
  },
  async created() {
    this.isLoading = true
    this.getMaterialsDebounced = AwesomeDebouncePromise(this.getMaterials, 500)
    this.costService.default_vat = this.default_vat
    this.costService.default_currency = this.default_currency

    if (this.chapter.id) {
      this.costService.addListArg(`chapter=${this.chapter.id}`)
      this.costService.addListArg(`cost_type=${COST_TYPE_USED_MATERIALS}`)
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
    getNewCostModel() {
      return new CostModel({
        material: null,
        ...this.costService.getDefaultCostProps(),
        ...this.getDefaultProps(),
        price_currency: this.default_currency,
        use_price: this.usePriceOptions.USE_PRICE_SELLING,
        price_other_currency: this.default_currency,
        cost_type: COST_TYPE_USED_MATERIALS,
        margin_perc: 0
      })
    },
    addCost() {
      this.costService.collection.push(this.getNewCostModel())
      this.materialChosen = false
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      if (this.costService.collection.length === 0) {
        this.addCost()
      }
      this.updateTotals()
    },
    async saveCosts() {
      if (this.isCollectionEmpty && this.costService.deletedItems.length === 0) {
        return
      }
      try {
        this.isLoading = true
        // filter out empty items
        this.costService.collection = this.costService.collection.filter(
          (cost) => cost.material !== null
        )
        await this.costService.updateCollection()
        infoToast(create, this.$trans('Updated'), this.$trans('Materials costs have been updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error updating material costs', error)
        errorToast(create, this.$trans('Error updating material costs'))
        this.isLoading = false
      }
      this.scrollToHeader()
    },
    async selectMaterial(material, index) {
      try {
        this.isLoading = true
        const data = await this.materialService.detail(material.id)

        this.materialModels.push(
          new MaterialModel({
            ...data,
            margin_perc: 0
          })
        )

        data.material = data.id
        data.material_name = data.name
        delete data.id

        const price = this.getPrice(
          {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE})
        const newCollection = this.costService.collection
        newCollection[index] = new this.costService.model({
          ...data,
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price,
          price_currency: this.getCurrency(
            {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
          amount_decimal: "0.00",
          cost_type: COST_TYPE_USED_MATERIALS,
          margin_perc: 0
        })
        this.materialChosen = true
        this.hasChanges = true
        this.costService.collection = newCollection
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material', error)
        errorToast(create, this.$trans('Error fetching material'))
        this.isLoading = false
      }
      this.updateTotals()
    },
    materialLabel(material) {
      return material.name
    },
    async getMaterials(query) {
      this.fetchingMaterials = true
      try {
        this.materials = await this.materialService.searchNoSupplier(query)
        this.fetchingMaterials = false
      } catch(error) {
        console.log('Error fetching materials', error)
        errorToast(create, this.$trans('Error fetching materials'))
        this.fetchingMaterials = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    changeAmount(cost, amount) {
      cost.amount_decimal = amount
      this.updateTotals()
      this.hasChanges = true
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : this.$trans("unknown")
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true
      this.isLoaded = false

      try {
        let materialIds = []
        await this.costService.loadCollection()
        const costs = this.costService.collection.map((cost) => {
          if (cost.use_price === this.usePriceOptions.USE_PRICE_OTHER) {
            cost.price_other = cost.price
            cost.price_other_currency = cost.price_currency
          }
          materialIds.push(cost.material)
          return new CostModel(cost)
        })
        await this.loadMaterials(materialIds)
        this.costService.collection = costs
        this.updateTotals()
        this.checkParentHasQuotationLines(this.quotationLinesParent)
        if (this.costService.collection.length === 0) {
          this.addCost()
        }
        this.isLoading = false
        this.isLoaded = true
        this.hasChanges = false
      } catch(error) {
        console.log('error fetching material cost:', error)
        errorToast(create, this.$trans('Error fetching material cost'))
        this.isLoading = false
        this.isLoaded = true
      }
    },
    async loadMaterials(materialIds) {
      let data

      this.isLoading = true
      for (let id of materialIds) {
        data = await this.materialService.detail(id)
        this.materialModels.push(
          new MaterialModel({
            ...data,
            margin_perc: 0
          })
        )
      }
      this.isLoading = false
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SELLING,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id,
        vat_type: this.default_vat
      }
    },
    getPrice(cost) {
      let model

      switch (cost.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === cost.material)
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === cost.material)
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return cost.price_other
        default:
          console.log(`getPrice - unknown use price: ${cost.use_price}`)
          return "0.00"
      }
    },
    getCurrency(material_cost) {
      let model

      switch (material_cost.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material_cost.material)
          return model.price_purchase_ex_currency
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material_cost.material)
          return model.price_selling_ex_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material_cost.price_currency
        default:
          console.log(`getCurrency - unknown use price: ${material_cost.use_price}`)
          return this.default_currency
      }
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material)
      if (model) {
        return use_price === this.usePriceOptions.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MATERIAL MODEL NOT FOUND for ', used_material)
      }
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
        (total, m) => (total + parseFloat(m.amount_decimal)),
        0
      )
    },
    getDescriptionUserTotalsQuotationLine(cost) {
      return `${this.$trans("material")}: ${this.getMaterialName(cost.material)}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${this.$trans("Materials")}`
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    },
  }
}
</script>

<style scoped>
.material_row {
  margin-bottom: 20px;
}
</style>
