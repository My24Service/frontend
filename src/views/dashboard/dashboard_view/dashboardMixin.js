import moment from 'moment/min/moment-with-locales'

import {BranchService} from '@/models/company/Branch'
import componentMixin from "@/mixins/common";
import {
  equipmentEquipmentDocumentList,
  invoicePurchaseYearList,
  memberMemberMeRetrieve,
} from "@/api/sdk.gen";
import {OrderService} from '@/models/orders/Order'

let d = new Date()

// All data loading for views/dashboard/DashboardView.vue (and its overview).
// Only the markup differs per product family.
//
// Note: mainStore is a computed rather than a setup() return, because Vue 3
// does not merge setup() from mixins.
export default {
  mixins: [componentMixin],
  computed: {
    mainStore() {
      return useMainStore()
    }
  },
  data() {
    return {
      member: null,
      branch: null,
      branchService: new BranchService(),
      orderService: new OrderService(),
      technicalDocuments: [],
      facilityDocuments: [],
      monthlyCostOverview: [],
      documentFields: [
        {key: 'name', label: this.$trans('Document'), sortable: true},
        {key: 'equipment', label: this.$trans('Equipment'), sortable: true},
        {key: 'created', label: this.$trans('Date'), sortable: true},
      ],
      companyLog: '',
      isLoading: false,
      year: d.getYear() + 1900,
      chartdataMonthBar: {
        labels: [],
        datasets: []
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      },
      gradient: ['#ff9933','#ff9c36','#fea03a','#fea33d','#fea741','#fdaa44','#fdae48','#fdb14b','#fdb54f','#fcb852','#fcbc56','#fcbf59','#fbc35d','#fbc660'],
    }
  },
  async created() {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    await this.loadData()
  },
  methods: {
    getFileIcon(url) {
      // Default fallback icon if URL is missing or unparseable
      const fallbackIcon = 'bi-file-earmark';
      if (!url) return fallbackIcon;

      // Clean the URL by removing query parameters (?) and hashes (#)
      const cleanUrl = url.split('?')[0].split('#')[0];

      // Get the last string after the final dot
      const parts = cleanUrl.split('.');
      if (parts.length <= 1) return fallbackIcon; // No extension found

      const ext = parts.pop().toLowerCase();

      // These are the easiest matches:
      const extensionList = [
        'pdf', 'xls', 'xlsx', 'doc', 'docx',
        'txt', 'csv', 'png', 'jpg', 'jpeg',
        'gif', 'zip', 'odt', 'eml', 'msg'
      ];

      if (extensionList.includes(ext)) {
        return `bi-filetype-${ext}`;
      }

      // Map extensions to Bootstrap Icon classes
      const iconMap = {
        jpeg: 'bi-filetype-jpg', // Map jpeg to jpg icon
        odt: 'bi-file-earmark-word', // Close approximation for OpenDocument
        eml: 'bi-envelope-paper',    // Email format
        msg: 'bi-envelope-paper'     // Email format
      };

      // Add the 'bi' base class to the returned mapped icon, or use the fallback
      return iconMap[ext] || fallbackIcon;
    },
    nextYear() {
      this.year = this.year + 1
      this.loadData()
    },
    backYear() {
      this.year = this.year - 1
      this.loadData()
    },
    async loadData() {
      this.isLoading = true

      try {
        // Direct call into the generated client - #326 deleted the
        // hand-written Member service this used to ride on.
        const {data} = await memberMemberMeRetrieve({throwOnError: true});
        this.member = data;

        if (this.isBranchEmployee) {
          this.branch = await this.branchService.getMyBranch()
        } else {
          this.branch = await this.branchService.first()
        }

        // This branch's documents, split by the type of the equipment they
        // belong to. Both filters in one query: the legacy service set each
        // through setListArgs, which replaces, so the type filter dropped the
        // branch one and every branch's documents came back.
        const documentsOfType = async (type) => {
          const {data: page} = await equipmentEquipmentDocumentList({
            query: {equipment__branch: this.branch.id, type},
            throwOnError: true,
          })
          return page.results
        }
        this.technicalDocuments = await documentsOfType('technical')
        this.facilityDocuments = await documentsOfType('facility')

        const {data: months} = await invoicePurchaseYearList({
          query: {year: this.year},
          throwOnError: true,
        })
        this.monthlyCostOverview = months

        // One bar per month. Months without purchases are absent from the
        // response, and `total` is optional: both chart as zero.
        const labels = this.$moment.monthsShort()
        const monthDataBar = []

        for (let i = 1; i <= 12; i++) {
          const monthEntry = this.monthlyCostOverview.find(item => item.month === i)
          monthDataBar.push(Number(monthEntry?.total ?? 0))
        }

        this.chartdataMonthBar = {
          labels,
          datasets: [{
            label: this.$trans('Monthly cost overview'),
            data: monthDataBar,
            backgroundColor: this.gradient
          }]
        }

        this.isLoading = false
      } catch(error) {
        console.error('error getting start page data', error)
        this.isLoading = false
      }
    }
  },
}
