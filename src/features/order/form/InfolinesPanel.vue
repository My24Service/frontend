<template>
  <div class="info-lines section">
    <h6>{{ $trans('Info lines') }}</h6>
    <b-container fluid="sm">
      <b-row
        v-for="(infoline, index) of infolines.rows.value"
        :key="infoline.id ?? `new-${index}`"
        no-gutters
        style="padding-bottom: 10px"
      >
        <b-col cols="9"><b>{{ infoline.info }}</b></b-col>
        <b-col cols="3">
          <div class="float-right">
            <BLink
              class="h5 mx-2"
              :title="$trans('Edit')"
              @click.prevent="infolines.edit(index)"
            ><IBiPencil /></BLink>
            <BLink
              class="h5 mx-2"
              :title="$trans('Delete')"
              @click.prevent="infolines.remove(index)"
            ><IBiTrash /></BLink>
          </div>
        </b-col>
      </b-row>
    </b-container>

    <hr v-if="infolines.rows.value.length > 0">

    <h5 v-if="infolines.isEditing.value">{{ $trans("Edit") }}</h5>
    <h5 v-else>{{ $trans("New") }}</h5>
    <BFormGroup
      :label="$trans('Info')"
      label-for="order-infoline-info"
    >
      <BFormTextarea
        id="order-infoline-info"
        v-model="infolines.rowEdit.value.info"
      />
    </BFormGroup>
    <BFormGroup class="text-right">
      <BButton
        v-if="infolines.isEditing.value"
        type="button"
        variant="warning"
        @click="infolines.commitEdit()"
      >{{ $trans('edit') }}</BButton>
      <BButton
        v-else
        type="button"
        variant="primary"
        :disabled="!infolines.rowEdit.value.info.trim()"
        @click="infolines.add()"
      >{{ $trans('add') }}</BButton>
    </BFormGroup>
  </div>
</template>

<script lang="ts" setup>

import { infolineFromRecord, type InfolineRow } from './schemas'
import { useStagedRows } from './use-staged-rows'

/** The notes for the engineer on an order, staged here and sent in the order body. */
const props = defineProps<{
  /** The lines on the record; a change (a load) replaces the staged set. */
  lines: Api.EngineerInfoLine[]
}>()

const infolines = useStagedRows<InfolineRow>(() => ({info: ''}))

watch(() => props.lines, (lines) => infolines.seed(lines.map(infolineFromRecord)), {immediate: true})

/** The staged lines, for the order body. */
const rows = infolines.rows

/** Take the lines the save returned, so the staged set carries the stored ids. */
function adopt(lines: Api.EngineerInfoLineNested[]) {
  infolines.seed(lines.map(infolineFromRecord))
}

defineExpose({rows, adopt})
</script>
