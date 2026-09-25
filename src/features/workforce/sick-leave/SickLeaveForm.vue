<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div
      v-if="isCreate || record"
      class="app-page"
    >
      <header>
        <div class="page-title">
          <h3>
            <IBiFileEarmarkCheckFill />
            <router-link :to="{name: 'sick-leave-list'}">{{ $trans('Sick leave') }}</router-link>
            /
            <span class="dimmed">
              <span v-if="isCreate">{{ $trans('new') }}</span>
              <span v-else>{{ $trans('edit') }}</span>
            </span>
          </h3>
          <div class="flex-columns">
            <BButton
              type="button"
              variant="secondary"
              @click="form.cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="form.submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
          </div>
        </div>
      </header>

      <div class="page-detail flex-columns">
        <div class="panel">
          <h6>{{ $trans('Sick leave') }}</h6>

          <BFormGroup
            v-if="isCreate"
            label-size="sm"
            label-class="p-sm-0"
            :label="$trans('Search existing user')"
            label-for="user-search"
          >
            <VueMultiselect
              id="user-search"
              track-by="id"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="options"
              :multiple="false"
              :loading="searching"
              :internal-search="false"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :hide-selected="true"
              :custom-label="userLabel"
              @search-change="onSearch"
              @select="selectUser"
            >
              <template #noResult>{{ $trans('Nothing found.') }}</template>
            </VueMultiselect>
          </BFormGroup>

          <BFormGroup
            v-if="isCreate"
            :label="$trans('User')"
            label-for="sick_user_name"
          >
            <BFormInput
              id="sick_user_name"
              v-model="userName"
              placeholder="User"
              readonly
              :state="submitClicked ? !errors.user : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.user : null">
              {{ errors.user }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <div class="flex-columns">
            <BFormGroup
              :label="$trans('Start date')"
              label-for="start_date"
            >
              <VueDatePicker
                id="start_date"
                v-model="values.start_date"
                :placeholder="$trans('Select date')"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{input: 'dd/MM/yyyy'}"
                :state="submitClicked ? !errors.start_date : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.start_date : null">
                {{ errors.start_date }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import moment from 'moment'
import { nl } from 'date-fns/locale'
import VueMultiselect from 'vue-multiselect'

import { useResourceForm } from '@/features/forms'
import { useUserSearch } from '../use-user-search'
import {
  emptySickLeave,
  sickLeaveFromRecord,
  sickLeaveWrite,
} from './schemas'

/**
 * The sick-leave create/edit form: one person and the day the leave starts.
 *
 * The person is picked on a create only - the endpoint's request declares
 * `user`, so an edit sends the record's own - and the search is the shared
 * tenant-wide people picker. The read, the pk split, the write pair, the toasts
 * and the exit are `useResourceForm`'s.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const today = moment().format('YYYY-MM-DD')
const {term, options, loading: searching} = useUserSearch()

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.CompanyUserSickLeaveAdmin,
  empty: () => emptySickLeave(today),
  fromRecord: sickLeaveFromRecord,
  validate: sickLeaveWrite.validate,
  parse: sickLeaveWrite.parse,
  copy: {
    fetchError: $trans('Error loading sick leave'),
    created: $trans('Created'),
    createdDetail: $trans('Leave has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Leave has been updated'),
    createError: $trans('Error creating leave'),
    updateError: $trans('Error updating leave'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record} = form

/** The chosen user's name; the wire carries the id. */
const userName = ref('')

watch(record, (data) => {
  if (data) userName.value = data.full_name ?? ''
}, {immediate: true})

function userLabel(option: Api.UserSelectRow): string {
  return option.name
}

function onSearch(value: string) {
  term.value = value
}

function selectUser(option: Api.UserSelectRow) {
  values.value.user = option.id
  userName.value = option.name
}
</script>
