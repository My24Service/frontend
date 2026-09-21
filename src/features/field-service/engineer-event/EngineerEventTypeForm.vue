<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New event type') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit event type') }}</h2>
        <ValidatedForm
          name="event-type"
          v-model="eventType"
          :errors="errors"
          :messages="FIELD_MESSAGES"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <b-row>
            <b-col cols="4" role="group">
              <ValidatedFormField
                name="event_type"
                id="event-type-event_type"
              />
            </b-col>
            <b-col cols="4" role="group">
              <ValidatedFormField
                name="measure_last_event_type"
                id="event-type-measure_last_event_type"
                :label="$trans('Measure last event type')"
              />
            </b-col>
            <b-col size="4">
              <BFormGroup
                :label="$trans('Status?')"
                label-for="event-type-statuscode"
              >
                <BFormSelect
                  id="event-type-statuscode"
                  v-model="eventType.statuscode"
                  :options="statuscodeOptions"
                  size="sm"
                  value-field="id"
                  text-field="statuscode"
                />
              </BFormGroup>
            </b-col>
          </b-row>
        </ValidatedForm>
        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton
              class="btn btn-secondary"
              type="button"
              variant="secondary"
              @click="cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              class="btn btn-primary"
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import type { EngineerEventType, EngineerEventTypeRequest, Statuscode } from '@/api/types.gen'
import { companyEngineerEventType } from '@/api/resources.gen'
import {
  useResourceForm,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'

import {
  FIELD_LABELS,
  FIELD_MESSAGES,
  emptyEngineerEventType,
  engineerEventTypeFromRecord,
  parseEngineerEventType,
  validateEngineerEventType,
  type EngineerEventTypeFieldErrors,
  type EngineerEventTypeFormValues,
} from './schemas'

/**
 * The event-type create/edit form: a type, an optional "measure last event
 * type" and the statuscode the backend reports the event to.
 *
 * The three fields, their ids and their copy are the legacy screen's. What
 * changes is the body: the legacy edit PATCHed the whole record back — `id`,
 * `created`, `modified`, `statuscode_view` and the three counts — where the
 * parse now keeps the three keys the request declares. The ledger records it.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const store = useMainStore()

/**
 * The tenant's statuscodes, as `get-initial-data` delivered them, with the
 * empty option the select needs to mean "no statuscode" — the legacy screen's
 * `[{id: null, statuscode: ''}, ...statuscodes]`.
 */
const statuscodeOptions = computed<{id: number | null; statuscode: string}[]>(() => [
  {id: null, statuscode: ''},
  ...((store.getStatuscodes ?? []) as Statuscode[]).map((statuscode) => ({
    id: statuscode.id,
    statuscode: statuscode.statuscode,
  })),
])

const {
  values: eventType,
  errors,
  submitClicked,
  isCreate,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<
  EngineerEventTypeFormValues,
  EngineerEventType,
  EngineerEventTypeRequest,
  EngineerEventTypeFieldErrors
>({
  pk: () => props.pk,
  resource: companyEngineerEventType,
  empty: emptyEngineerEventType,
  fromRecord: engineerEventTypeFromRecord,
  validate: validateEngineerEventType,
  parse: parseEngineerEventType,
  copy: {
    fetchError: $trans('Error fetching event type'),
    created: $trans('Created'),
    createdDetail: $trans('Event type has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Event type has been updated'),
    createError: $trans('Error creating event type'),
    updateError: $trans('Error updating event type'),
  },
})
</script>
