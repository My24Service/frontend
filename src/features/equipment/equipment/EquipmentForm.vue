<template>
  <b-overlay
    :show="showOverlay"
    rounded="sm"
  >
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiTools />
            <span
              class="backlink"
              @click="form.cancelForm"
            >{{ $trans('Equipment') }}</span> /
            <span v-if="isCreate && !values.name">{{ $trans('new') }}</span>
            <span
              v-if="!isCreate && !values.name"
              class="dimmed"
            >{{ $trans('edit') }}</span>
            <span v-else>{{ values.name }}</span>
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
            <BButton
              v-if="isCreate"
              type="button"
              variant="success"
              :disabled="buttonDisabled"
              @click="submitFormBulk"
            >
              {{ $trans('Bulk') }}
            </BButton>
          </div>
        </div>
      </header>

      <div class="page-detail flex-columns">
        <!-- 1. The owner, and what belongs to it ------------------------- -->
        <div class="panel col-1-3">
          <h6>{{ $trans('Equipment') }} {{ hasBranches ? $trans('Branch') : $trans('Customer') }}</h6>

          <OwnerPanel
            id-prefix="equipment"
            :form-owner="formOwner"
            :errors="errors"
            :submit-clicked="submitClicked"
            :is-loading="isLoading"
          >
            <!-- The owner is shown under other conditions than the panel's
                 default "chooses and has one": a customer tenant's owner for
                 every role, a branch tenant's with the fields that belong to it,
                 and a pinned employee's as a card. -->
            <template #details>
              <OwnerDetails
                v-if="owner && !hasBranches"
                id-prefix="equipment_customer"
                :label="$trans('Customer')"
                :owner="owner"
              />

              <div v-if="owner && hasBranches && chooses">
                <OwnerDetails
                  id-prefix="equipment_branch"
                  :label="$trans('Branch')"
                  :owner="owner"
                />
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Lifespan (months)')"
                  label-for="equipment_branch_default_replace_months"
                >
                  <!-- The same value as the field in 'Equipment details', with an id
                       of its own: the legacy screen gave both copies the one id, so
                       this label pointed at whichever input came first. -->
                  <BFormInput
                    id="equipment_branch_default_replace_months"
                    v-model="defaultReplaceMonths"
                    size="sm"
                    type="number"
                  />
                </BFormGroup>
                <BFormGroup
                  label-size="sm"
                  label-cols="3"
                  :label="$trans('Price')"
                  label-for="equipment_price"
                >
                  <PriceInput
                    id="equipment_price"
                    v-model="values.price"
                    :currency="values.price_currency"
                    @priceChanged="priceChanged"
                  />
                </BFormGroup>
              </div>

              <BranchCard
                v-if="owner && hasBranches && !chooses"
                :branch="owner"
              />
            </template>
          </OwnerPanel>
        </div>

        <!-- 2. Equipment details ----------------------------------------- -->
        <div class="panel col-1-3">
          <h6>{{ $trans('Equipment details') }}</h6>

          <!-- The owner block again, as the legacy screen showed it. The prefix
               is what keeps this copy's ids apart from panel 1's. -->
          <OwnerDetails
            v-if="owner && hasBranches"
            id-prefix="equipment_detail_branch"
            :label="$trans('Branch')"
            :owner="owner"
          />

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Name')"
            label-for="equipment_name"
          >
            <BFormInput
              id="equipment_name"
              ref="name"
              v-model="values.name"
              size="sm"
              :state="submitClicked ? !errors.name : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
              {{ errors.name }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
            v-if="hasBranches"
            label-size="sm"
            label-cols="4"
            :label="$trans('Type')"
            label-for="equipment_type"
          >
            <BFormSelect
              id="equipment_type"
              v-model="values.type"
              :options="equipmentTypeOptions"
              size="sm"
            />
          </BFormGroup>
          <!-- A branchless tenant has only the one type, so the field is
               carried rather than chosen. A plain input: the select component
               does not declare 'hidden' among its input types. -->
          <input
            v-else
            id="equipment_type"
            v-model="values.type"
            type="hidden"
          >

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Brand')"
            label-for="equipment_brand"
          >
            <BFormInput
              id="equipment_brand"
              v-model="values.brand"
              size="sm"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Identifier')"
            label-for="equipment_identifier"
          >
            <BFormInput
              id="equipment_identifier"
              v-model="values.identifier"
              size="sm"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Serial number')"
            label-for="equipment_serialnumber"
          >
            <BFormInput
              id="equipment_serialnumber"
              v-model="values.serialnumber"
              size="sm"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Lifespan (months)')"
            label-for="equipment_default_replace_months"
          >
            <BFormInput
              id="equipment_default_replace_months"
              v-model="defaultReplaceMonths"
              size="sm"
              type="number"
            />
          </BFormGroup>

          <!-- `label-for` names the serial-number input, as the legacy screen had
               it. Left alone rather than repaired with an id of its own: the id
               set is the screen's DOM contract, and that call is not this
               port's. -->
          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Price')"
            label-for="equipment_serialnumber"
          >
            <PriceInput
              v-model="values.price"
              :currency="values.price_currency"
              @priceChanged="priceChanged"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Description')"
            label-for="equipment_remarks"
          >
            <BFormTextarea
              id="equipment_remarks"
              v-model="values.description"
              rows="1"
            />
          </BFormGroup>
        </div>

        <!-- 3. Usage ----------------------------------------------------- -->
        <div class="panel col-1-3">
          <h6>{{ $trans('Usage') }}</h6>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Installation date')"
            label-for="equipment_installation_date"
          >
            <VueDatePicker
              id="equipment_installation_date"
              :model-value="pickerDate(values.installation_date)"
              :placeholder="$trans('Choose a date')"
              :locale="nl"
              auto-apply
              arrow-navigation
              :formats="{ input: 'dd/MM/yyyy' }"
              @update:model-value="applyDate('installation_date', $event)"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Production date')"
            label-for="equipment_production_date"
          >
            <VueDatePicker
              id="equipment_production_date"
              :model-value="pickerDate(values.production_date)"
              :placeholder="$trans('Choose a date')"
              :locale="nl"
              auto-apply
              arrow-navigation
              :formats="{ input: 'dd/MM/yyyy' }"
              @update:model-value="applyDate('production_date', $event)"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Standard hours/mins.')"
            label-for="equipment_standard_hours_hour"
          >
            <BFormInput
              id="equipment_standard_hours_hour"
              v-model="values.standard_hours"
              size="sm"
            />
          </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            :label="$trans('Location')"
            label-for="equipment_location"
          >
            <BFormSelect
              id="equipment_location"
              v-model="values.location"
              :options="locations"
              size="sm"
              value-field="id"
              text-field="name"
            />
          </BFormGroup>
        </div>

        <!-- 4. Documents -------------------------------------------------- -->
        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              ref="documents"
              kind="equipment"
              :equipment="record"
              :is-view="false"
            />
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { nl } from 'date-fns/locale'
import { equipmentLocationListForSelectListOptions } from '@/api/@tanstack/vue-query.gen'
import type { Equipment } from '@/api/types.gen'
import { equipmentEquipment } from '@/api/resources.gen'
import { EQUIPMENT_TYPES } from '@/constants'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'
import { formatMoneyPlain, toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import DocumentsComponent from '../documents/DocumentsComponent.vue'
import OwnerDetails from '../owner/OwnerDetails.vue'
import OwnerPanel from '../owner/OwnerPanel.vue'
import { useOwnerContext } from '../owner/owner-kind'
import { useFormOwner } from '../owner/use-form-owner'
import {
  emptyEquipment,
  equipmentFromRecord,
  parseEquipment,
  pickerDate,
  validateEquipment,
  wireDate,
  type EquipmentFieldErrors,
  type EquipmentFormValues,
} from './schemas'

/**
 * The equipment create/edit form, for both product families.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s. What is its own:
 * the owner (which foreign key the tenant's request variant carries, whether
 * this user chooses it, and the type-ahead when they do), the location list that
 * follows that owner, and the document panel a create hands its new id to.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const {wireKind, chooses} = useOwnerContext()
// A branch tenant is exactly the one whose body carries the branch variant, and
// exactly the one whose type select has two values to choose between.
const hasBranches = computed(() => wireKind.value === 'branch')

/** What a new equipment's price is quoted in, as the legacy model took it. */
const mainStore = useMainStore()
const defaultCurrency = computed(() => mainStore.getDefaultCurrency)

const nameInput = useTemplateRef<{focus?: () => void}>('name')
/** The document panel, which only a create has to hand an id to. */
const documents = useTemplateRef<{parentCreated: (pk: number) => Promise<unknown>}>('documents')

const form = useResourceForm<EquipmentFormValues, Equipment, unknown, EquipmentFieldErrors>({
  pk: () => props.pk,
  resource: equipmentEquipment,
  empty: () => emptyEquipment(defaultCurrency.value),
  fromRecord: equipmentFromRecord,
  validate: (values, context) => validateEquipment(values, context, {
    kind: wireKind.value,
    responsible: chooses.value,
  }),
  parse: (values, context) => parseEquipment(values, context, wireKind.value),
  // A create renders the document panel before its record exists, so the rows
  // staged there are written once this answers with the new id.
  onSaved: async (result) => {
    await documents.value?.parentCreated((result as {id: number}).id)
  },
  copy: {
    fetchError: $trans('Error loading equipment'),
    created: $trans('Created'),
    createdDetail: $trans('Equipment has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Equipment has been updated'),
    createError: $trans('Error creating equipment'),
    updateError: $trans('Error updating equipment'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record} = form

const formOwner = useFormOwner({wireKind, chooses, isCreate, record, values, nameInput})
const {owner, ownerId, isResolvingOwner} = formOwner

const equipmentTypeOptions = computed(() => [
  {value: EQUIPMENT_TYPES.TECHNICAL, text: $trans('Technical')},
  {value: EQUIPMENT_TYPES.FACILITY, text: $trans('Facility')},
])

// The overlay covers the owner read as well, so the form never appears with an
// owner block that is about to fill itself in.
const showOverlay = computed(() => isLoading.value || isResolvingOwner.value)

/**
 * The owner whose locations the select offers.
 *
 * Null while a chooser has not picked one - and for the roles the API pins,
 * which is what makes their list below unscoped.
 */
const locationOwnerId = computed<number | null>(() => (chooses.value ? ownerId.value : null))

/**
 * The locations of the chosen owner.
 *
 * A chooser's list follows the owner they picked; a pinned role's own owner is
 * already the endpoint's scope, and the legacy screen asked for the unscoped
 * list for them, so no parameter goes out at all. That is also why the read
 * waits for a chooser to have picked: an unscoped list is not theirs to see.
 *
 * One query rather than one per variant - it is the arguments that differ, not
 * the options object, which is the shape generated `*Options` calls support.
 */
const locationsQuery = useQuery(() => {
  const ownerId = locationOwnerId.value
  return {
    ...equipmentLocationListForSelectListOptions(ownerId == null
      ? {}
      : {query: wireKind.value === 'branch' ? {branch: ownerId} : {customer: ownerId}}),
    enabled: !chooses.value || ownerId != null,
  }
})

// The legacy screen reported every load failure - this read included - under
// the one line it had for the record.
useQueryErrorToast(locationsQuery.error, $trans('Error loading equipment'))

const locations = computed(() => locationsQuery.data.value ?? [])

/**
 * Lifespan as the API declares it: a whole number, absent when the field is
 * empty. The input hands over a string, and the generated entry refuses one.
 */
const defaultReplaceMonths = computed({
  get: () => values.value.default_replace_months,
  set: (value: string | number | null) => {
    const parsed = Number(value)
    values.value.default_replace_months =
      value === '' || value === null || Number.isNaN(parsed) ? undefined : parsed
  },
})

/**
 * The price as the API declares it: a two-decimal string. `PriceInput` reports
 * every edit twice, once as the amount it typed and once as the dinero object
 * it built from it; the second is the one that normalises, which is what the
 * legacy model did through `setPriceField`.
 */
function priceChanged(dinero: ReturnType<typeof toDinero>) {
  values.value.price = formatMoneyPlain(dinero)
}

function applyDate(field: 'installation_date' | 'production_date', value: Date | null | undefined) {
  values.value[field] = wireDate(value)
}

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

  values.value = {...emptyEquipment(values.value.price_currency), ...keptOwner}
  nameInput.value?.focus?.()
}
</script>
