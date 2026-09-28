<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiPeople></IBiPeople>
            <span class="backlink" @click="$emit('cancel')">{{ $trans("People") }}</span> /
            <strong> {{ editedUsername }}</strong>
            <span class="dimmed" v-if="isCreate && !editedUsername">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !editedUsername">{{ $trans('edit') }}</span>
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
/**
 * The header chrome the seven user forms wrote out by hand: the loading
 * overlay, the People backlink with the edited username, the new/edit
 * marker, and Cancel/Submit. The emits carry no payload, so a parent's
 * `submitForm` never sees the click's MouseEvent.
 */
defineProps<{
  /**
   * The edited user's name. Not `username`: the app-wide componentMixin
   * already has a `username` computed (the logged-in user's), and Vue warns
   * on every mount when a prop shadows it.
   */
  editedUsername: string
  isCreate: boolean
  isLoading: boolean
  buttonDisabled: boolean
}>()

defineEmits<{
  cancel: []
  submit: []
}>()
</script>
