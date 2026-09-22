<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiTerminal></IBiTerminal>
          {{ $trans('Settings') }}
        </h3>
        <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
          {{ $trans('Submit') }}
        </BButton>
      </div>
    </header>
    <b-overlay :show="isLoading" rounded="sm">
      <div class="page-detail flex-columns">
        <ValidatedForm
          name="settings"
          v-model="settings"
          :errors="errors"
          :messages="FIELD_MESSAGES"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <div v-for="group in SETTING_GROUPS" :key="group.title()" class="panel settings-group">
            <h6>{{ group.title() }}</h6>
            <template v-for="key in group.keys" :key="key">
              <BFormGroup v-if="isBooleanKey(key)" label-cols="4" label-size="sm" :label="settingLabel(key)">
                <BFormCheckbox :id="`settings_${key}`" v-model="settings[key]" switch />
              </BFormGroup>
              <ValidatedFormField v-else :name="key" label-cols="4" />
            </template>
          </div>
        </ValidatedForm>
      </div>
    </b-overlay>
  </div>
</template>

<script lang="ts" setup>
import { memberMemberMySettingsRetrieveQueryKey } from '@/api/@tanstack/vue-query.gen'
import { memberMemberMySettings } from '@/api/resources.gen'
import type { MemberSettings, PatchedMemberSettingsRequest } from '@/api/types.gen'
import {
  useResourceForm,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import {
  emptySettings,
  FIELD_LABELS,
  FIELD_MESSAGES,
  isBooleanKey,
  parseSettings,
  SETTING_GROUPS,
  settingLabel,
  settingsFromRecord,
  validateSettings,
  type SettingsFieldErrors,
  type SettingsFormValues,
} from './schemas'

const queryClient = useQueryClient()

const {
  values: settings,
  errors,
  submitClicked,
  isLoading,
  buttonDisabled,
  submitForm,
} = useResourceForm<SettingsFormValues, MemberSettings, PatchedMemberSettingsRequest, SettingsFieldErrors>({
  // The settings are one record per tenant: no pk on the route, no create.
  // `pk` is a constant so the composable treats every save as an update, and
  // the generated client refuses a path on an endpoint that has none, so only
  // the body crosses.
  pk: () => 'my',
  resource: memberMemberMySettings,
  empty: emptySettings,
  fromRecord: settingsFromRecord,
  validate: validateSettings,
  parse: parseSettings,
  // stay on the screen: there is no list to go back to
  afterSave: async () => {
    await queryClient.invalidateQueries({queryKey: memberMemberMySettingsRetrieveQueryKey()})
  },
  copy: {
    fetchError: $trans('Error fetching settings'),
    created: $trans('Updated'),
    createdDetail: $trans('Settings updated'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Settings updated'),
    createError: $trans('Error updating settings'),
    updateError: $trans('Error updating settings'),
  },
})
</script>

<style scoped>
.settings-group {
  min-width: 20rem;
}
</style>
