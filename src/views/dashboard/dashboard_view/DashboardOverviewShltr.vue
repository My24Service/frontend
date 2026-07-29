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

      <!-- KPIs -->
      <div class="tw:grid tw:grid-cols-2 tw:gap-4 tw:md:grid-cols-4">
        <component
          :is="kpi.to ? 'router-link' : 'div'"
          v-for="kpi in kpis"
          :key="kpi.key"
          :to="kpi.to"
          class="tw:block tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:no-underline"
          :class="kpi.to ? 'tw:hover:border-teal-300' : ''"
        >
          <i :class="['bi', `bi-${kpi.icon}`, 'tw:text-lg', kpi.iconClass]"></i>
          <div class="tw:mt-3 tw:text-2xl tw:font-semibold tw:tabular-nums tw:text-slate-900">
            {{ kpi.value === null ? '—' : kpi.value }}
          </div>
          <div class="tw:text-xs tw:text-slate-500">{{ kpi.label }}</div>
          <!-- min-h keeps the four cards the same height when only some have a hint -->
          <div class="tw:mt-2 tw:min-h-4 tw:text-[11px] tw:text-slate-400">{{ kpi.hint }}</div>
        </component>
      </div>

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

        <DashboardBlockShltr :title="$trans('Quick links')" icon-name="lightning-charge">
          <div class="tw:space-y-2 tw:p-4">
            <router-link
              v-if="canSeeInventory"
              :to="{name: 'material-list'}"
              class="tw:flex tw:items-center tw:justify-between tw:rounded-md tw:border tw:border-slate-200 tw:p-3 tw:no-underline tw:hover:border-teal-300 tw:hover:bg-teal-50"
            >
              <span class="tw:flex tw:items-center tw:gap-3">
                <span class="tw:grid tw:h-9 tw:w-9 tw:place-items-center tw:rounded-md tw:bg-teal-50 tw:text-teal-600">
                  <IBiBag></IBiBag>
                </span>
                <span>
                  <span class="tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                    {{ $trans('Materials') }}
                  </span>
                  <span class="tw:block tw:text-xs tw:text-slate-500" v-if="materialCount !== null">
                    {{ materialCount }} {{ $trans('in stock') }}
                  </span>
                </span>
              </span>
              <IBiArrowUpRight class="tw:text-slate-400"></IBiArrowUpRight>
            </router-link>

            <router-link
              v-if="canSeeCustomers"
              :to="{name: 'customer-list'}"
              class="tw:flex tw:items-center tw:justify-between tw:rounded-md tw:border tw:border-slate-200 tw:p-3 tw:no-underline tw:hover:border-teal-300 tw:hover:bg-teal-50"
            >
              <span class="tw:flex tw:items-center tw:gap-3">
                <span class="tw:grid tw:h-9 tw:w-9 tw:place-items-center tw:rounded-md tw:bg-sky-50 tw:text-sky-600">
                  <IBiPeople></IBiPeople>
                </span>
                <span>
                  <span class="tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                    {{ $trans('Customers') }}
                  </span>
                  <span class="tw:block tw:text-xs tw:text-slate-500" v-if="customerCount !== null">
                    {{ customerCount }} {{ $trans('in total') }}
                  </span>
                </span>
              </span>
              <IBiArrowUpRight class="tw:text-slate-400"></IBiArrowUpRight>
            </router-link>

            <router-link
              v-if="unacceptedCount > 0"
              :to="{name: 'orders-not-accepted'}"
              class="tw:block tw:rounded-md tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:no-underline"
            >
              <span class="tw:flex tw:items-center tw:gap-2 tw:text-amber-700">
                <IBiClock></IBiClock>
                <span class="tw:text-sm tw:font-medium">
                  {{ unacceptedCount }} {{ $trans('Unaccepted orders') }}
                </span>
              </span>
              <span class="tw:mt-1 tw:block tw:text-xs tw:text-amber-700">
                {{ $trans('These orders are waiting to be accepted by the customer.') }}
              </span>
            </router-link>
          </div>
        </DashboardBlockShltr>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardBlockShltr from "../components/DashboardBlockShltr.vue"
import overviewMixin from "./overviewMixin"

export default {
  name: 'DashboardOverviewShltr',
  mixins: [overviewMixin],
  components: {
    DashboardBlockShltr,
  },
}
</script>
