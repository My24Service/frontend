<template>
  <DashboardBlock v-if="!isLoading" :title="$trans('Log')" iconName="card-list">
    <BContainer>
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
  </DashboardBlock>
</template>

<script>
import {StatusesService} from '@/models/orders/Status.js'
import {useMainStore} from "@/stores/main/index.js";
import my24 from "@/services/my24.js";
import DashboardBlock from "@/views/company/startpage/DashboardBlock.vue";
import {$trans} from "@/utils.js";

export default {
  name: "LogComponent",
  setup() {
    const mainStore = useMainStore()
    return { mainStore }
  },
    components: {
    DashboardBlock
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
div.log-row {
  padding: .4em;
  &:hover {
    background-color: #179DA0;
    color: #fff;
  }
}
</style>
