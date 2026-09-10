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
                v-model="contract.name"
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
import { useQuery } from '@tanstack/vue-query'

import {
  memberContractCreateMutation,
  memberContractListQueryKey,
  memberContractPartialUpdateMutation,
  memberContractRetrieveOptions,
  memberGetModuleDataListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Contract } from '@/api/types.gen'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import {
  emptyContract,
  FIELD_MESSAGES,
  parseContract,
  validateContract,
  type ContractFieldErrors,
  type ContractFormValues,
} from './schemas'
import { pathsFromSelection, selectionFromPaths, type ModuleSelection } from './module-paths'
import { $trans } from '@/utils'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const moduleDataQuery = useQuery(memberGetModuleDataListOptions())

useQueryErrorToast(moduleDataQuery.error, $trans('Error loading modules'))

// The checkbox tree the wire encoding reads as. It lives beside the kit
// values rather than in them: `name` binds straight onto the kit state, but
// the per-module tick sets only fold into `module_paths_pks` at
// validate/parse time, below.
const selection = ref<ModuleSelection>({})

const {
  values: contract,
  errors,
  submitClicked,
  isCreate,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
  record,
} = useResourceForm<ContractFormValues, Contract, ReturnType<typeof parseContract>, ContractFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => memberContractRetrieveOptions({path: {id}}),
  create: memberContractCreateMutation(),
  update: memberContractPartialUpdateMutation(),
  invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: memberContractListQueryKey()}),
  empty: emptyContract,
  fromRecord: (entry) => ({name: entry.name ?? '', module_paths_pks: entry.module_paths_pks ?? ''}),
  validate: (values) => {
    const candidate = emptyContract()
    candidate.name = values.name
    candidate.module_paths_pks = pathsFromSelection(selection.value)
    return validateContract(candidate)
  },
  parse: (values) => {
    const candidate = emptyContract()
    candidate.name = values.name
    candidate.module_paths_pks = pathsFromSelection(selection.value)
    return parseContract(candidate)
  },
  copy: {
    fetchError: $trans('Error fetching contract'),
    created: $trans('Created'),
    createdDetail: $trans('contract has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('contract has been updated'),
    createError: $trans('Error creating contract'),
    updateError: $trans('Error updating contract'),
  },
})

const modules = computed(() => moduleDataQuery.data.value ?? [])

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

const detailApplied = ref(false)

watch(
  [() => moduleDataQuery.data.value, () => record.value],
  ([tree, detail]) => {
    if (!tree) return

    const seeded: ModuleSelection = {}
    for (const module of tree) {
      seeded[`${module.id}`] = selection.value[`${module.id}`] ?? []
    }
    selection.value = seeded

    if (!detailApplied.value && (detail || isCreate.value)) {
      if (detail?.name) contract.value.name = detail.name

      const parsed = selectionFromPaths(detail?.module_paths_pks)
      for (const [moduleId, parts] of Object.entries(parsed)) {
        selection.value[moduleId] = parts
      }
      detailApplied.value = true
    }

    applyAlwaysSelected()
  },
  {immediate: true},
)

function applyAlwaysSelected() {
  for (const [moduleId, partIds] of Object.entries(alwaysSelected.value)) {
    const current = selection.value[moduleId] ? [...selection.value[moduleId]] : []
    for (const partId of partIds) {
      if (!current.includes(partId)) current.push(partId)
    }
    selection.value[moduleId] = current
  }
}

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
  selection.value[moduleId] = [...(alwaysSelected.value[moduleId] ?? [])]
}

const isLoading = computed(() =>
  baseIsLoading.value ||
  moduleDataQuery.isLoading.value,
)
</script>

<style scoped>
ul {
  list-style-type: none;
}
</style>
