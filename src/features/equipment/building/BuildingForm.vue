<template>
  <b-overlay
    :show="showOverlay"
    rounded="sm"
  >
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New building') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit building') }}</h2>
        <OwnerPanel
          id-prefix="building"
          :form-owner="formOwner"
          :errors="errors"
          :submit-clicked="submitClicked"
          :is-loading="isLoading"
        />
        <b-row>
          <b-col
            cols="12"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="building-name"
            >
              <BFormInput
                id="building-name"
                ref="name"
                v-model="values.name"
                size="sm"
                :state="submitClicked ? !errors.name : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                {{ errors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton
              class="btn btn-secondary"
              type="button"
              variant="secondary"
              @click="form.cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              class="btn btn-primary"
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="form.submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
            <BButton
              v-if="isCreate"
              type="button"
              variant="success"
              :disabled="buttonDisabled"
              @click="submitFormBulk"
            >
              {{ $trans('Bulk') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import type { Building } from '@/api/types.gen'
import { equipmentBuilding } from '@/api/resources.gen'
import { useResourceForm } from '@/features/forms'
import { $trans } from '@/services/i18n'
import { OwnerPanel } from '@/features/equipment/owner'
import { useOwnerContext } from '@/features/equipment/owner'
import { useFormOwner } from '@/features/equipment/owner'
import {
  buildingFromRecord,
  emptyBuilding,
  parseBuilding,
  validateBuilding,
  type BuildingFieldErrors,
  type BuildingFormValues,
} from './schemas'

/**
 * The building create/edit form, for both product families.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s. What is its own is
 * the owner: which foreign key the tenant's request variant carries, whether
 * this user chooses it, and the type-ahead when they do.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const nameInput = useTemplateRef<{focus?: () => void}>('name')
const {wireKind, chooses} = useOwnerContext()

const form = useResourceForm<BuildingFormValues, Building, unknown, BuildingFieldErrors>({
  pk: () => props.pk,
  resource: equipmentBuilding,
  empty: emptyBuilding,
  fromRecord: buildingFromRecord,
  validate: (values, context) => validateBuilding(values, context, {
    kind: wireKind.value,
    responsible: chooses.value,
  }),
  parse: (values, context) => parseBuilding(values, context, wireKind.value),
  copy: {
    fetchError: $trans('Error fetching building'),
    created: $trans('Created'),
    createdDetail: $trans('building has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('building has been updated'),
    createError: $trans('Error creating building'),
    updateError: $trans('Error updating building'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record} = form

const formOwner = useFormOwner({wireKind, chooses, isCreate, record, values, nameInput})
const {isResolvingOwner} = formOwner

// The overlay covers the owner read as well, so the form never appears with an
// owner block that is about to fill itself in.
const showOverlay = computed(() => isLoading.value || isResolvingOwner.value)

/**
 * Save and stay, for entering several in a row.
 *
 * Same write as `Submit` - so the toasts, the invalidation and the guards are
 * unchanged - and then the form is cleared with the owner kept, which is what
 * the legacy screen did. `submitForm` answers whether the record was
 * written, which is what tells a cleared form from a failed one.
 */
async function submitFormBulk() {
  const keptOwner = {customer: values.value.customer, branch: values.value.branch}
  if (!await form.submitForm({stay: true})) return

  values.value = {...emptyBuilding(), ...keptOwner}
  nameInput.value?.focus?.()
}
</script>
