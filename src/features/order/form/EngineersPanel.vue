<template>
  <div class="assign-engineer section">
    <BFormGroup
      :label="$trans('Assign to')"
      label-for="order-assign"
      label-cols="3"
    >
      <VueMultiselect
        id="order-assign"
        v-model="selected"
        track-by="user_id"
        label="full_name"
        :max-height="600"
        :placeholder="$trans('Type to search engineer(s)')"
        open-direction="bottom"
        :options="engineers"
        :multiple="true"
      >
        <template #noResult>{{ $trans('Nothing found.') }}</template>
      </VueMultiselect>
    </BFormGroup>
  </div>
  <BFormGroup
    :label="$trans('Assignee(s)')"
    label-for="order-assigned-to"
    label-cols="3"
  >
    <div v-if="!assignees.length">
      <label class="col-form-label order-assignee dimmed">{{ $trans('Nobody assigned') }}</label>
    </div>
    <div
      v-for="engineer in assignees"
      :key="engineer.user_id ?? engineer.full_name"
      class="col-form-label order-assignee"
      :class="{'text-decoration-line-through': isRemoved(engineer)}"
    >
      <span>{{ engineer.full_name }}</span>
      <BButton
        v-if="engineer.user_id !== null && !isRemoved(engineer)"
        class="float-right h5 mx-2"
        variant="light"
        :title="$trans('Unassign')"
        @click="unassign(engineer)"
      >
        <IBiTrashFill />
      </BButton>
    </div>
  </BFormGroup>
</template>

<script lang="ts" setup>
import VueMultiselect from 'vue-multiselect'

import type { AssignedUserInfo } from '@/api/types.gen'
import { useEngineerAssignment } from './use-engineer-assignment'

/**
 * The engineers a planning user assigns to, and the ones already on the
 * order with an unassign each. Nothing is written until the form's save
 * calls `replay`.
 */
const props = defineProps<{
  /** The engineers on the record; a change (a load) discards what was staged. */
  assignees: AssignedUserInfo[]
}>()

const {engineers, selected, isRemoved, unassign, reset, replay, hasChanges} = useEngineerAssignment()

watch(() => props.assignees, reset)

defineExpose({replay, hasChanges})
</script>
