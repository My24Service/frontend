<template>
  <div class="app-page start-page">
    <header><!--
      <div class="page-title">
        <h3>
          <IBiSpeedometer></IBiSpeedometer>
          <span>{{ $trans('Overall statistics')}}</span>
        </h3>
      </div> -->
    </header>

    <div class="section dashboard_section">
      <!-- ROW 1 -->
      <div class="row dashboard_row">
        <div class="col-lgl-6">
          <div class="row">
            <div class="col-lg-3">
              <DashboardTabbedBlock
                v-if="!isLoading"
                :tab-list="companyTabs"
                :title="member.name"
                pills
              />
            </div>
            <div class="col-lg-3">
              <DashboardTabbedBlock
                v-if="!isLoading"
                :tab-list="companyInfoTabs"
                :title="$trans('Gegevens')"
                pills
              />
            </div>
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Logboek" iconName="card-list">
                <b-table
                    id="activity-table"
                    small
                    :busy='isLoading'
                    :fields="activityFields"
                    :items="activity"
                    responsive="md"
                    class="data-table pt-2 pl-2 pr-2"
                    sort-icon-left>
                    <template #table-busy>
                      <div class="text-center my-2">
                        <br>
                        <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                        <strong>{{ $trans('Loading...') }}</strong>
                        <br>
                      </div>
                    </template>
                    <template #cell(created)="data">
                      <small>{{  data.item.created }}</small>
                    </template>
                </b-table>
                <!-- <div v-html="companyLog"></div> -->
              </DashboardBlock>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section dashboard_section row dashboard_row start_page_row2 pb-2 align-items-stretch pt-4">

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                              <i class="bi bi-building-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Kantoor&shy;oppervlak vvo</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1400 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-building-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Bedrijfs&shy;ruimte oppervlak</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary ">2000 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-p-square-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Parkeerplaatsen</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary ">48</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-pc-display-horizontal"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per werkplek</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">18 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-people-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Werkplek per medewerker</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-pc-display-horizontal"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Werkplek per FTE</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per mede&shy;werker</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">12 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-square-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per FTE</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">10 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section dashboard_section mt-2">
      <div class="row dashboard_row">
        <div class="col-lgl-6">
          <div class="row">
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Nieuwe documenten - Techniek" iconName="wrench-adjustable">
                <b-table
                  id="equipment-documents-table"
                  small
                  :busy='isLoading'
                  :fields="documentFields"
                  :items="equipmentDocuments"
                  responsive="md"
                  class="data-table pt-2 pl-2 pr-2"
                  sort-icon-left>
                  <template #table-busy>
                    <div class="text-center my-2">
                      <br>
                      <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                      <strong>{{ $trans('Loading...') }}</strong>
                      <br>
                    </div>
                  </template>
                  <template #cell(name)="data">
                    <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span> {{ data.item.name }}
                  </template>
                  <template #cell(created)="data">
                    <small>{{  data.item.created }}</small>
                  </template>
                  <template #cell(file)="data">
                    <BLink :href="data.item.url" target="_blank">
                      <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                    </BLink>
                  </template>
                </b-table>
              </DashboardBlock>
            </div>
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Nieuwe documenten - Facilitair" iconName="hand-index">
                <b-table
                  id="location-documents-table"
                  small
                  :busy='isLoading'
                  :fields="documentFields"
                  :items="locationDocuments"
                  responsive="md"
                  class="data-table pt-2 pl-2 pr-2"
                  sort-icon-left>
                  <template #table-busy>
                    <div class="text-center my-2">
                      <br>
                      <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                      <strong>{{ $trans('Loading...') }}</strong>
                      <br>
                    </div>
                  </template>
                  <template #cell(name)="data">
                    <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span> {{ data.item.name }}
                  </template>
                  <template #cell(created)="data">
                    <small>{{  data.item.created }}</small>
                  </template>
                  <template #cell(file)="data">
                    <BLink :href="data.item.url" target="_blank">
                      <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                    </BLink>
                  </template>
                </b-table>
              </DashboardBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BarChart from "@/components/BarChart.vue"
import PieChart from "@/components/PieChart.vue"
import componentMixin from "@/mixins/common";
import {$trans} from "@/utils";
import {NO_IMAGE_URL} from "@/constants";
import memberModel from "@/models/member/Member";
import activityModel from '@/models/company/Activity.js'
import {DocumentService, LocationDocumentService} from "@/models/equipment/Document";

let d = new Date()

export default {
  components: {
    BarChart,
    PieChart,
  },
  mixins: [componentMixin],
  data() {
    return {
        member: memberModel.getFields(),

        activity: [],
        activityFields: [
          {key: 'text', label: this.$trans('Activity'), sortable: true},
          {key: 'created', label: this.$trans('Date'), sortable: true},
          {key: 'icons', label: ''},
        ],
        equipmentDocumentService: new DocumentService(),
        locationDocumentService: new LocationDocumentService(),
        equipmentDocuments: [],
        locationDocuments: [],
        documentFields: [
          {key: 'name', label: this.$trans('Document'), sortable: true},
          {key: 'created', label: this.$trans('Date'), sortable: true},
          {key: 'file', label: this.$trans('File')},
        ],
        companyTabs: [
        {
          title: 'Foto',
          content: '<img class="section-image" src="'+NO_IMAGE_URL+'"/>'
        },
        {
          title: 'Locate',
          content: '' // <iframe class="mijnKaart" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2439.2961422762787!2d4.810294182413494!3d52.310628559294734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5e1ac04c45af3%3A0xdf35ceb7e66721a7!2sMYSS!5e0!3m2!1snl!2snl!4v1686299469567!5m2!1snl!2snl" width="100%" height="auto" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
        }
      ],
      companyLog: '',
      companyInfoTabs: [
        {
          title: $trans('Address'),
          content: '<div class="myss_box"></div>'
        },
        {
          title: $trans('Contacts'),
          content: ''
        },
      ],
      isLoading: false,
      year: d.getYear() + 1900,
    }
  },
  async created() {
    try {
      await this.loadData()
    } catch (e) {
      console.error(`error loading data: ${e}`)
    }
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
        //
        this.member = await memberModel.getMe();

        const activityData = await activityModel.list()
        this.activity = activityData.results

        await this.equipmentDocumentService.loadCollection()
        this.equipmentDocuments = this.equipmentDocumentService.collection

        await this.locationDocumentService.loadCollection()
        this.locationDocuments = this.locationDocumentService.collection

        console.log("equipment documents:", this.equipmentDocuments)
        console.log("location documents:", this.locationDocuments)

        this.companyTabs=[
          {
            title: 'Foto',
            content: '<img src="'+(this.member.companylogo ?? NO_IMAGE_URL)+'" alt="logo"/>'
          },
          {
            title: 'Locate',
            content: '<iframe class="mijnKaart" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2439.2961422762787!2d4.810294182413494!3d52.310628559294734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5e1ac04c45af3%3A0xdf35ceb7e66721a7!2sMYSS!5e0!3m2!1snl!2snl!4v1686299469567!5m2!1snl!2snl" width="100%" height="auto" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          }
        ];

        // this.companyLog = '<table><tr><td><br/><strong>Data kon niet worden geladen</strong></td></tr></table>';
        const contactsHtml = this.member.contacts
          .split(/\r?\n/)
          .filter(line => line.trim() !== "")
          .map(line => `<p>${line}</p>`)
          .join("");

        this.companyInfoTabs = [
            {
              title: $trans('Address'),
              content: '<div class="myss_box">'+
                (!this.member ? '' : '<img src="'+(this.member.companylogo ?? NO_IMAGE_URL)+'" class="myss-logo" alt="Logo"/><ul><li>Gebouw ELM</li><li>'+this.member.address+'</li><li>'+this.member.postal+' '+this.member.city+'</li></ul>')
                +' </div>'
            },
            {
              title: $trans('Contacts'),
              content: contactsHtml,
            },
        ];

        this.isLoading = false
      } catch(error) {
        console.log('error getting dashboard data', error)
        this.isLoading = false
      }
    }
  },
}
</script>


<style scoped>
.section.dashboard_section {
  padding: 0 1.5rem
}

.section_head {
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.1rem solid #eee;
  background: #eee;
}

.section_head h5 {
  font-size: 1rem;
}

.section_block {
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0.65rem 0.8rem 0 rgba(0, 0, 0, 0.2);
}

.myss_box ul {
  list-style: none;
  padding: 0;
}

.myss_box ul li {
  padding: 0.35rem 0;
  border-bottom: 0.1rem solid #eee;
}

.myss_box ul li:last-child {
  border-bottom: 0;
}

.myss_box ul li:first-child {
  color: var(--hoverC);
  font-weight: 900;
}

.myss-logo {
  height: 5rem;
  padding: 0;
  margin: 0 auto;
  display: block;
}

.row .section_block .tabs .tab-content.mt-3 {
  margin-top: 0;
  /* padding: 8px; */
  /* justify-content: center; */
}

.dashboard_row .row .section_block {
  height: 20rem;
}

.dashboard_row_expand .row .section_block {
  height: min-content !important;
}

.dashboard_row .row .section_block .tabs ul.nav-pills {
  margin: 4px;
  justify-content: center;
}

.dashboard_row .row .section_block .tab-content iframe {
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  outline: none;
  border: none;
}

.dashboard_row .row .section_block .tabs .nav-item .nav-link {
  border-radius: 4px;
  padding: 4px 9px;
}

div.section.dashboard_section div.row.dashboard_row div.section_block div.tabs div.tab-content div img.section-image,
div.section_block div.tabs div.tab-content.mt-3 div.tab-pane div img.section-image {
  border-radius: 0.5rem;
  object-fit: cover;
  max-height: 180px;
  width: 100%;
}

div.section.dashboard_section div.row div div.section_block div.tabs div.tab-content.section_block_content {
  border-top: 0.1rem solid #eee !important;
  padding: 0.7rem !important;
}

div.section.dashboard_section div.row div.section_block div.section_content div.table-responsive-md.data-table {
  padding: 0.5rem !important;
}

table#activity-table thead {
  position: sticky;
  top: 0;
}

table#activity-table tr {
  background-color: #ff0000 !important;
}

.section.dashboard_section .card {
  margin-top: 0.2em;
}

.section.dashboard_section .card .card-body {
  padding: 0.2em;
}

.card-left > div.align-self-center {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  border-radius: 10rem;
  border: 0.1rem solid #eee;
  flex: 0 0 auto;
  justify-content: center;
  background: var(--bs-secondary);
  margin-top: 0.4rem;
}

.card-left {
  align-items: center;
  gap: 1rem;
}

.card-left i.bi {
  color: white;
  font-size: 1.5em;
}

.section.dashboard_section .card {
  box-shadow: 0 0.65rem 0.8rem 0 rgba(0, 0, 0, 0.2);
}

.section.dashboard_section .card .card-body .card-left h6.text-primary {
  color: #000000 !important;
}

.card-body h6.text-secondary {
  text-align: right;
  font-size: 0.9rem;
  margin-left: 2rem;
  white-space: nowrap;
  color: #828282 !important;
}

span.badge {
  background-color: var(--bs-secondary);
}

table.table-docs tr td {
  height: 2em;
}

.app-page {
  background-image: none !important;
  background-color: #fff !important;
}

.app-page > header {
  padding: 0;
  min-height: 3rem !important;
}

.dashboard_row .row .section_block .nav-pills .nav-link.active,.nav-pills .show>.nav-link {
  color: #ffffff !important;
  background-color: var(--bs-secondary) !important;
}
</style>
