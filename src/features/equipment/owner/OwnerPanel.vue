<template>
  <b-row v-if="chooses">
    <b-col
      cols="12"
      role="group"
    >
      <OwnerSearch
        :id="`${idPrefix}_${wireKind}_search`"
        :label="ownerLabel"
        :error="errors[wireKind] ?? ''"
        :state="submitClicked ? !errors[wireKind] : null"
        :options="options"
        :is-loading="isSearching"
        :disabled="isLoading"
        @search="onSearch"
        @select="selectOwner"
      />
    </b-col>
  </b-row>
  <slot name="details">
    <OwnerDetails
      v-if="chooses && owner"
      :id-prefix="`${idPrefix}_${wireKind}`"
      :label="ownerLabel"
      :owner="owner"
    />
  </slot>
</template>

<script setup lang="ts">
import type { OwnerKind } from './owner-kind'
import OwnerDetails from './OwnerDetails.vue'
import OwnerSearch from './OwnerSearch.vue'
import type { FormOwner } from './use-form-owner'

/**
 * The owner block of an owned form: the type-ahead for whoever chooses, and
 * the picked owner read back below it.
 *
 * Rendered from `useFormOwner`'s result as one prop rather than its pieces,
 * because that result is the concept this shows, and the ids are the one
 * thing a form still spells: `building` gives `building_branch_search` and
 * `building_branch_name`, which are the screen's DOM contract.
 *
 * The details are a slot with the shared block as its default. The equipment
 * form shows its owner in more places and under other conditions than
 * "chooses and has one", and supplies those itself.
 */
const props = defineProps<{
  /** e.g. `building`, giving `building_${wireKind}_search` and `building_${wireKind}`. */
  idPrefix: string
  formOwner: FormOwner
  /** The form's field errors; only the owner keys are read. */
  errors: Partial<Record<OwnerKind, string>>
  submitClicked: boolean
  /** Withheld while the record is loading, so the picker never shows a stale list. */
  isLoading: boolean
}>()

const {wireKind, chooses, owner, ownerLabel, searchTerm, options, isSearching, selectOwner} = props.formOwner

function onSearch(term: string) {
  searchTerm.value = term
}
</script>
