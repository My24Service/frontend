<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div :class="['app-page start-page dashboard-shltr', isDefaultFamily ? 'family-default' : '']">
    <header></header>

    <!-- flex-col so the default family can reorder sections with `order`;
         the shltr family keeps the source order -->
    <div class="tw:mx-auto tw:flex tw:max-w-[1400px] tw:flex-col tw:gap-6 tw:px-6 tw:py-8">
      <!-- branch card + log -->
      <div class="tw:grid tw:grid-cols-12 tw:gap-6">
        <div class="tw:col-span-12 tw:lg:col-span-3">
          <component
            :is="branchCardComponent"
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
        <template v-for="stat in buildingStats" :key="stat.label">
          <div v-if="isDefaultFamily" class="card d-flex flex-column h-100" style="cursor: pointer">
            <div class="card-body">
              <div class="d-flex justify-content-between p-md-1">
                <div class="d-flex flex-row card-left">
                  <div class="align-self-center">
                    <i :class="['bi', `bi-${stat.icon}`]"></i>
                  </div>
                  <div>
                    <h6 class="text-primary mt-2 fw-bold">{{ $trans(stat.label) }}</h6>
                  </div>
                </div>
                <div class="align-self-center">
                  <h6 class="mb-0 fw-bold text-secondary">{{ stat.value }}</h6>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-4"
          >
            <div class="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
              <i :class="['bi', `bi-${stat.icon}`, 'tw:text-slate-400']"></i>
              <span class="tw:text-sm tw:font-medium tw:text-slate-700">{{ $trans(stat.label) }}</span>
            </div>
            <span class="tw:shrink-0 tw:text-sm tw:font-semibold tw:text-teal-600">{{ stat.value }}</span>
          </div>
        </template>
      </div>

      <!-- work orders + order types -->
      <div class="tw:grid tw:grid-cols-12 tw:gap-6" :class="isDefaultFamily ? 'tw:order-2' : ''">
        <div class="tw:col-span-12 tw:lg:col-span-8">
          <component :is="blockComponent" :title="$trans('Work Orders')" icon-name="tools" class="tw:h-full" v-bind="blockHeight('100%')">
            <WorkOrdersTable />
          </component>
        </div>
        <div class="tw:col-span-12 tw:lg:col-span-4">
          <component :is="blockComponent" :title="$trans('Order Types')" icon-name="pie-chart-fill" class="tw:h-full" v-bind="blockHeight('auto')">
            <div class="tw:p-4">
              <OrderTypesPie />
            </div>
          </component>
        </div>
      </div>

      <!-- documents -->
      <div class="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-2" :class="isDefaultFamily ? 'tw:order-1' : ''">
        <component
          :is="blockComponent"
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
        </component>

        <component
          :is="blockComponent"
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
        </component>
      </div>

      <!-- monthly cost -->
      <component
        :is="blockComponent"
        v-if="!isLoading"
        :title="$trans('Monthly cost overview')"
        icon-name="bar-chart-fill"
        :class="isDefaultFamily ? 'tw:order-3' : ''"
      >
        <div class="tw:p-4">
          <bar-chart
            :chart-data="chartdataMonthBar"
            :options="chartOptions"
            :height="300"
          />
        </div>
      </component>
    </div>
  </div>
</template>

<script>
import BarChart from "@/components/BarChart.vue"
import WorkOrdersTable from "@/components/WorkOrdersTable.vue"
import OrderTypesPie from "@/components/OrderTypesPie.vue"
import LogComponent from "./components/LogComponent.vue"
import BranchPhotoCard from "./components/BranchPhotoCard.vue"
import BranchPhotoCardShltr from "./components/BranchPhotoCardShltr.vue"
import DashboardBlock from "./components/DashboardBlock.vue"
import DashboardBlockShltr from "./components/DashboardBlockShltr.vue"
import dashboardMixin from "./dashboard_view/dashboardMixin"

// One dashboard for both product families. The shltr layout is the base;
// the default family swaps in its own card primitives, its own stats tile,
// its section order and its scoped styles (all on `profile.family`).
export default {
  name: 'Dashboard',
  mixins: [dashboardMixin],
  components: {
    LogComponent,
    BarChart,
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
  computed: {
    isDefaultFamily() {
      return this.mainStore.getProductFamily === 'default'
    },
    branchCardComponent() {
      return this.isDefaultFamily ? BranchPhotoCard : BranchPhotoCardShltr
    },
    blockComponent() {
      return this.isDefaultFamily ? DashboardBlock : DashboardBlockShltr
    },
  },
  methods: {
    // DashboardBlock sizes itself through `height`; the shltr block has no
    // such prop and is sized by the grid.
    blockHeight(height) {
      return this.isDefaultFamily ? {height} : {}
    },
  },
}
</script>

<style scoped>
/* Default family only; the shltr family is styled by its tailwind classes. */

/* Stats cards */
.family-default .card {
  border-radius: 4px;
  border: 1px solid #eef2f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 0.2rem;
}

.family-default .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.family-default .card .card-body {
  padding-block: 0.8rem;
}

.family-default .card-left {
  align-items: center;
  gap: 0.75rem;
}

.family-default .card-left > div.align-self-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.family-default .card-left i.bi {
  color: #1b4f72;
  font-size: 1.5rem;
}

.family-default .card .card-body .card-left h6.text-primary {
  color: #1b4f72 !important;
  font-size: 0.85rem;
  font-weight: 600 !important;
  margin-bottom: 0;
  line-height: 1.3;
}

.family-default .card-body h6.text-secondary {
  text-align: right;
  font-size: 1.05rem;
  color: #179da0 !important;
  margin-left: 1.5rem;
  white-space: nowrap;
}

/* Tables */
.family-default :deep(.data-table table thead th) {
  background-color: #f3f3f3;
  border-top: 1px solid #eef2f5 !important;
  border-bottom: 1px solid #eef2f5;
  color: #2b2b2b;
  font-weight: 600;
  font-size: 0.85rem;
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: none;
}

.family-default :deep(.data-table table tbody td) {
  padding: 12px 12px;
  font-size: 0.85rem;
  vertical-align: middle !important;
}

.family-default :deep(.data-table table tbody td small) {
  color: #828282;
  font-size: 0.75rem;
}

.family-default :deep(.data-table table tbody tr) {
  border-bottom: 1px solid #f5f7f8;
}

.family-default :deep(.data-table .table) {
  --bs-table-hover-bg: #179DA0;
  --bs-table-hover-color: #fff;
}

.family-default :deep(.data-table > .table-hover > tbody > tr:hover td),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td small),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td span),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td a),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi) {
  color: #ffffff;
}

.family-default :deep(.data-table > .table-hover > tbody > tr:hover span.badge) {
  background-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Document type icons */
.family-default :deep(.bi-filetype-pdf) {
  color: #179da0;
}

.family-default :deep(.bi-file-earmark-word),
.family-default :deep(.bi-filetype-doc),
.family-default :deep(.bi-filetype-docx) {
  color: #2b579a;
}

.family-default :deep(.bi-filetype-xls),
.family-default :deep(.bi-filetype-xlsx) {
  color: #217346;
}

.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-pdf),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-file-earmark-word),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-doc),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-docx),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-xls),
.family-default :deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-xlsx) {
  color: #ffffff;
}

.family-default span.badge {
  background-color: rgba(23, 157, 160, 0.1);
  color: #179da0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 6px;
  border-radius: 4px;
  margin-right: 6px;
}

.family-default.app-page {
  background-image: none !important;
  background-color: #fbfbfb;
}

.family-default.app-page > header {
  padding: 0;
  min-height: 1rem;
}

.family-default .document-link {
  i {
    margin-right: .4rem;
  }

  span {
    max-width: 16rem;
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-decoration: underline;
    vertical-align: -1px;
  }
}
</style>
