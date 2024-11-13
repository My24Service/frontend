<template>
  <details :open="isView ? 'open' : ''">
    <summary class="flex-columns space-between">
      <h6>
        {{ $trans('Materials') }}
        <b-icon-check-circle v-if="parentHasQuotationLines"></b-icon-check-circle>
      </h6>
      <b-icon-chevron-down></b-icon-chevron-down>
    </summary>
    <b-overlay :show="compLoading" rounded="sm" v-if="!isLoading">
      <div
        v-for="(cost, index) in this.costService.collection"
        :key="index"
        class="material_row"
        style="padding-top: 8px;"
      >
        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Material')"
          label-for="material-search"
          v-if="!cost.material && !parentHasQuotationLines"
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
        <p
          v-if="cost.material && !parentHasQuotationLines"
        >
          <b-form-group
            label-cols="3"
            v-bind:label="$trans('Material')"
            label-for="material-search"
          >
            <b-form-input
              readonly
              :value="cost.material_name"
            ></b-form-input>
          </b-form-group>
        </p>

        <b-form-group
          label-cols="3"
          v-bind:label="`${$trans('Amount')}`"
          label-for="material-amount"
          v-if="cost.material"
        >
          <b-form-input
            style="width: 100px !important; float:left !important;"
            :value="Math.round(cost.amount_decimal)"
            @change="(amount) => changeAmount(cost, amount)"
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
          label-for="material-price"
          v-if="cost.material"
        >
          <b-form-radio-group
            @change="updateTotals"
            v-model="cost.use_price"
            v-if="!parentHasQuotationLines"
          >
            <b-form-radio :value="usePriceOptions.USE_PRICE_PURCHASE">
              {{ $trans('Pur.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_SELLING">
              {{ $trans('Sel.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="cost.price"
                  :currency="cost.price_currency"
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
          <b-row v-if="!parentHasQuotationLines && index > 0">
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
            <i><strong>{{ $trans("Delete existing material quotation lines if you want to add or change items") }}</strong></i>
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
              {{ $trans("Add material") }}
            </b-button>
            <span style="width: 80px">&nbsp;</span>
            <b-button
              :disabled="compLoading"
              @click="() => saveCosts()"
              class="btn btn-danger"
              type="button"
              variant="danger"
            >
              {{ $trans("Save material costs") }}
            </b-button>
          </b-col>
        </b-row>
        <b-row v-if="(!costService.collection.length || costService.deletedItems.length) && !parentHasQuotationLines">
          <b-col cols="6"></b-col>
          <b-col cols="6">
            <b-button
              :disabled="compLoading"
              @click="addCost"
              class="btn btn-primary float-right"
              type="button"
            >
              {{ $trans("Add material") }}
            </b-button>
          </b-col>
        </b-row>

        <b-row v-if="showAddQuotationLinesBlock">
          <b-col cols="12">
            <hr/>
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
import AmountDecimalInput from "../../../components/AmountDecimalInput.vue"
import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {COST_TYPE_USED_MATERIALS, CostModel, CostService} from "@/models/quotations/Cost";
import {
  USE_PRICE_OTHER,
  USE_PRICE_PURCHASE,
  USE_PRICE_SELLING
} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import {MaterialService, MaterialModel} from "@/models/inventory/Material";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import TotalsInputs from "../../../components/TotalsInputs";
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import AddToQuotationLines from './AddToQuotationLines.vue'
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {ChapterModel} from "@/models/quotations/Chapter";

export default {
  name: "MaterialsCreateComponent",
  mixins: [quotationMixin],
  components: {
    PriceInput,
    IconLinkDelete,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    AmountDecimalInput,
    AddToQuotationLines
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
    compLoading () {
      return this.isLoading
    },
    showAddQuotationLinesBlock() {
      return this.costService.collection.length && !this.parentHasQuotationLines
    }
  },
  data() {
    return {
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
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      hasStoredData: false,
      getMaterialsDebounced: '',
      parentHasQuotationLines: false,
      quotationLineType: COST_TYPE_USED_MATERIALS,
      quotationLineService: new QuotationLineService(),
      materialService: new MaterialService(),
      fetchingMaterials: false,
    }
  },
  async created() {
    this.isLoading = true
    this.getMaterialsDebounced = AwesomeDebouncePromise(this.getMaterials, 500)
    this.costService.invoice_default_vat = this.invoice_default_vat
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
      cost.setPriceField('price', priceDinero)
      this.updateTotals()
    },
    addCost() {
      this.costService.collection.push(new CostModel({material: null}))
      this.costService.collectionHasChanges = true
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Updated'), this.$trans('Materials costs have been updated'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        console.log('Error updating material costs', error)
        this.errorToast(this.$trans('Error updating material costs'))
        this.isLoading = false
      }
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
        this.costService.collection[index] = new this.costService.model({
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
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material', error)
        this.errorToast(this.$trans('Error fetching material'))
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
        this.errorToast(this.$trans('Error fetching materials'))
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
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : this.$trans("unknown")
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true

      try {
        let materialIds = []
        await this.costService.loadCollection()
        const costs = this.costService.collection.map((cost) => {
          materialIds.push(cost.material)
          return new this.costService.model(cost)
        })
        await this.loadMaterials(materialIds)
        this.costService.collection = costs
        this.updateTotals()
        this.checkParentHasQuotationLines(this.quotationLinesParent)
        if (this.costService.collection.length === 0) {
          this.addCost()
        }
        this.isLoading = false
      } catch(error) {
        this.errorToast(this.$trans('Error fetching material cost'))
        this.isLoading = false
      }
    },
    async loadMaterials (materialIds) {
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
        use_price: this.usePriceOptions.USE_PRICE_PURCHASE,
        quotation: this.chapter.quotation,
        chapter: this.chapter.id
      }
    },
    getPrice(material_cost) {
      let model

      switch (material_cost.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material_cost.material)
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material_cost.material)
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material_cost.price
        default:
          throw `unknown use price: ${material_cost.use_price}`
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
          throw `unknown use price: ${material_cost.use_price}`
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
.flex {
  display : flex;
  margin-top: auto;
}
.material_row {
  margin-bottom: 20px;
}
</style>
