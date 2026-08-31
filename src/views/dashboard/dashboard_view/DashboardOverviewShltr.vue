<template>
  <div class="app-page start-page dashboard-overview-shltr">
    <header></header>

    <div class="tw:mx-auto tw:max-w-[1400px] tw:space-y-6 tw:px-6 tw:py-8">
      <!-- greeting -->
      <div>
        <h2 class="tw:m-0 tw:text-2xl tw:font-semibold tw:text-slate-900">
          {{ greeting }}<template v-if="username">, {{ username }}</template>
        </h2>
        <p class="tw:m-0 tw:text-sm tw:text-slate-500">
          {{ $trans("Here's what's going on today.") }}
        </p>
      </div>

      <!-- KPIs — the headline tiles followed by the operational follow-up
           ones, on a single row you page through. How many tiles there are
           depends on which modules this member has. -->
      <KpiRowShltr :kpis="allKpis" />

      <!-- recent orders + quick links -->
      <div class="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-3">
        <DashboardBlockShltr
          class="tw:lg:col-span-2"
          :title="$trans('Recent orders')"
          icon-name="clipboard-check"
        >
          <template #actions>
            <router-link
              :to="{name: 'order-list'}"
              class="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-teal-600 tw:no-underline tw:hover:underline"
            >
              {{ $trans('View all') }} <IBiArrowUpRight></IBiArrowUpRight>
            </router-link>
          </template>

          <p v-if="isLoading" class="tw:p-5 tw:text-sm tw:text-slate-500">
            {{ $trans('loading orders') }}
          </p>
          <p v-else-if="!recentOrders.length" class="tw:p-5 tw:text-sm tw:text-slate-500">
            <i>{{ $trans('No orders') }}</i>
          </p>
          <table v-else class="tw:w-full tw:text-sm">
            <thead class="tw:bg-slate-50 tw:text-xs tw:font-medium tw:text-slate-500">
              <tr>
                <th class="tw:px-5 tw:py-2 tw:text-left">{{ $trans('Nr.') }}</th>
                <th class="tw:px-5 tw:py-2 tw:text-left">{{ $trans('Customer') }}</th>
                <th class="tw:px-5 tw:py-2 tw:text-left">{{ $trans('Status') }}</th>
                <th class="tw:px-5 tw:py-2 tw:text-left">{{ $trans('Start date') }}</th>
                <th class="tw:px-5 tw:py-2 tw:text-right">{{ $trans('Type') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id" class="tw:border-t tw:border-slate-100">
                <td class="tw:px-5 tw:py-3 tw:tabular-nums tw:text-slate-500">
                  <router-link
                    :to="{name: 'order-view', params: {pk: order.id}}"
                    class="tw:text-slate-500 tw:no-underline tw:hover:underline"
                  >{{ order.order_id }}</router-link>
                </td>
                <td class="tw:px-5 tw:py-3 tw:font-medium tw:text-slate-800">{{ order.order_name }}</td>
                <td class="tw:px-5 tw:py-3">
                  <span
                    v-if="order.last_status"
                    class="tw:inline-block tw:max-w-[14rem] tw:truncate tw:rounded tw:border tw:px-2 tw:py-0.5 tw:align-middle tw:text-[11px] tw:font-medium"
                    :style="statusPillStyle(order.last_status)"
                    :title="order.last_status_full"
                  >{{ order.last_status }}</span>
                </td>
                <td class="tw:px-5 tw:py-3 tw:tabular-nums tw:text-slate-500">{{ order.start_date }}</td>
                <td class="tw:px-5 tw:py-3 tw:text-right tw:text-slate-500">{{ order.order_type }}</td>
              </tr>
            </tbody>
          </table>
        </DashboardBlockShltr>

        <DashboardBlockShltr :title="$trans('Recent workorders')" icon-name="wrench">
          <div class="tw:space-y-2 tw:p-4">
            <p v-if="isLoadingWorkorders" class="tw:text-sm tw:text-slate-500">{{ $trans('loading workorders') }}</p>
            <p v-else-if="!recentWorkorders.length" class="tw:text-sm tw:text-slate-500"><i>{{ $trans('No workorders') }}</i></p>
            <template v-else>
              <router-link
                v-for="wo in recentWorkorders"
                :key="wo.order?.id || wo.id"
                :to="wo.order?.uuid ? {name: 'workorder-view', params: {uuid: wo.order.uuid}} : {name: 'order-view', params: {pk: wo.order?.id}}"
                class="tw:flex tw:items-center tw:justify-between tw:rounded-md tw:border tw:border-slate-200 tw:p-3 tw:no-underline tw:hover:border-teal-300 tw:hover:bg-teal-50"
              >
                <span class="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                  <span class="tw:grid tw:h-9 tw:w-9 tw:shrink-0 tw:place-items-center tw:rounded-md tw:bg-teal-50 tw:text-teal-600">
                    <IBiWrench></IBiWrench>
                  </span>
                  <span class="tw:min-w-0">
                    <span class="tw:block tw:truncate tw:text-sm tw:font-medium tw:text-slate-900">
                      {{ wo.order?.order_id || wo.order?.order_name || $trans('Workorder') }}<template v-if="wo.equipment?.name"> — {{ wo.equipment.name }}</template>
                    </span>
                    <span class="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                      <template v-if="wo.location?.name">{{ wo.location.name }} · </template>{{ wo.order?.start_date || wo.modified || '' }}
                    </span>
                  </span>
                </span>
                <IBiArrowUpRight class="tw:shrink-0 tw:text-slate-400"></IBiArrowUpRight>
              </router-link>
            </template>
          </div>
        </DashboardBlockShltr>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardBlockShltr from "../components/DashboardBlockShltr.vue"
import KpiRowShltr from "../components/KpiRowShltr.vue"
import overviewMixin from "./overviewMixin"
import {OrderlineService} from "@/models/orders/Orderline"

export default {
  name: 'DashboardOverviewShltr',
  mixins: [overviewMixin],
  components: {
    DashboardBlockShltr,
    KpiRowShltr,
  },
  data() {
    return {
      recentWorkorders: [],
      isLoadingWorkorders: false,
    }
  },
  async created() {
    this.isLoadingWorkorders = true
    try {
      const svc = new OrderlineService()
      const workorders = await svc.getLatestWorkordersEquipment()
      this.recentWorkorders = (workorders || []).slice(0, 3)
    } catch (e) {
      console.error('error getting latest workorders for overview', e)
    } finally {
      this.isLoadingWorkorders = false
    }
  },
}
</script>
