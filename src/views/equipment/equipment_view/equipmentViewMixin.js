import { NO_IMAGE_URL } from '@/constants'
import my24 from "@/services/my24";

import { OrderService } from '@/models/orders/Order'
import { EquipmentService } from "@/models/equipment/equipment";

import { errorToast, $trans } from "@/utils";

import moment from 'moment/min/moment-with-locales'
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
      orderService: new OrderService(),
      equipmentService: new EquipmentService(),
      buttonDisabled: false,
      equipment: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: { width: '95%' } },
        { key: 'icons', thAttr: { width: '5%' } },
      ],
      breadcrumb: [
        {
          text: this.$trans('Equipment'),
          to: { name: this.listLink() }
        },
        {
          text: this.$trans('Detail'),
          active: true
        }
      ],
      statsData: null
    }
  },
  computed: {
    hasQr() {
      const qrType = this.mainStore.getEquipmentQrType;
      return qrType !== 'none'
    },
    qrUrl() {
      return this.equipment?.qr_url ?? this.equipment?.qr_path;
    },
    editLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-edit'
      } else {
        return 'customers-equipment-edit'
      }
    },
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
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
        console.log('error fetching equipment stats data', error)
        errorToast(this.create, `${$trans('Error fetching equipment stats:')} ${error}`)
      }
    },
    download(equipment) {
      my24.downloadItem(equipment.qr_path, `${equipment.name} ${equipment.uuid}.png`)
    },
    async recreate_qr() {
      const result = await this.equipmentService.recreateQr(this.pk)
      this.equipment = {
        ...this.equipment,
        qr_path: result.qr_path,
        qr_url: result.qr_url,
      }
    },
    listLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-list'
      } else {
        return 'customers-equipment-list'
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

        const equipmentData = await this.equipmentService.detail(this.pk)
        this.equipment = new this.equipmentService.model(equipmentData)
        await this.renderStats()
      } catch (error) {
        console.log('error fetching equipment detail data', error)
        errorToast(this.create, `${$trans('Error fetching equipment detail:')} ${error}`)
        this.isLoading = false
      }
    },
    async loadHistory() {
      try {
        const results = await this.orderService.getAllForEquipmentLocation(this.pk, null)
        this.orders = results.results
        this.isLoading = false
      } catch (error) {
        console.log('error fetching history orders', error)
        errorToast(this.create, this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment;
    this.$moment.locale(lang)
  }
}
