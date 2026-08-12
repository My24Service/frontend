<template>
  <component
    :is="blockComponent"
    v-if="!isLoading"
    :title="$trans('Log')"
    iconName="card-list"
    height="100%"
  >
    <table v-if="isShltrTheme" class="tw:w-full tw:text-sm">
      <tbody>
        <tr
          v-for="status in statuses"
          :key="status.id"
          class="tw:border-b tw:border-slate-100 tw:last:border-0"
        >
          <td class="tw:w-20 tw:px-4 tw:py-2 tw:tabular-nums tw:text-slate-500">
            {{ status.order_id }}
          </td>
          <td
            class="tw:px-4 tw:py-2"
            :style="`color:${getStatusColor(status.status)}`"
            :title="status.status_full"
          >
            {{ status.status }}
          </td>
          <td class="tw:w-40 tw:px-4 tw:py-2 tw:text-right tw:tabular-nums tw:text-slate-500">
            {{ status.created }}
          </td>
        </tr>
      </tbody>
    </table>

    <BContainer v-else class="container">
      <BRow v-for="status in statuses" :key="status.id" class="log-row">
        <BCol cols="2">
          {{ status.order_id }}
        </BCol>
        <BCol
          cols="8"
          :style="`color:${getStatusColor(status.status)}`"
          :title="status.status_full"
        >
          {{ status.status}}
        </BCol>
        <BCol cols="2">
          {{ status.created }}
        </BCol>
      </BRow>
    </BContainer>
  </component>
</template>

<script>
import {StatusesService} from '@/models/orders/Status.js'
import {useMainStore} from "@/stores/main/index.js";
import my24 from "@/services/my24.js";
import DashboardBlock from "./DashboardBlock.vue";
import DashboardBlockShltr from "./DashboardBlockShltr.vue";
import {$trans} from "@/utils.js";
import componentMixin from "@/mixins/common";

export default {
  name: "LogComponent",
  setup() {
    const mainStore = useMainStore()
    return { mainStore }
  },
  mixins: [componentMixin],
  components: {
    DashboardBlock,
    DashboardBlockShltr
  },
  computed: {
    blockComponent() {
      return this.isShltrTheme ? 'DashboardBlockShltr' : 'DashboardBlock'
    }
  },
  data() {
    return {
      isLoading: false,
      statusService: new StatusesService(),
      statuses: [],
      statuscodes: [],
    }
  },
  async created() {
    this.statuscodes = await this.mainStore.getStatuscodes
    await this.loadData()
  },
  methods: {
    $trans,
    getStatusColor(status) {
      return my24.status2color(this.statuscodes, status)
    },
    async loadData() {
      this.isLoading = true

      try {
        const statuses = await this.statusService.list()
        this.statuses = statuses.results.slice(0, 12)
        this.isLoading = false
      } catch(error) {
        console.error('error getting start page data', error)
        this.isLoading = false
      }
    }
  },
}
</script>

<style scoped>
.container {
  height: 0;
  overflow-y: visible; /* this allows the dashboard block to grow correctly */
}

div.log-row {
  padding: .4em;
  &:hover {
    background-color: #179DA0;
    color: #fff;
  }
}
</style>
