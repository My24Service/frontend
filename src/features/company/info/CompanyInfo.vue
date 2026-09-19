<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBookmarkStar />
          <span v-if="values.name">{{ values.name }}</span>
          <span
            v-else
            class="dimmed"
          >{{ $trans('Company name') }}</span>
        </h3>
        <BButton-toolbar>
          <BButton
            v-show="!isEditing"
            class="btn btn-primary"
            type="button"
            variant="primary"
            @click="isEditing = true"
          >
            <IBiPencil />
            {{ $trans('Edit') }}
          </BButton>
          <BButton
            v-if="isEditing"
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            v-if="isEditing"
            class="btn btn-primary"
            type="submit"
            variant="primary"
            :disabled="buttonDisabled"
            @click="form.submitForm"
          >
            <IBiSave />
            {{ $trans('Save') }}
          </BButton>
        </BButton-toolbar>
      </div>
    </header>
    <div class="page-detail">
      <b-form class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('Company details') }}</h6>

          <fieldset :disabled="!isEditing">
            <span
              class="company-image profile-picture"
              :class="isEditing ? 'isEditing' : ''"
            >
              <img
                width="200px"
                :src="logoPreview || currentLogo"
                alt=""
              >
              <IBiCamera
                v-show="isEditing"
                class="button-icon camera-icon"
                @click="openLogoPicker"
              />
            </span>
            <br>

            <BFormGroup
              v-if="isEditing"
              class="hidden"
              label-size="sm"
              label-cols="3"
              :label="$trans('Replace logo')"
              label-for="member_companylogo"
            >
              <BFormFile
                id="member_companylogo"
                ref="companyLogo"
                v-model="pickedLogo"
                accept="image/*"
                :placeholder="$trans('Choose a file or drop it here...')"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Name')"
              label-for="member_name"
            >
              <BFormInput
                id="member_name"
                v-model="values.name"
                size="sm"
                :state="submitClicked ? !errors.name : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                {{ errors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Company code')"
              label-for="member_companycode"
            >
              <BFormInput
                id="member_companycode"
                :model-value="record?.companycode"
                readonly
                size="sm"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Chamber of commerce')"
              label-for="member_chamber_of_commerce"
            >
              <BFormInput
                id="member_chamber_of_commerce"
                v-model="values.chamber_of_commerce"
                size="sm"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('VAT number')"
              label-for="member_vat_number"
            >
              <BFormInput
                id="member_vat_number"
                v-model="values.vat_number"
                size="sm"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Address')"
              label-for="member_address"
            >
              <BFormInput
                id="member_address"
                v-model="values.address"
                size="sm"
                :state="submitClicked ? !errors.address : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.address : null">
                {{ errors.address }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Postal')"
              label-for="member_postal"
            >
              <BFormInput
                id="member_postal"
                v-model="values.postal"
                size="sm"
                :state="submitClicked ? !errors.postal : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.postal : null">
                {{ errors.postal }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('City')"
              label-for="member_city"
            >
              <BFormInput
                id="member_city"
                v-model="values.city"
                size="sm"
                :state="submitClicked ? !errors.city : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.city : null">
                {{ errors.city }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Country')"
              label-for="member_country"
            >
              <BFormSelect
                id="member_country"
                v-model="values.country_code"
                :options="countries"
                size="sm"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Phone')"
              label-for="member_tel"
            >
              <BFormInput
                id="member_tel"
                v-model="values.tel"
                size="sm"
                :state="submitClicked ? !errors.tel : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.tel : null">
                {{ errors.tel }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('Website')"
              label-for="member_www"
            >
              <BFormInput
                id="member_www"
                v-model="values.www"
                size="sm"
                :state="submitClicked ? !errors.www : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.www : null">
                {{ errors.www }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              :label="$trans('E-mail')"
              label-for="member_email"
            >
              <BFormInput
                id="member_email"
                v-model="values.email"
                size="sm"
                :state="submitClicked ? !errors.email : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.email : null">
                {{ errors.email }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </fieldset>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Contact') }} &amp; {{ $trans('Info') }}</h6>
          <fieldset :disabled="!isEditing">
            <BFormGroup
              label-size="sm"
              :label="$trans('Contacts')"
              label-for="member_contacts"
            >
              <BFormTextarea
                id="member_contacts"
                v-model="values.contacts"
                rows="5"
                :state="submitClicked ? !errors.contacts : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.contacts : null">
                {{ errors.contacts }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              :label="$trans('Info')"
              label-for="member_info"
            >
              <BFormTextarea
                id="member_info"
                v-model="values.info"
                rows="5"
                :state="submitClicked ? !errors.info : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.info : null">
                {{ errors.info }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              :label="$trans('Activities')"
              label-for="member_activities"
            >
              <BFormTextarea
                id="member_activities"
                v-model="values.activities"
                rows="10"
                :state="submitClicked ? !errors.activities : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.activities : null">
                {{ errors.activities }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </fieldset>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Workorder image') }}</h6>
          <fieldset :disabled="!isEditing">
            <span
              class="company-image workorder-image"
              :class="isEditing ? 'isEditing' : ''"
            >
              <img
                width="200px"
                :src="workorderPreview || currentWorkorderLogo"
                alt=""
              >
              <IBiCamera
                v-show="isEditing"
                class="button-icon camera-icon"
                @click="openWorkorderPicker"
              />

              <BFormGroup
                v-show="isEditing"
                label-size="sm"
                label-for="member_companylogo_workorder"
              >
                <BFormFile
                  id="member_companylogo_workorder"
                  ref="workorderLogo"
                  v-model="pickedWorkorderLogo"
                  accept="image/*"
                  :placeholder="$trans('Choose a file or drop it here...')"
                />
              </BFormGroup>
            </span>
            <small>{{ $trans('Optional logo for on the workorder') }}</small>
          </fieldset>
        </div>
      </b-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  memberMemberMePartialUpdateMutation,
  memberMemberMeRetrieveOptions,
  memberMemberMeRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { Member } from '@/api/types.gen'
import { NO_IMAGE_URL } from '@/constants'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { useStagedImage } from '@/features/forms/use-staged-image'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import {
  emptyInfo,
  infoFromRecord,
  parseInfo,
  validateInfo,
  type InfoFormErrors,
  type InfoFormValues,
} from './schemas'

/**
 * The company info screen: the tenant's own record, shown read-only until the
 * Edit button turns every field editable in place. There is no create and no
 * delete - one record, one write - so the kit runs on the pathless
 * `member/me` endpoints with a truthy pseudo-pk holding its edit path, the
 * branch form's own-branch variant pattern.
 *
 * The screen owns the tenant's identity fields. It does not refresh the store
 * the nav reads its name and logo from - the legacy screen did not either, so
 * a rename shows in the nav on the next load. See the module README.
 */
const mainStore = useMainStore()

const isEditing = ref(false)
const countries = computed(() => mainStore.getCountries)

const form = useResourceForm<InfoFormValues, Member, unknown, InfoFormErrors>({
  // No `:pk` on this route and no create: a truthy pseudo-pk holds the kit's
  // edit path, which the retrieve and update below never read.
  pk: () => 'me',
  retrieve: () => memberMemberMeRetrieveOptions(),
  update: memberMemberMePartialUpdateMutation(),
  // The pathless endpoint declares no path, so only the body crosses.
  updateVars: (body) => ({body}),
  invalidate: (client) => client.invalidateQueries({ queryKey: memberMemberMeRetrieveQueryKey() }),
  empty: emptyInfo,
  fromRecord: infoFromRecord,
  validate: validateInfo,
  parse: parseInfo,
  // A save stays on the screen, read-only again, where the invalidation
  // refetches the record behind the values.
  afterSave: async () => {
    isEditing.value = false
  },
  copy: {
    fetchError: $trans('Error fetching member info'),
    created: $trans('Created'),
    createdDetail: $trans('Company info has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Info updated'),
    createError: $trans('Error updating info'),
    updateError: $trans('Error updating info'),
  },
})

const { values, errors, submitClicked, buttonDisabled, record } = form

/**
 * Cancel puts the record back on screen: the values reset from the fetched
 * record and the form goes read-only, which is what the legacy screen's
 * reload-and-stop-editing did.
 */
function cancelForm() {
  if (record.value) values.value = infoFromRecord(record.value)
  isEditing.value = false
}

const currentLogo = computed(() => record.value?.companylogo || NO_IMAGE_URL)
const currentWorkorderLogo = computed(() => record.value?.companylogo_workorder || NO_IMAGE_URL)

const companyLogo = useTemplateRef<{$el: HTMLElement}>('companyLogo')
const workorderLogo = useTemplateRef<{$el: HTMLElement}>('workorderLogo')

const { preview: logoPreview, stage: stageLogoFile } = useStagedImage()
const { preview: workorderPreview, stage: stageWorkorderFile } = useStagedImage()
const pickedLogo = ref<File | File[] | null>(null)
const pickedWorkorderLogo = ref<File | File[] | null>(null)

/**
 * Open the picker from the camera icon.
 *
 * The legacy screen reached the hidden input through
 * `$refs[...].$el.querySelector('input')`; that still works, and the optional
 * calls keep it from throwing where the input is not mounted.
 */
function openPicker(component: {$el: HTMLElement} | null) {
  component?.$el.querySelector('input')?.showPicker?.()
}

function openLogoPicker() {
  openPicker(companyLogo.value)
}

function openWorkorderPicker() {
  openPicker(workorderLogo.value)
}

/**
 * Stage a picked logo as a data URL for the preview and the body.
 *
 * The binding is `v-model` with a watcher - the documents panel's pattern -
 * rather than the legacy `@input` handler: the file input emits `change` (and
 * `update:modelValue`), never `input`, so the legacy handler never ran and a
 * picked logo was never staged. The read-and-preview itself is the shared
 * `useStagedImage`; only the destination (which body key) is this screen's.
 * See the module README.
 */
function stageLogo(
  picked: File | File[] | null,
  into: 'companylogo' | 'companylogo_workorder',
  stage: (file: File) => Promise<string>,
) {
  const file = Array.isArray(picked) ? picked[0] : picked
  if (!file) return
  return stage(file).then((dataUrl) => {
    values.value[into] = dataUrl
  })
}

watch(pickedLogo, (picked) => stageLogo(picked, 'companylogo', stageLogoFile))
watch(pickedWorkorderLogo, (picked) => stageLogo(picked, 'companylogo_workorder', stageWorkorderFile))
</script>
