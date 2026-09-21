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
                <BFormGroup
                  label-cols="3"
                  v-bind:label="$trans('Material')"
                  label-for="material-search"
                  v-if="!cost.material"
                >
                  <VueMultiselect
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
                    <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                  </VueMultiselect>
                </BFormGroup>
                <BFormGroup
                  label-for="material-search"
                  v-if="cost.material"
                >
                  <BFormInput
                    readonly
                    :value="cost.material_name"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row v-if="cost.material">
              <b-col cols="2">
                <BFormGroup
                  v-bind:label="`${$trans('Amount')}`"
                  label-for="material-amount"
                >
                  <BFormInput
                    @change="(event) => changeAmount(cost, event.target.value)"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="3">
                <BFormGroup
                  v-bind:label="$trans('Price')"
                  label-for="material-price"
                >
                  <PriceInput
                    v-model="cost.price"
                    :currency="cost.price_currency"
                    @priceChanged="(val) => priceChanged(val, cost)"
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
                    :value="formatMoney(cost.vat_dinero)"
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
                    :value="formatMoney(cost.total_dinero)"
                    class="text-right pr-0"
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
            {{ $trans("Add material") }}
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
import VueMultiselect from 'vue-multiselect'
import AwesomeDebouncePromise from "awesome-debounce-promise";

import {errorToast, infoToast, $trans} from "@/services/i18n";
import {formatMoney} from "@/services/money";

import PriceInput from "@/components/PriceInput";

import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {
  COST_TYPE,
  CostModel,
  CostService
} from "@/models/quotations/Cost";
import {MaterialModel, MaterialService} from "@/models/inventory/Material";

import quotationMixin from "./mixin.js";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import AddToQuotationLines from './AddToQuotationLines.vue'
import EmptyQuotationLinesContainer from "./EmptyQuotationLinesContainer.vue";
import CostsTable from "./CostsTable.vue";
import SectionHeader from "./SectionHeader.vue";
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
  name: "MaterialsCreateComponent",
  mixins: [quotationMixin],
  components: {
    CostsTable,
    EmptyQuotationLinesContainer,
    PriceInput,
    VAT,
    TotalRow,
    VueMultiselect,
    AddToQuotationLines,
    SectionHeader
  },
  props: {
    chapter: {
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
      default_currency: this.mainStore.getDefaultCurrency,
      default_vat: this.mainStore.getQuotationDefaultVat,
      hasStoredData: false,
      getMaterialsDebounced: '',
      parentHasQuotationLines: false,
      quotationLineType: COST_TYPE.USED_MATERIALS,
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
      this.costService.addListArg(`cost_type=${COST_TYPE.USED_MATERIALS}`)
      await this.loadData()
    }

    this.isLoading = false
  },
  methods: {
    $trans,
    formatMoney,
    priceChanged(priceDinero, cost) {
      cost.setPriceField('price', priceDinero)
      this.updateTotals()
      this.hasChanges = true
    },
    getNewCostModel() {
      return new CostModel({
        material: null,
        ...this.costService.getDefaultCostProps(),
        ...this.getDefaultProps(),
        price_currency: this.default_currency,
        cost_type: COST_TYPE.USED_MATERIALS
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
        await this.replaceCostRows()
        infoToast(this.create, $trans('Updated'), $trans('Materials costs have been updated'))
        await this.loadData()
        this.isLoading = false
        this.hasChanges = false
      } catch(error) {
        console.log('Error updating material costs', error)
        errorToast(this.create, $trans('Error updating material costs'))
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
            ...data
          })
        )

        data.material = data.id
        data.material_name = data.name
        delete data.id

        // A chosen material seeds the line with its selling price.
        const newCollection = this.costService.collection
        newCollection[index] = new this.costService.model({
          ...data,
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: data.price_selling_ex,
          price_currency: data.price_selling_ex_currency || this.default_currency,
          amount_decimal: "0.00",
          cost_type: COST_TYPE.USED_MATERIALS
        })
        this.materialChosen = true
        this.hasChanges = true
        this.costService.collection = newCollection
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material', error)
        errorToast(this.create, $trans('Error fetching material'))
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
        errorToast(this.create, $trans('Error fetching materials'))
        this.fetchingMaterials = false
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    changeAmount(cost, amount) {
      console.debug({cost, amount})
      cost.amount_decimal = amount
      this.updateTotals()
      this.hasChanges = true
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : $trans("unknown")
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true
      this.isLoaded = false

      try {
        let materialIds = []
        await this.costService.loadCollection()
        const costs = this.costService.collection.map((cost) => {
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
        errorToast(this.create, $trans('Error fetching material cost'))
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
            ...data
          })
        )
      }
      this.isLoading = false
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
      return `${$trans("material")}: ${this.getMaterialName(cost.material)}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${$trans("Materials")}`
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
