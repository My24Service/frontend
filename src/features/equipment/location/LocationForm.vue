<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiShopWindow />
          <span
            class="backlink"
            @click="form.cancelForm"
          >{{ $trans('Locations') }}</span> /
          <span v-if="isCreate">{{ $trans('New location') }}</span>
          <span v-if="!isCreate">{{ record?.name }} <span class="dimmed">{{ $trans('edit') }} </span></span>
        </h3>
        <div class="flex-columns">
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
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay
        :show="showOverlay"
        rounded="sm"
      >
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <h6>{{ $trans('Customer') }} / {{ $trans('Branch') }}</h6>
            <OwnerPanel
              id-prefix="location"
              :form-owner="formOwner"
              :errors="errors"
              :submit-clicked="submitClicked"
              :is-loading="isLoading"
            />
          </div>
          <div class="panel col-2-3">
            <h6>{{ $trans('Location') }}</h6>
            <b-row>
              <b-col
                cols="8"
                role="group"
              >
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Location name')"
                  label-for="location-name"
                >
                  <BFormInput
                    id="location-name"
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
              <b-col size="4">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Building')"
                  label-for="location_building"
                >
                  <BFormSelect
                    id="location_building"
                    v-model="values.building"
                    :options="buildings"
                    size="sm"
                    value-field="id"
                    text-field="name"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <div class="documents section mt-2">
              <DocumentsComponent
                ref="documents"
                kind="location"
                :location="record"
                :is-view="false"
              />
            </div>
          </div>
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useQueryErrorToast,
  useResourceForm,
} from '@/features/forms'
import { DocumentsComponent } from '@/features/equipment/documents'
import {
  OwnerPanel,
  useOwnerContext,
  useFormOwner,
} from '@/features/equipment/owner'
import {
  emptyLocation,
  locationFromRecord,
  parseLocation,
  validateLocation,
} from './schemas'

/**
 * The location create/edit form, for both product families.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s, and the owner is
 * `useFormOwner`'s, exactly as on the building form. What this screen has of its
 * own is the third read: the buildings of whichever owner is filled in, which
 * the building select offers.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const nameInput = useTemplateRef<{focus?: () => void}>('name')
/**
 * The panel's imperative handle. A create form mounts the panel before its own
 * record exists, so the id crosses this seam afterwards - see `onSaved`.
 */
const documents = useTemplateRef<{parentCreated: (pk: number) => Promise<unknown>}>('documents')
const {wireKind, chooses} = useOwnerContext()

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.EquipmentLocation,
  empty: emptyLocation,
  fromRecord: locationFromRecord,
  validate: (values, context) => validateLocation(values, context, {
    kind: wireKind.value,
    responsible: chooses.value,
  }),
  parse: (values, context) => parseLocation(values, context, wireKind.value),
  // Documents staged in the panel are written here, once the record they belong
  // to has an id. A create is the only write that has one to hand over: an edit
  // already told the panel its parent at mount, and the panel's own "Save
  // changes" button is what writes its rows - which is what the legacy screen
  // did.
  onSaved: async (result, context) => {
    if (!context.isCreate) return
    await documents.value?.parentCreated((result as {id: number}).id)
  },
  copy: {
    fetchError: $trans('Error fetching location'),
    created: $trans('Created'),
    createdDetail: $trans('Location has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Location has been updated'),
    createError: $trans('Error creating location'),
    updateError: $trans('Error updating location'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record} = form

const formOwner = useFormOwner({wireKind, chooses, isCreate, record, values, nameInput})
const {ownerId, isResolvingOwner} = formOwner

/**
 * The buildings of whichever owner is filled in.
 *
 * `ownerId` is the form's own owner slot rather than the picker's selection: it
 * is seeded from the record on an edit and written by `useFormOwner` for the
 * roles the API pins, so it is right in all three cases - and a pinned role is
 * offered its own buildings, which the legacy screen never fetched. The
 * endpoint answers 400 when its owner parameter is missing, so the read waits
 * for an id. One query: it is the argument that differs by tenant, not the
 * options object.
 */
const buildingsQuery = useQuery(() => ({
  ...Api.EquipmentBuildingListForSelect.list.options({
    query: wireKind.value === 'branch' ? {branch: ownerId.value ?? 0} : {customer: ownerId.value ?? 0},
  }),
  enabled: ownerId.value != null,
}))
useQueryErrorToast(buildingsQuery.error, $trans('Error fetching buildings'))

const buildings = computed(() => buildingsQuery.data.value ?? [])

// The overlay covers the owner read as well, so the form never appears with an
// owner block that is about to fill itself in.
const showOverlay = computed(() => isLoading.value || isResolvingOwner.value)

// A building belongs to one owner. Left in place across a change of owner it
// would go out with the branch or customer it does not belong to - the legacy
// screen replaced the options but kept the stale id. A first owner (a pick on a
// create, the record's own on an edit) leaves the building alone.
watch(ownerId, (id, previous) => {
  if (previous != null && id !== previous) values.value.building = undefined
})

/**
 * Save and stay, for entering several in a row.
 *
 * Same write as `Submit` - so the toasts, the invalidation and the guards are
 * unchanged - and then the form is cleared with the owner kept, which is what
 * the legacy screen did. The building goes back to unpicked with it, and the
 * list is not re-read: the owner has not changed, so the query key has not
 * either. `submitForm` answers whether the record was written, which is what
 * tells a cleared form from a failed one.
 */
async function submitFormBulk() {
  const keptOwner = {customer: values.value.customer, branch: values.value.branch}
  if (!await form.submitForm({stay: true})) return

  values.value = {...emptyLocation(), ...keptOwner}
  nameInput.value?.focus?.()
}
</script>
