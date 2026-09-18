<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="$emit('cancel')">{{ $trans("People") }}</span> /
            <strong> {{ username }}</strong>
            <span class="dimmed" v-if="isCreate && !username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !username">{{ $trans('edit') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="$emit('cancel')" type="button" variant="secondary" class="outline">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="$emit('submit')" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</BButton>
          </div>
        </div>
      </header>

      <div class="page-detail">
        <slot />
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { $trans } from '@/services/i18n'

/**
 * The header chrome the seven user forms wrote out by hand: the loading
 * overlay, the People backlink with the edited username, the new/edit
 * marker, and Cancel/Submit. The emits carry no payload, so a parent's
 * `submitForm` never sees the click's MouseEvent.
 */
defineProps<{
  username: string
  isCreate: boolean
  isLoading: boolean
  buttonDisabled: boolean
}>()

defineEmits<{
  cancel: []
  submit: []
}>()
</script>
