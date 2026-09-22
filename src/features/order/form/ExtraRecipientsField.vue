<template>
  <BFormGroup
    :label="$trans('Order email extra')"
    label-for="order-email-extra"
  >
    <VueMultiselect
      id="order-email-extra"
      v-model="recipients"
      track-by="email"
      label="email"
      :max-height="600"
      :placeholder="$trans('Type to search sales user(s)')"
      open-direction="bottom"
      :options="salesUserOptions"
      :multiple="true"
      :taggable="true"
      :internal-search="false"
      @search-change="(term: string) => (salesUserTerm = term)"
      @tag="(email: string) => (emails = [...emails, email])"
    >
      <template #noResult>
        {{ $trans('Oops! No elements found. Consider changing the search query.') }}
      </template>
    </VueMultiselect>
  </BFormGroup>
</template>

<script lang="ts" setup>
import VueMultiselect from 'vue-multiselect'

import { useSalesUserOptions } from './use-order-pickers'

/**
 * The extra e-mail addresses the order's mails go to: sales users found
 * by search, or any address typed in as a tag. Bound to the order's list
 * of plain strings; the picker wants objects, so the two are mapped here.
 */
const emails = defineModel<string[]>({required: true})

const {salesUserTerm, salesUsers} = useSalesUserOptions(() => true)
const salesUserOptions = computed(() => salesUsers.value.map((user) => ({email: user.email})))

const recipients = computed({
  get: () => emails.value.map((email) => ({email})),
  set: (chosen: Array<{email: string}>) => {
    emails.value = chosen.map((recipient) => recipient.email)
  },
})
</script>
