<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiShop></IBiShop>
          <span class="backlink" @click="goBack">{{ $trans('Suppliers') }}</span> / {{ record?.name }}
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}</BButton>
          <router-link
            :to="{name: 'supplier-edit', params: {pk: id ?? 0}}"
            class="btn btn-primary"
          >
            {{$trans('Edit supplier') }}
          </router-link>
          </div>
      </div>
    </header>
    <div class="page-detail flex-columns">
      <div class="panel col-1-3">
        <h6>{{ $trans('Supplier') }}</h6>
        <dl>
          <dt>{{ $trans('Identifier') }}</dt>
          <dd>{{ record?.identifier }}</dd>

          <dt>{{ $trans('Name') }}</dt>
          <dd>{{ record?.name }}</dd>

          <dt>{{ $trans('Address') }}</dt>
          <dd>{{ record?.address }}</dd>

          <dt>{{ $trans('Country/Postal/city') }}</dt>
          <dd>
            {{ record?.country_code }}-
            {{ record?.postal }} {{ record?.city }}
          </dd>

        </dl>

        <dl>

          <dt>{{ $trans('Contact') }}</dt>
          <dd>{{ record?.contact }}</dd>

          <dt>{{ $trans('Tel.') }}</dt>
          <dd>{{ record?.tel }}</dd>

          <dt>{{ $trans('Mobile') }}</dt>
          <dd>{{ record?.mobile }}</dd>

          <dt>{{ $trans('Email') }}</dt>
          <dd>
            <BLink v-if="record?.email" class="px-1" v-bind:href="`mailto:${record.email}`">
              {{ record.email }}
            </BLink>
          </dd>

          <dt>{{ $trans('Remarks') }}</dt>
          <dd>{{ record?.remarks }}</dd>

        </dl>
      </div>
      <div class="panel col-2-3">
        <h6>{{ $trans('Materials') }}</h6>
        <b-table
          id="materials-table"
          :fields="materialFields"
          :items="materials"
        ></b-table>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/**
 * The supplier detail page: the record and the materials it supplies.
 *
 * The materials are read as the whole collection (`supplier_relation` is the
 * material list's own filter), not the default page of twenty. The list
 * options are called directly rather than through `listOptions`: that one
 * stringifies a filter's value, and `supplier_relation` is an integer the
 * request validation refuses as text. The legacy screen answered either read
 * failing with one message and so does this.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const { router } = useCommon()

const id = computed(() => (props.pk == null ? null : Number(props.pk)))

const detailQuery = useQuery(() => ({
  ...Api.InventorySupplier.retrieveOptions(id.value ?? 0),
  enabled: id.value != null,
}))
const materialsQuery = useQuery(() => ({
  ...Api.InventoryMaterial.list.options({query: {
    page: 1,
    page_size: WHOLE_COLLECTION_PAGE_SIZE,
    supplier_relation: id.value ?? 0,
  }}),
  enabled: id.value != null,
}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching supplier/materials'))
useQueryErrorToast(materialsQuery.error, $trans('Error fetching supplier/materials'))

const record = computed(() => detailQuery.data.value)
const materials = computed(() => materialsQuery.data.value?.results ?? [])

const materialFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'unit', label: $trans('Unit') },
  { key: 'modified', label: $trans('Modified') },
]

function goBack() {
  router.go(-1)
}
</script>
