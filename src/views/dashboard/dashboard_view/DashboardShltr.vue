<template>
  <div class="app-page start-page dashboard-shltr">
    <header></header>

    <div class="tw:mx-auto tw:max-w-[1400px] tw:space-y-6 tw:px-6 tw:py-8">
      <!-- branch card + log -->
      <div class="tw:grid tw:grid-cols-12 tw:gap-6">
        <div class="tw:col-span-12 tw:lg:col-span-3">
          <BranchPhotoCardShltr
            class="tw:h-full"
            v-if="branch"
            :title="branch.name"
            :image-url="branch.image"
            :building-name="branch.name"
            :street="branch.address"
            :zip-city="branch.postal + ' ' + branch.city"
            :info-items="[
              { label: 'Tel.', value: branch.tel },
              { label: 'Mobiel', value: branch.mobile },
              { label: 'E-mail', value: branch.email },
            ]"
          />
        </div>
        <!-- LogComponent brings its own card; the class falls through to it.
             h-0 + min-h-full makes this column contribute nothing to the row's
             height, so the row is sized by the branch card alone (the naturally
             shorter of the two) and the log scrolls inside whatever it gets.
             Only from lg up — below that the columns stack and each is its own
             row, where a zero-height contribution would collapse the card. -->
        <div class="tw:col-span-12 tw:lg:col-span-9 tw:lg:h-0 tw:lg:min-h-full">
          <LogComponent class="tw:h-full" />
        </div>
      </div>

      <!-- building statistics -->
      <div class="tw:grid tw:grid-cols-2 tw:gap-6 tw:md:grid-cols-4">
        <div
          v-for="stat in buildingStats"
          :key="stat.label"
          class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-4"
        >
          <div class="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
            <i :class="['bi', `bi-${stat.icon}`, 'tw:text-slate-400']"></i>
            <span class="tw:text-sm tw:font-medium tw:text-slate-700">{{ $trans(stat.label) }}</span>
          </div>
          <span class="tw:shrink-0 tw:text-sm tw:font-semibold tw:text-teal-600">{{ stat.value }}</span>
        </div>
      </div>

      <!-- work orders + order types -->
      <div class="tw:grid tw:grid-cols-12 tw:gap-6">
        <div class="tw:col-span-12 tw:lg:col-span-8">
          <DashboardBlockShltr :title="$trans('Work Orders')" icon-name="tools" class="tw:h-full">
            <WorkOrdersTable />
          </DashboardBlockShltr>
        </div>
        <div class="tw:col-span-12 tw:lg:col-span-4">
          <DashboardBlockShltr :title="$trans('Order Types')" icon-name="pie-chart-fill" class="tw:h-full">
            <div class="tw:p-4">
              <OrderTypesPie />
            </div>
          </DashboardBlockShltr>
        </div>
      </div>

      <!-- documents -->
      <div class="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-2">
        <DashboardBlockShltr
          v-if="!isLoading"
          :title="$trans('New documents - Technical')"
          icon-name="wrench-adjustable"
          class="tw:max-h-[420px]"
        >
          <b-table
            id="equipment-documents-table"
            hover
            small
            :busy="isLoading"
            :fields="documentFields"
            :items="technicalDocuments"
            responsive="md"
            class="data-table"
            sort-icon-left
          >
            <template #cell(name)="data">
              <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span>
              <BLink class="document-link" :href="data.item.url" target="_blank">
                <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                <span class="pl-4">{{ data.item.name }}</span>
              </BLink>
            </template>
            <template #cell(equipment)="data">
              <BLink :to="{ name: 'equipment-equipment-view', params: { pk: data.item.equipment } }">
                {{ data.item.equipment_view.name }}
              </BLink>
            </template>
            <template #cell(created)="data">
              <small>{{ data.item.created }}</small>
            </template>
          </b-table>
        </DashboardBlockShltr>

        <DashboardBlockShltr
          v-if="!isLoading"
          :title="$trans('New documents - Facility')"
          icon-name="buildings-fill"
          class="tw:max-h-[420px]"
        >
          <b-table
            id="location-documents-table"
            hover
            small
            :busy="isLoading"
            :fields="documentFields"
            :items="facilityDocuments"
            responsive="md"
            class="data-table"
            sort-icon-left
          >
            <template #cell(name)="data">
              <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span>
              <BLink class="document-link" :href="data.item.url" target="_blank">
                <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                <span class="pl-4">{{ data.item.name }}</span>
              </BLink>
            </template>
            <template #cell(location)="data">
              <BLink :to="{ name: 'equipment-location-view', params: { pk: data.item.location } }">
                {{ data.item.location_view.name }}
              </BLink>
            </template>
            <template #cell(created)="data">
              <small>{{ data.item.created }}</small>
            </template>
          </b-table>
        </DashboardBlockShltr>
      </div>

      <!-- monthly cost -->
      <DashboardBlockShltr
        v-if="!isLoading"
        :title="$trans('Monthly cost overview')"
        icon-name="bar-chart-fill"
      >
        <div class="tw:p-4">
          <bar-chart
            :chart-data="chartdataMonthBar"
            :options="chartOptions"
            :height="300"
          />
        </div>
      </DashboardBlockShltr>
    </div>
  </div>
</template>

<script>
import BarChart from "@/components/BarChart.vue"
import WorkOrdersTable from "@/components/WorkOrdersTable.vue"
import OrderTypesPie from "@/components/OrderTypesPie.vue"
import LogComponent from "../components/LogComponent.vue"
import BranchPhotoCardShltr from "../components/BranchPhotoCardShltr.vue"
import DashboardBlockShltr from "../components/DashboardBlockShltr.vue"
import dashboardMixin from "./dashboardMixin"

export default {
  name: 'DashboardShltr',
  mixins: [dashboardMixin],
  components: {
    LogComponent,
    BranchPhotoCardShltr,
    BarChart,
    DashboardBlockShltr,
    WorkOrdersTable,
    OrderTypesPie,
  },
  data() {
    return {
      // Same fixed figures the previous dashboard rendered as eight repeated
      // blocks; kept as data so the markup stays one loop.
      buildingStats: [
        {icon: 'building-fill', label: 'Office floor area gfa', value: '1400 m²'},
        {icon: 'building-fill', label: 'Business space area', value: '2000 m²'},
        {icon: 'p-square-fill', label: 'Parking spaces', value: '48'},
        {icon: 'pc-display-horizontal', label: 'm² gfa per workstation', value: '18 m²'},
        {icon: 'people-fill', label: 'Workstation per employee', value: '1'},
        {icon: 'pc-display-horizontal', label: 'Workstation per FTE', value: '1'},
        {icon: 'person-fill', label: 'm² gfa per employee', value: '12 m²'},
        {icon: 'square-fill', label: 'm² gfa per FTE', value: '10 m²'},
      ]
    }
  },
}
</script>
