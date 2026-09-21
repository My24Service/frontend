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
            <IBiShop />
            {{ $trans('Branches') }} / <strong>{{ values.name }}</strong>
            <span
              v-if="!values.name"
              class="dimmed"
            >{{ $trans('branch name') }}</span>
          </h3>
          <BButton-toolbar>
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
          </BButton-toolbar>
        </div>
      </header>
      <b-form class="page-detail panel">
        <b-row>
          <b-col
            cols="3"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="branch_name"
            >
              <BFormInput
                id="branch_name"
                v-model="values.name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                {{ errors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col
            cols="3"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Address')"
              label-for="branch_address"
            >
              <BFormInput
                id="branch_address"
                v-model="values.address"
                size="sm"
                :state="submitClicked ? !errors.address : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.address : null">
                {{ errors.address }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col
            cols="2"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Postal')"
              label-for="branch_postal"
            >
              <BFormInput
                id="branch_postal"
                v-model="values.postal"
                size="sm"
                :state="submitClicked ? !errors.postal : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.postal : null">
                {{ errors.postal }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col
            cols="2"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('City')"
              label-for="branch_city"
            >
              <BFormInput
                id="branch_city"
                v-model="values.city"
                size="sm"
                :state="submitClicked ? !errors.city : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.city : null">
                {{ errors.city }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col
            cols="2"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Country')"
              label-for="branch_country"
            >
              <BFormSelect
                id="branch_country"
                v-model="values.country_code"
                :options="countries"
                size="sm"
              />
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col
            cols="4"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Email')"
              label-for="branch_email"
            >
              <BFormInput
                id="branch_email"
                v-model="values.email"
                size="sm"
              />
            </BFormGroup>
          </b-col>
          <b-col
            cols="2"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Tel.')"
              label-for="branch_tel"
            >
              <BFormInput
                id="branch_tel"
                v-model="values.tel"
                size="sm"
              />
            </BFormGroup>
          </b-col>
          <b-col
            cols="2"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Mobile')"
              label-for="branch_mobile"
            >
              <BFormInput
                id="branch_mobile"
                v-model="values.mobile"
                size="sm"
              />
            </BFormGroup>
          </b-col>
          <b-col
            cols="4"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Contact')"
              label-for="branch_contact"
            >
              <BFormTextarea
                id="branch_contact"
                v-model="values.contact"
                rows="5"
              />
            </BFormGroup>
          </b-col>
        </b-row>
        <ImageUploadField
          field-id="branch_image"
          :label="$trans('Image')"
          :current-image="currentImage"
          @selected="(dataUrl) => { values.image = dataUrl }"
        />
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { companyBranch, companyBranchMy } from '@/api/resources.gen'
import type { Branch } from '@/api/types.gen'
import { NO_IMAGE_URL } from '@/constants'
import {
  ImageUploadField,
  invalidateReads,
  useResourceForm,
} from '@/features/forms'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'
import {
  branchFromRecord,
  branchWrite,
  emptyBranch,
  type BranchFieldErrors,
  type BranchFormValues,
} from './schemas'

/**
 * The branch create/edit form, plus the branch employee's own-branch variant.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s in both modes. A
 * branch employee reaches `form/my`, which has no `:pk` but always edits
 * their own branch through the pathless `branch-my` endpoints, so that mode
 * runs the same kit on a second static config: the retrieve reads `branch-my`,
 * the update sends only the body the pathless endpoint declares, and a save
 * stays on the form. The mode is fixed per mount - a role the session does not
 * change - so one kit call with a chosen config is honest.
 *
 * What the screen has of its own is the image picker: the chosen file is
 * staged as a data URL in the values and rides the body only then, while the
 * record's own image (a URL the write endpoint rejects) stays out of the
 * values and only shows as the current image.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()
// A branch employee is pinned to their own branch: every visit to this form
// is an edit of it, exactly as the legacy screen's `isCreate` read it.
const isMyBranch = computed(() => useAuthStore().isBranchEmployee)

const countries = computed(() => mainStore.getCountries)

const branchCopy = {
  fetchError: $trans('Error loading branch'),
  created: $trans('Created'),
  createdDetail: $trans('Branch has been created'),
  updated: $trans('Updated'),
  updatedDetail: $trans('Branch has been updated'),
  createError: $trans('Error creating branch'),
  updateError: $trans('Error updating branch'),
}

/** What both modes share: the schema work and the copy. */
const branchConfig = {
  empty: emptyBranch,
  fromRecord: branchFromRecord,
  validate: branchWrite.validate,
  parse: branchWrite.parse,
  copy: branchCopy,
}

const form = useResourceForm<BranchFormValues, Branch, unknown, BranchFieldErrors>(isMyBranch.value
  ? {
    ...branchConfig,
    // No `:pk` on this route, but always an edit: a truthy pseudo-pk holds
    // the kit's edit path. Neither the retrieve nor the update reads the id
    // it produces, and there is no create.
    pk: () => 'my',
    resource: companyBranchMy,
    // The record is also a row of the branch list, which lives under another
    // path than `branch-my` - so its reads are named on top of the default.
    invalidate: async (queryClient) => {
      await invalidateReads(companyBranchMy)(queryClient)
      await invalidateReads(companyBranch)(queryClient)
    },
    // A save stays on the form, where the legacy screen reloaded it: the
    // invalidation above refetches the record behind the values.
    afterSave: async () => {},
  }
  : {
    ...branchConfig,
    pk: () => props.pk,
    resource: companyBranch,
  })

const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record } = form

const currentImage = computed(() => record.value?.image ?? NO_IMAGE_URL)
</script>
