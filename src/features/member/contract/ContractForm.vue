<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New contract') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit contract') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="contract_name"
            >
              <BFormInput
                v-model="name"
                id="contract_name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="contract_name-feedback"
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || FIELD_MESSAGES.name() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" role="group">
            <ul v-for="module in modules" :key="module.id" class="contract-module">
              <li>
                <BFormCheckbox
                  :id="`module${module.id}`"
                  :model-value="isModuleFullySelected(`${module.id}`)"
                  @update:model-value="toggleModule(`${module.id}`, $event)"
                >
                  {{ module.name }}
                </BFormCheckbox>
                (<BLink @click="selectAll(`${module.id}`)">{{ $trans('all') }}</BLink> /
                <BLink @click="selectNone(`${module.id}`)">{{ $trans('none') }}</BLink>)
              </li>
              <BFormCheckboxGroup
                v-model="selection[`${module.id}`]"
              >
                <ul v-for="part in module.parts" :key="part.id">
                  <li>
                    <BFormCheckbox
                      :id="`el${part.id}`"
                      :value="`${part.id}`"
                      :disabled="isAlwaysSelected(`${module.id}`, `${part.id}`)"
                    >
                      {{ part.name }}
                    </BFormCheckbox>
                  </li>
                </ul>
              </BFormCheckboxGroup>
            </ul>
          </b-col>
        </b-row>
        <b-form-invalid-feedback
          id="contract_module_paths_pks-feedback"
          :state="submitClicked ? !errors.module_paths_pks : null">
          {{ errors.module_paths_pks || FIELD_MESSAGES.module_paths_pks() }}
        </b-form-invalid-feedback>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  memberContractCreateMutation,
  memberContractPartialUpdateMutation,
  memberContractRetrieveOptions,
  memberGetModuleDataListOptions,
} from '@/api/@tanstack/vue-query.gen'
import {
  emptyContract,
  FIELD_MESSAGES,
  parseContract,
  validateContract,
  type ContractFieldErrors,
} from './schemas'
import { pathsFromSelection, selectionFromPaths, type ModuleSelection } from './module-paths'
import { invalidateContractListQueries } from './list-invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Contract create/edit form (#323).
 *
 * A Contract is a name plus a set of Module Parts. The parts are chosen in a
 * checkbox tree fed by `GET /api/member/get-module-data/` — the read model the
 * Module and Module Part screens write, which is why their writes invalidate
 * this query (see ../module-data-invalidation.ts) — and folded into one
 * `module_paths_pks` string by ./module-paths.ts.
 *
 * Validation parses against the generated request schema (`./schemas.ts`);
 * the parse output is the body, so an update sends `{name, module_paths_pks}`
 * and never hands back `id`, `modules_text` or `max_users`.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
})

const router = useRouter()
const queryClient = useQueryClient()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
// Route params arrive as strings; the generated operations want the number.
const contractId = computed(() => Number(props.pk))

// reads -----------------------------------------------------------------

const moduleDataQuery = useQuery(memberGetModuleDataListOptions())

const detailQuery = useQuery({
  ...memberContractRetrieveOptions({path: {id: contractId.value}}),
  enabled: !isCreate.value,
})

watch(
  () => moduleDataQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading modules'))
  },
)

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching contract'))
  },
)

/** The module tree, in the order the backend sent it. */
const modules = computed(() => moduleDataQuery.data.value ?? [])

/** Parts ticked before the user touches anything, and impossible to untick. */
const alwaysSelected = computed(() => {
  const map: ModuleSelection = {}
  for (const module of modules.value) {
    const ids = module.parts
      .filter((part) => part.is_always_selected)
      .map((part) => `${part.id}`)
    if (ids.length) map[`${module.id}`] = ids
  }
  return map
})

function isAlwaysSelected(moduleId: string, partId: string): boolean {
  return alwaysSelected.value[moduleId]?.includes(partId) ?? false
}

// form state ------------------------------------------------------------

const name = ref('')
/** Per-module selected part ids, keyed by module id as a string. */
const selection = ref<ModuleSelection>({})

watch(
  [() => moduleDataQuery.data.value, () => detailQuery.data.value],
  ([tree, detail]) => {
    if (!tree) return

    // Seed every module with an empty selection, keeping whatever a previous
    // pass already chose for modules still in the tree.
    const seeded: ModuleSelection = {}
    for (const module of tree) {
      seeded[`${module.id}`] = selection.value[`${module.id}`] ?? []
    }
    selection.value = seeded

    if (detail?.name) name.value = detail.name

    // The stored encoding may name modules this tenant's tree no longer has;
    // they are kept so an untouched edit encodes back exactly as it came in.
    const parsed = selectionFromPaths(detail?.module_paths_pks)
    for (const [moduleId, parts] of Object.entries(parsed)) {
      selection.value[moduleId] = parts
    }

    applyAlwaysSelected()
  },
  {immediate: true},
)

/** Make sure the always-selected ones are ticked wherever the user left them off. */
function applyAlwaysSelected() {
  for (const [moduleId, partIds] of Object.entries(alwaysSelected.value)) {
    const current = selection.value[moduleId] ? [...selection.value[moduleId]] : []
    for (const partId of partIds) {
      if (!current.includes(partId)) current.push(partId)
    }
    selection.value[moduleId] = current
  }
}

/**
 * The module-level checkbox. In the legacy screen it was wired to a
 * `selectedModules` array nothing ever read: clicking it toggled the visual
 * and snapped back on the next part change — a control that did nothing a
 * user could perceive. It now does what its affordance promises: on means
 * every part of the module selected, off means back to the always-selected
 * floor (the same place the "none" link leaves you).
 */
function isModuleFullySelected(moduleId: string): boolean {
  const module = modules.value.find((candidate) => `${candidate.id}` === moduleId)
  if (!module || module.parts.length === 0) return false
  return module.parts.every((part) => selection.value[moduleId]?.includes(`${part.id}`))
}

function toggleModule(moduleId: string, on: unknown) {
  if (on) selectAll(moduleId)
  else selectNone(moduleId)
}

function selectAll(moduleId: string) {
  const module = modules.value.find((candidate) => `${candidate.id}` === moduleId)
  if (!module) return
  selection.value[moduleId] = module.parts.map((part) => `${part.id}`)
}

function selectNone(moduleId: string) {
  // The always-selected parts come straight back: their checkboxes are
  // disabled, so "none" was never able to remove them either.
  selection.value[moduleId] = [...(alwaysSelected.value[moduleId] ?? [])]
}

// writes ----------------------------------------------------------------

const saveMutation = useMutation({
  ...memberContractCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('contract has been created'))
    await invalidateContractListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating contract'))
  },
})

const updateMutation = useMutation({
  ...memberContractPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('contract has been updated'))
    await invalidateContractListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating contract'))
  },
})

const isLoading = computed(() =>
  moduleDataQuery.isLoading.value ||
  detailQuery.isLoading.value ||
  saveMutation.isPending.value ||
  updateMutation.isPending.value,
)
const buttonDisabled = computed(() =>
  saveMutation.isPending.value || updateMutation.isPending.value,
)

// validation ------------------------------------------------------------

const errors = ref<ContractFieldErrors>({})
const submitClicked = ref(false)

async function submitForm() {
  submitClicked.value = true

  const values = emptyContract()
  values.name = name.value
  values.module_paths_pks = pathsFromSelection(selection.value)

  const found = validateContract(values)
  errors.value = found
  if (Object.keys(found).length > 0) return

  // The parsed output is the body — typed by the request schema and stripped
  // of anything it does not declare.
  const body = parseContract(values)

  try {
    if (isCreate.value) {
      await saveMutation.mutateAsync({body})
    } else {
      await updateMutation.mutateAsync({path: {id: contractId.value}, body})
    }
  } catch {
    // Already handled: onError told the user what failed and the form keeps
    // what they chose.
  }
}

function cancelForm() {
  router.go(-1)
}
</script>

<style scoped>
ul {
  list-style-type: none;
}
</style>
