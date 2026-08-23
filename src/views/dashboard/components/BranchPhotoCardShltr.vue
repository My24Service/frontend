<template>
  <section class="tw:overflow-hidden tw:rounded-md tw:border tw:border-slate-200 tw:bg-white">
    <header class="tw:border-b tw:border-slate-200 tw:py-3 tw:text-center tw:text-sm tw:font-semibold tw:text-slate-900">
      {{ title }}
    </header>

    <div class="tw:flex tw:gap-6 tw:border-b tw:border-slate-200 tw:px-4 tw:pt-2 tw:text-sm">
      <button
        type="button"
        class="tw:-mb-px tw:border-b-2 tw:border-transparent tw:bg-transparent tw:pb-2"
        :class="activeTab === 'adres'
          ? 'tw:border-teal-500 tw:font-medium tw:text-slate-900'
          : 'tw:text-slate-500'"
        @click="activeTab = 'adres'"
      >{{ $trans('Address') }}</button>
      <button
        type="button"
        class="tw:-mb-px tw:border-b-2 tw:border-transparent tw:bg-transparent tw:pb-2"
        :class="activeTab === 'informatie'
          ? 'tw:border-teal-500 tw:font-medium tw:text-slate-900'
          : 'tw:text-slate-500'"
        @click="activeTab = 'informatie'"
      >{{ $trans('Information') }}</button>
    </div>

    <div class="tw:p-4">
      <div v-show="activeTab === 'adres'">
        <div class="tw:aspect-[16/10] tw:w-full tw:overflow-hidden tw:rounded">
          <img
            class="tw:h-full tw:w-full tw:object-cover"
            :src="imageUrl || NO_IMAGE_URL"
            :alt="buildingName"
          />
        </div>
        <div class="tw:mt-4 tw:space-y-0.5 tw:text-sm">
          <div class="tw:font-semibold tw:text-slate-900">{{ buildingName }}</div>
          <div class="tw:text-slate-600">{{ street }}</div>
          <div class="tw:text-slate-600">{{ zipCity }}</div>
        </div>
      </div>

      <div v-show="activeTab === 'informatie'" class="tw:space-y-1 tw:text-sm">
        <div v-for="(info, index) in infoItems" :key="index" class="tw:text-slate-600">
          <span class="tw:font-medium tw:text-slate-900">{{ info.label }}:</span>
          {{ info.value }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import {NO_IMAGE_URL} from "@/constants";

// Same props as BranchPhotoCard — only the markup differs.
export default {
  name: 'BranchPhotoCardShltr',
  props: {
    title: {
      type: String,
      default: 'Locatie'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    buildingName: {
      type: String,
      default: ''
    },
    street: {
      type: String,
      default: ''
    },
    zipCity: {
      type: String,
      default: ''
    },
    infoItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      NO_IMAGE_URL,
      activeTab: 'adres'
    }
  }
}
</script>
