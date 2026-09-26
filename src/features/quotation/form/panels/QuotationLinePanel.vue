<template>
  <b-overlay :show="isLoading" rounded="sm">
    <BButton
      style="width: 100%"
      :variant="hasChanges ? 'danger' : 'success'"
      :disabled="hasChanges"
      @click="emit('back')"
    >
      <IBiArrowLeftCircleFill></IBiArrowLeftCircleFill>
      {{ $trans("Back to quotation and chapters") }}
    </BButton>

    <h5 class="pt-2">{{ $trans('Quotation lines chapter') }} <i>{{ chapter.name }}</i></h5>

    <div>
      <p v-if="!lines.length && !showForm">
        <i>{{ $trans("No quotation lines") }}</i>
      </p>
      <b-table
        small
        :busy="isLoading"
        :fields="isView ? fieldsView : fields"
        :items="lines"
        responsive="md"
        class="line-table"
        v-if="!showForm && lines.length"
        :tbody-tr-class="(item: QuotationLineRow | null) => item?.hasChanges ? 'has-changes' : ''"
      >
        <template #cell(info)="data">
          <b>{{ data.item.info }}</b><br/>
          {{ $trans("Amount") }}: <b>{{ data.item.amount }}</b>
        </template>
        <template #cell(total)="data">
          {{ formatMoney(data.item.total_dinero) }}<br/>
          {{ $trans("VAT") }} {{ formatMoney(data.item.vat_dinero) }} ({{ Math.round(Number(data.item.vat_type)) }}%)
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right" v-if="data.item.id && !isView">
            <RowAction icon="edit" class="pr-2" :method="() => editLine(data.item)" :title="$trans('Edit')" />
            <RowAction icon="delete" :title="$trans('Delete')" :method="() => deleteLine(data.item.localKey)" />
          </div>
          <div class="float-right" v-if="!data.item.id && !isView">
            <i>{{ $trans("not saved") }}</i>
          </div>
        </template>
      </b-table>

      <QuotationLineEditor
        v-if="showForm"
        :key="editing?.localKey ?? 'new'"
        :line="editing"
        @save="saveEditor"
        @cancel="closeEditor"
      />

      <hr/>
      <b-container>
        <b-row class="quotation-total">
          <b-col cols="7">
            <span class="total-text">{{ $trans('Chapter total') }}</span>
          </b-col>
          <b-col cols="5">
            <TotalsInputs :total="totals.total_dinero" :is-final-total="true" :vat="totals.vat_dinero" />
          </b-col>
        </b-row>
      </b-container>

      <b-container v-if="showChangesBlock" class="pb-3 has-changes rounded">
        <hr/>
        <b-row v-if="deleted.length">
          <b-col cols="12">
            <h4>{{ $trans("To be deleted") }}</h4>
            <b-table small :fields="fieldsView" :items="deleted" responsive="md" class="line-table deleted-lines">
              <template #cell(total)="data">{{ formatMoney(data.item.total_dinero) }}</template>
            </b-table>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2"></b-col>
          <b-col cols="10">
            <BButton @click="discard" class="btn btn-secondary" type="button">
              {{ $trans('Discard changes') }}
            </BButton>
            &nbsp;
            <BButton @click="saveCollection" class="btn btn-danger" type="button" variant="danger">
              {{ $trans('Save changes') }}
            </BButton>
          </b-col>
        </b-row>
      </b-container>

      <footer class="modal-footer" v-if="!showForm && !isView && quotation.preliminary">
        <BButton @click="newLine" class="btn btn-primary update-button" type="button" variant="primary">
          {{ $trans('New quotation line') }}
        </BButton>
      </footer>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import RowAction from '@/components/RowAction.vue'
import { formatMoney } from '@/services/money'
import type { QuotationLineDraft } from '../calculations'
import { useQuotationLines, type QuotationLineRow } from '../use-quotation-lines'
import QuotationLineEditor from './QuotationLineEditor.vue'

/**
 * One chapter's quotation lines: the table, the add/edit form, the chapter
 * total, and the staged changes with their save and discard. The form drives
 * it through the exposed handle - the cost panels' lines come in with
 * `addLines`, a panel's "remove lines" with `removeLinesForType` - and hears
 * back through `lines-changed`.
 */
const props = withDefaults(defineProps<{
  quotation: Pick<Api.Quotation, 'id' | 'preliminary'>
  chapter: Pick<Api.Chapter, 'id' | 'name'>
  isView?: boolean
}>(), {isView: false})

const emit = defineEmits<{
  back: []
  'lines-changed': [lines: readonly QuotationLineRow[]]
}>()

const {
  lines, deleted, hasChanges, isLoading, totals,
  addLine, updateLine, deleteLine, addLines, removeLinesForType, saveCollection, discard,
} = useQuotationLines(() => props.chapter.id)

watch(lines, (value) => emit('lines-changed', value), {deep: true, immediate: true})

const fields = [
  {key: 'info', label: $trans('Info'), thAttr: {width: '40%'}},
  {key: 'total', label: $trans('Total'), thAttr: {width: '40%'}},
  {key: 'icons', label: '', thAttr: {width: '20%'}},
]
const fieldsView = [
  {key: 'info', label: $trans('Info'), thAttr: {width: '60%'}},
  {key: 'total', label: $trans('Total'), thAttr: {width: '40%'}},
]

const editorOpen = ref(false)
const editing = ref<QuotationLineRow | null>(null)
const showForm = computed(() => !props.isView && editorOpen.value)
const showChangesBlock = computed(() => !showForm.value && hasChanges.value)

function newLine() {
  editing.value = null
  editorOpen.value = true
}
function editLine(line: QuotationLineRow) {
  editing.value = line
  editorOpen.value = true
}
function closeEditor() {
  editorOpen.value = false
  editing.value = null
}
function saveEditor(draft: QuotationLineDraft) {
  if (editing.value) updateLine(editing.value.localKey, draft)
  else addLine(draft)
  closeEditor()
}

defineExpose({lines, addLines, removeLinesForType, saveCollection})
</script>

<style scoped>
.update-button {
  margin-bottom: 8px;
}
.quotation-total {
  margin-bottom: 20px;
}
.total-text {
  font-weight: bold;
}
</style>
