<template>
  <b-row>
    <b-col
      cols="4"
      role="group"
    >
      <BFormGroup
        label-size="sm"
        :label="label"
        :label-for="`${idPrefix}_name`"
      >
        <BFormInput
          :id="`${idPrefix}_name`"
          :model-value="owner.name"
          size="sm"
          readonly
        />
      </BFormGroup>
    </b-col>
    <b-col
      cols="4"
      role="group"
    >
      <BFormGroup
        label-size="sm"
        :label="$trans('Address')"
        :label-for="`${idPrefix}_address`"
      >
        <BFormInput
          :id="`${idPrefix}_address`"
          :model-value="owner.address"
          size="sm"
          readonly
        />
      </BFormGroup>
    </b-col>
    <b-col
      cols="2"
      role="group"
    >
      <BFormGroup
        label-size="sm"
        :label="$trans('City')"
        :label-for="`${idPrefix}_city`"
      >
        <BFormInput
          :id="`${idPrefix}_city`"
          :model-value="owner.city"
          size="sm"
          readonly
        />
      </BFormGroup>
    </b-col>
    <b-col
      cols="2"
      role="group"
    >
      <BFormGroup
        label-size="sm"
        :label="$trans('Country')"
        :label-for="`${idPrefix}_country_code`"
      >
        <BFormInput
          :id="`${idPrefix}_country_code`"
          :model-value="owner.country_code"
          size="sm"
          readonly
        />
      </BFormGroup>
    </b-col>
  </b-row>
</template>

<script setup lang="ts">
import type { OwnerRecord } from './use-form-owner'

/**
 * The picked owner, read-only.
 *
 * The id prefix is a prop so the same block can appear twice on one screen
 * without duplicating its ids. The equipment form used to render the branch
 * block in two panels with identical ids (`equipment_branch_name` twice), which
 * leaves `label-for` and every `getElementById` pointing at whichever came
 * first.
 */
defineProps<{
  /** e.g. `equipment_branch`, giving ids `equipment_branch_name` and so on. */
  idPrefix: string
  label: string
  owner: OwnerRecord
}>()
</script>
