<template>
  <b-overlay :show="isLoading" rounded="sm">
    <details :open="isView">
      <summary class="flex-columns space-between">
        <h6>
          {{ options.title() }}
          <IBiCheckCircle v-if="parentHasLines"></IBiCheckCircle>
        </h6>
        <span :id="anchorId" class="section-header"></span>
        <IBiChevronDown></IBiChevronDown>
      </summary>

      <div v-if="readOnly">
        <CostsTable :collection="collection" :type="options.costType" />
        <hr/>
      </div>

      <div v-else>
        <div v-for="(cost, index) in collection" :key="index" class="cost_row">
          <b-container>
            <slot name="before-row" :cost="cost" :changed="() => changed(cost)" />
            <b-row v-if="rowReady(cost)">
              <b-col cols="2" class="cost-amount">
                <slot name="amount" :cost="cost" :changed="() => changed(cost)" />
              </b-col>
              <b-col cols="3">
                <BFormGroup :label="priceLabel">
                  <PriceInput
                    v-model="cost.price"
                    :currency="cost.price_currency"
                    @priceChanged="(value) => priceChanged(value, cost)"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="2">
                <BFormGroup :label="$trans('VAT type')">
                  <VAT v-model="cost.vat_type" @vatChanged="(value) => changeVatType(cost, value)" />
                </BFormGroup>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <BFormGroup :label="$trans('VAT')">
                  <BFormInput readonly disabled :model-value="formatMoney(cost.vat_dinero)" class="text-right pr-0" />
                </BFormGroup>
              </b-col>
              <b-col cols="2" class="text-right p-0">
                <BFormGroup :label="$trans('Total')">
                  <BFormInput readonly disabled :model-value="formatMoney(cost.total_dinero)" class="text-right pr-0" />
                </BFormGroup>
              </b-col>
            </b-row>
          </b-container>
          <b-container>
            <b-row>
              <b-col cols="12" class="text-center">
                <BButton @click="deleteCost(index)" type="button" variant="danger" size="sm">
                  {{ $trans("Delete cost") }}
                </BButton>
              </b-col>
            </b-row>
            <hr/>
          </b-container>
        </div>
        <div class="text-center">
          <BButton :disabled="collectionHasEmptyItem" @click="addCost" class="btn btn-primary" type="button">
            {{ addLabel }}
          </BButton>
          <span style="width: 80px">&nbsp;</span>
          <BButton :disabled="!hasChanges" @click="save" type="button" variant="primary">
            {{ $trans("Save changes") }}
          </BButton>
        </div>
        <hr/>
      </div>

      <div v-if="!isCollectionEmpty">
        <TotalRow :items_total="totalAmount" :total="total_dinero" :total_vat="totalVAT_dinero" />
        <hr/>
      </div>

      <div v-if="parentHasLines && !isView" class="text-center remove-lines">
        <h5><i>{{ $trans("Remove quotation lines to change items") }}</i></h5>
        <BButton @click="removeLinesClicked" variant="danger" type="button" size="sm">
          {{ $trans("Remove quotation lines") }}
        </BButton>
      </div>

      <div v-if="collection.length && !parentHasLines && !isView" class="text-center">
        <AddToLinesDiv
          :useOnInvoiceOptions="useOnQuotationOptions"
          :title="$trans('What to add as quotation lines')"
          :button-label="$trans('Create quotation lines')"
          @buttonClicked="createLines"
        />
      </div>
    </details>
  </b-overlay>
</template>

<script setup lang="ts">
import { AddToLinesDiv, CostsTable, TotalRow, VAT, type CostRow, type InvoiceLineOption } from '@/features/costing'
import { formatMoney } from '@/services/money'
import { useQuotationCosts, type QuotationCostsOptions } from '../use-quotation-costs'

/**
 * The frame every quotation cost panel shares: its section header, the
 * read-only table once the chapter holds lines of this type (or on the
 * view), otherwise the editable rows - each with a price, VAT and live
 * totals - the add/save controls, the total row, and the "remove lines" /
 * "create lines" blocks. A panel supplies its options and its amount editor
 * (`amount` slot); the materials panel also its picker (`before-row`).
 */
const props = withDefaults(defineProps<{
  options: QuotationCostsOptions
  addLabel: string
  priceLabel: string
  isView?: boolean
  /** Whether a row is filled far enough to price: a material row needs its material first. */
  rowReady?: (cost: CostRow) => boolean
}>(), {isView: false, rowReady: () => true})

const {
  collection, isLoading, hasChanges, totalAmount, total_dinero, totalVAT_dinero,
  collectionHasEmptyItem, isCollectionEmpty, parentHasLines,
  changed, priceChanged, changeVatType, addCost, deleteCost, saveCosts,
  createLinesClicked, removeLinesClicked, useOnQuotationOptions,
} = useQuotationCosts(props.options)

const readOnly = computed(() => props.isView || parentHasLines.value)
const anchorId = `header-${props.options.costType}`

function scrollToHeader() {
  document.getElementById(anchorId)?.scrollIntoView?.()
}
async function save() {
  await saveCosts()
  scrollToHeader()
}
function createLines(option: InvoiceLineOption | null) {
  createLinesClicked(option)
  scrollToHeader()
}
</script>

<style scoped>
.cost_row {
  margin-bottom: 20px;
}
.remove-lines {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>
