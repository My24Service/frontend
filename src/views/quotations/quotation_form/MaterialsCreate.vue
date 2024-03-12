<template>
  <Collapse
    :title="$trans('Materials')"
  >
    <b-overlay :show="compLoading" rounded="sm">
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
        <p v-else>
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
          ></b-form-input>

          <div style="width: 100px !important; float:right !important;">
            {{ $trans('VAT') }}
            <VAT
              @vatChanged="(val) => changeVatType(cost, val)"
              style="width: 60px"
            />
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
          <b-row>
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
        <b-row v-if="costService.collection.length">
          <b-col cols="2"></b-col>
          <b-col cols="10">
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
              v-if="costService.collection.length"
            >
              {{ $trans("Save material costs") }}
            </b-button>
          </b-col>
        </b-row>
        <b-row v-else>
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <b-button
              :disabled="compLoading"
              @click="addCost"
              class="btn btn-primary"
              type="button"
            >
              {{ $trans("Add material") }}
            </b-button>
          </b-col>
        </b-row>

        <b-row v-if="costService.collection.length">
          <b-col cols="12">
            <hr v-if="!parentHasQuotationLines">
            <AddToQuotationLines
              v-if="!parentHasQuotationLines"
              :useOnQuotationOptions="useOnQuotationOptions"
              @buttonClicked="createQuotationLinesClicked"
            />
            <hr/>
          </b-col>
        </b-row>

      </b-container>

    </b-overlay>
  </Collapse>
</template>

<script>
import quotationMixin from "./mixin.js";
import Multiselect from 'vue-multiselect'
import AmountDecimalInput from "../../../components/AmountDecimalInput.vue"
import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import Collapse from "../../../components/Collapse";
import CostService, {COST_TYPE_USED_MATERIALS} from "../../../models/quotations/Cost";
import {
  INVOICE_LINE_TYPE_USED_MATERIALS,
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
import {InventoryService} from '@/models/inventory/Inventory.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import AddToQuotationLines from './AddToQuotationLines.vue'
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {ChapterModel} from "@/models/quotations/Chapter";

export default {
  name: "MaterialsCreateComponent",
  emits: ['quotationLinesCreated', 'emptyCollectionClicked'],
  mixins: [quotationMixin],
  components: {
    PriceInput,
    IconLinkDelete,
    Collapse,
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
    loading: {
      type: Boolean,
      default: false
    },
    quotationLinesParent: {
      type: [Array],
      default: null
    },
  },
  computed: {
    compLoading () {
      return this.loading || this.isLoading
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
      costType: COST_TYPE_USED_MATERIALS,
      getMaterialsDebounced: '',
      parentHasQuotationLines: false,
      quotationLineType: INVOICE_LINE_TYPE_USED_MATERIALS,
      quotationLineService: new QuotationLineService(),
      materialService: new MaterialService(),
      inventoryService: new InventoryService(),
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
      this.costService.collection.push({
        material: null
      })
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Created'), this.$trans('Materials costs have been updated'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        console.log('Error creating material costs', error)
        this.errorToast(this.$trans('Error creating material costs'))
        this.isLoading = false
      }
    },
    async selectMaterial(material, index) {
      try {
        this.isLoading = true
        const data = await this.materialService.detail(material.material_id)

        this.materialModels.push(
          new MaterialModel({
            ...data,
            margin_perc: 0
          })
        )
        data.material_id = data.id
        data.material_name = data.name
        delete data.id
        delete data.name
        this.costService.collection[index] = new this.costService.model({
          ...data,
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: this.getPrice(
            {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
          price_currency: this.getCurrency(
            {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
          material: data.material_id,
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
      const text = this.$trans('in stock')
      return `${material.material_name}, ${text}: ${material.total_amount}`
    },
    async getMaterials(query) {
      this.fetchingMaterials = true
      try {
        this.materials = await this.inventoryService.getMaterials(query)
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
        const response = await this.costService.list()
        const costs = response.results.map((cost) => {
          cost.material_id = cost.material
          materialIds.push(cost.material)
          return new this.costService.model(cost)
        })
        await this.loadMaterials(materialIds)
        this.costService.collection = costs
        this.updateTotals()
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
    getPrice(material) {
      let model

      switch (material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material.price
        default:
          throw `unknown use price: ${material.use_price}`
      }
    },
    getCurrency(material) {
      let model

      switch (material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_purchase_ex_currency
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_selling_ex_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material.price_currency
        default:
          throw `unknown use price: ${material.use_price}`
      }
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material_id)
      if (model) {
        return use_price === this.usePriceOptions.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
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
      console.log(this.totalVAT_dinero.toFormat('$0.00'))
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
.add-button {
  margin: 20px 0;
}
.material_row {
  margin-bottom: 20px;
}
</style>
