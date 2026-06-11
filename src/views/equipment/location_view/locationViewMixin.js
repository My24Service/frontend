import { NO_IMAGE_URL } from '@/constants'
import my24 from "@/services/my24";

import { OrderService } from '@/models/orders/Order'
import { LocationService } from "@/models/equipment/location";
import { EquipmentService } from "@/models/equipment/equipment";

import { errorToast, $trans } from "@/utils";
import { useToast } from "bootstrap-vue-next";
import { useMainStore } from "@/stores/main";
import componentMixin from "@/mixins/common";

export default {
  setup() {
    const { create } = useToast()
    const mainStore = useMainStore()

    return {
      create,
      mainStore
    }
  },
  mixins: [componentMixin],
  data() {
    return {
      NO_IMAGE_URL,
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      location: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: { width: '95%' } },
        { key: 'icons', thAttr: { width: '5%' } },
      ],
      breadcrumb: [
        {
          text: this.$trans('Location'),
          to: { name: this.listLink() }
        },
        {
          text: this.$trans('Detail'),
          active: true
        }
      ],
      locationService: new LocationService(),
      orderService: new OrderService(),
      equipmentService: new EquipmentService(),
      statsData: null,
      equipmentFields: [],
      equipmentObjects: [],
      equipmentFieldsCustomerPlanning: [
        {key: 'name', label: $trans('Name'), sortable: true},
        {key: 'customer', label: $trans('Customer'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsBranchPlanning: [
        {key: 'name', label: $trans('Name'), sortable: true},
        {key: 'branch', label: $trans('Branch'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsCustomerNonPlanning: [
        {key: 'name', label: $trans('Name'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsBranchNonPlanning: [
        {key: 'name', label: $trans('Name'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
    }
  },
  computed: {
    hasQr() {
      const qrType = this.mainStore.getEquipmentQrType;
      return qrType !== 'none'
    },
    qrUrl() {
      return this.location?.qr_url ?? this.location?.qr_path;
    },
    viewMaterialLink() {
      if (this.route_prefix) {
        return `${this.route_prefix.replace('location', 'equipment')}-view`
      }
    },
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    route_prefix: {
      type: String,
      required: true,
    },
  },
  watch: {
    currentPage: function (val) {
      this.orderService.currentPage = val
      this.loadData()
    }
  },
  methods: {
    async renderStats() {
      try {
        const orderTypeStatsData = await this.orderService.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await this.orderService.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsEquipment(this.pk)

        this.statsData = {
          orderTypeStatsData,
          monthsStatsData,
          orderTypesMonthStatsData,
          countsYearOrdertypeStats
        }
      } catch (error) {
        console.log('error fetching location stats data', error)
        errorToast(this.create, `${$trans('Error fetching location stats:')} ${error}`)
      }
    },
    download(equipment) {
      my24.downloadItem(equipment.qr_path, `${equipment.name} ${equipment.uuid}.png`)
    },
    async recreate_qr() {
      const result = await this.locationService.recreateQr(this.pk)
      this.location = {
        ...this.location,
        qr_path: result.qr_path,
        qr_url: result.qr_url,
      }
    },
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.orderService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    goBack() {
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true

      try {
        await this.loadHistory()
        this.location = await this.locationService.detail(this.pk)
        this.equipmentService.addListArg(`location=${this.pk}`)
        this.equipmentService.addListArg('page_size=1000')
        const response = await this.equipmentService.list()
        this.equipmentObjects = response.results
      } catch (error) {
        console.log('error fetching location detail data', error)
        errorToast(this.create, $trans('Error fetching location detail'))
        this.isLoading = false
      }
    },
    async loadHistory() {
      try {
        const results = await this.orderService.getAllForEquipmentLocation(null, this.pk)
        this.orders = results.results
        this.isLoading = false
      } catch (error) {
        console.log('error fetching history orders', error)
        errorToast(this.create, $trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  async created() {
    if (this.hasBranches) {
      if (this.isEmployee) {
        this.equipmentFields = this.equipmentFieldsBranchNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsBranchPlanning
      }
    } else {
      if (this.isCustomer) {
        this.equipmentFields = this.equipmentFieldsCustomerNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsCustomerPlanning
      }
    }

    await this.loadData()
  }
}