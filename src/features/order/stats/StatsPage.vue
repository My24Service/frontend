<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkBarGraphFill />{{ $trans("Order stats") }}</h3>
        <div class="flex-columns">
          <span>{{ $trans("view") }}</span>
          <router-link
            class="btn button"
            :class="{active: period === 'year'}"
            :to="{name: 'order-year-stats'}"
          >{{ $trans("year") }}</router-link>
          <router-link
            class="btn button"
            :class="{active: period === 'month'}"
            :to="{name: 'order-month-stats'}"
          >{{ $trans("month") }}</router-link>
        </div>
      </div>
    </header>

    <div class="panel">
      <b-row align-v="center">
        <b-col cols="2">
          <BLink
            :title="previousTitle"
            @click.prevent="emit('previous')"
          >
            <IBiArrowLeft font-scale="1.8" />
          </BLink>
        </b-col>
        <b-col
          cols="8"
          class="text-center"
        >
          <h4>{{ title }}</h4>
          <b-row>
            <b-col cols="3" />
            <b-col cols="2">
              {{ $trans('Order type') }}:
            </b-col>
            <b-col cols="4">
              <BFormSelect
                id="order-stats-type"
                :model-value="orderType"
                :options="orderTypeOptions"
                @update:model-value="(value: string) => emit('update:orderType', value)"
              />
            </b-col>
            <b-col cols="3" />
          </b-row>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <BLink
              :title="nextTitle"
              @click.prevent="emit('next')"
            >
              <IBiArrowRight font-scale="1.8" />
            </BLink>
          </div>
        </b-col>
      </b-row>

      <b-overlay
        :show="isLoading"
        rounded="sm"
      >
        <slot />
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * The frame both stats pages share: the year/month switch, the period
 * stepper, the order-type select, and the charts in the default slot.
 */
defineProps<{
  period: 'year' | 'month'
  title: string
  previousTitle: string
  nextTitle: string
  orderType: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  'update:orderType': [value: string]
}>()

const mainStore = useMainStore()
const orderTypeOptions = computed(() => [
  {value: 'all', text: 'all'},
  ...((mainStore.getOrderTypes as string[] | undefined) ?? []).map((type) => ({value: type, text: type})),
])
</script>
