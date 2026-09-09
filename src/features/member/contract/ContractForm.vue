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
import { memberContractListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/utils'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const queryClient = useQueryClient()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
const contractId = computed(() => Number(props.pk))

const moduleDataQuery = useQuery(memberGetModuleDataListOptions())

const detailQuery = useQuery(() => ({
  ...memberContractRetrieveOptions({path: {id: contractId.value}}),
  enabled: !isCreate.value,
}))

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

const name = ref('')
const selection = ref<ModuleSelection>({})
const detailApplied = ref(false)

watch(
  [() => moduleDataQuery.data.value, () => detailQuery.data.value],
  ([tree, detail]) => {
    if (!tree) return

    const seeded: ModuleSelection = {}
    for (const module of tree) {
      seeded[`${module.id}`] = selection.value[`${module.id}`] ?? []
    }
    selection.value = seeded

    if (!detailApplied.value && (detail || isCreate.value)) {
      if (detail?.name) name.value = detail.name

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

const saveMutation = useMutation({
  ...memberContractCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('contract has been created'))
    await queryClient.invalidateQueries({queryKey: memberContractListQueryKey()})
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
    await queryClient.invalidateQueries({queryKey: memberContractListQueryKey()})
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

  const body = parseContract(values)

  try {
    if (isCreate.value) {
      await saveMutation.mutateAsync({body})
    } else {
      await updateMutation.mutateAsync({path: {id: contractId.value}, body})
    }
  } catch {
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
