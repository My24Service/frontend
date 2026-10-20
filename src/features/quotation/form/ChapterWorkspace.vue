<template>
  <div class="panel col-1-2 left">
    <QuotationLinePanel
      ref="line-panel"
      :quotation="quotation"
      :chapter="chapter"
      :is-view="isView"
      @back="emit('back')"
      @lines-changed="(value) => { lines = value }"
    />
  </div>
  <div class="panel col-1-2 right">
    <h5>{{ $trans("Chapter costs") }}</h5>
    <MaterialsPanel :chapter-id="chapter.id" :is-view="isView" class="component-margin" />
    <HoursPanel :chapter-id="chapter.id" type="work_hours" :is-view="isView" class="component-margin" />
    <HoursPanel :chapter-id="chapter.id" type="travel_hours" :is-view="isView" class="component-margin" />
    <DistancePanel :chapter-id="chapter.id" :is-view="isView" class="component-margin" />
    <CallOutCostsPanel :chapter-id="chapter.id" :is-view="isView" class="component-margin" />
  </div>
</template>

<script setup lang="ts">
import { costTypeForLineType, provideCostPanelContext } from '@/features/costing'
import { lineTypeOfQuotationLine, type QuotationLineDraft } from './calculations'
import type { QuotationLineRow } from './use-quotation-lines'
import {
  CallOutCostsPanel,
  DistancePanel,
  HoursPanel,
  MaterialsPanel,
  QuotationLinePanel,
} from './panels'

/**
 * One chapter, opened: its lines on the left, its costs on the right. The
 * cost panels hand the lines they make to the line panel, and learn from it
 * which cost types already have lines, through the shared cost-panel context.
 */
const props = withDefaults(defineProps<{
  quotation: Pick<Api.Quotation, 'id' | 'preliminary'>
  chapter: Pick<Api.Chapter, 'id' | 'name'>
  isView?: boolean
}>(), {isView: false})

const emit = defineEmits<{ back: [] }>()

const linePanel = useTemplateRef<InstanceType<typeof QuotationLinePanel>>('line-panel')
const lines = ref<readonly QuotationLineRow[]>([])

provideCostPanelContext<QuotationLineDraft>({
  parentPk: computed(() => props.quotation.id),
  // Quotation costs are estimates, not per engineer.
  engineers: ref([]),
  lines: computed(() => lines.value.map((line) => ({type: lineTypeOfQuotationLine(line.cost_type)}))),
  linesCreated: (drafts) => linePanel.value?.addLines(drafts),
  emptyCollectionClicked: (type) => linePanel.value?.removeLinesForType(costTypeForLineType(type)),
})
</script>

<style scoped>
.component-margin {
  margin-bottom: 10px;
}
.left {
  flex-grow: 1;
  height: 100%;
}
.right {
  flex-grow: 5;
  overflow-y: auto;
}
.right div {
  height: fit-content;
}
</style>
