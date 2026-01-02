<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>{{ $trans("Statuscodes") }}</h3>
        <div class="flex-columns">
          <router-link class="btn button" :to="{ name: linkAdd }">
            <IBiFileEarmarkPlus></IBiFileEarmarkPlus>{{ $trans("Add statuscode") }}
          </router-link>
        </div>
      </div>
    </header>
    <div class="panel overflow-auto">
      <div class="subnav-pills">
        <PillsStatuscode />
      </div>
      <b-table
        small
        id="statuscode-table"
        :busy="isLoading"
        :fields="fields"
        :items="statuscodes"
        responsive="md"
        class="data-table"
      >
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkRefresh
                  v-bind:method="
                    function() {
                      loadData();
                    }
                  "
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  v-bind:method="
                    function() {
                      showSearchModal();
                    }
                  "
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #cell(statuscode)="data">
          <router-link :to="{ name: linkEdit, params: { pk: data.item.id } }"
            >{{ data.item.statuscode }}
          </router-link>
        </template>
        <template #cell(preview)="data">
          <small
            class="statuscode-preview"
            :style="
              `--bg-color: ${data.item.color}; --text-color: ${data.item.text_color || 'black'}`
            "
          >
            {{ data.item.statuscode }}
          </small>
        </template>
        <template #cell(color)="data">
          <span v-bind:style="{ backgroundColor: data.item.color }">
            <input type="color" name="" id="" :value="data.item.color" disabled />
          </span>
          <div class="color_text">{{ data.item.color }}</div>
        </template>
        <template #cell(text_color)="data">
          <span v-bind:style="{ width: '10px', backgroundColor: data.item.text_color }">
            <span v-if="data.item.text_color">
              <input type="color" name="" id="" :value="data.item.text_color" disabled />
            </span>
          </span>
          <div class="color_text">{{ data.item.text_color }}</div>
        </template>
        <template #cell(type)="data">
          <div v-if="data.item.start_order">
            <span class="statuscode_type">{{ $trans("Start order") }}</span>
          </div>
          <div v-if="data.item.end_order">
            <span class="statuscode_type">{{ $trans("End order") }}</span>
          </div>
          <div v-if="data.item.after_end_order">
            <span class="statuscode_type">{{ $trans("After end order") }}</span>
          </div>
          <div v-if="data.item.num_days_model_field">
            <span class="statuscode_type">
              {{
                `${data.item.num_days_model_field} ${data.item.num_days_operator} ${data.item.num_days}`
              }}
            </span>
          </div>
        </template>
        <template #cell(actions)="data">
          <b-table
            small
            :fields="action_fields"
            :items="data.item.actions"
            responsive="md"
            borderless
            thead-class="d-none"
          >
            <template #cell(id)="data">
              <router-link :to="{ name: linkEditAction, params: { pk: data.item.id } }">
                {{ data.item.name }} ({{ data.item.type }})
              </router-link>
            </template>
          </b-table>
        </template>

        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkPlus
              type="tr"
              v-bind:title="$trans('Add action')"
              v-bind:router_name="`${linkAddAction}`"
              v-bind:router_params="{ statuscode_pk: data.item.id }"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="
                function() {
                  showDeleteModal(data.item.id);
                }
              "
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.statuscodeService"
      :model_name="$trans('Statuscode')"
    />

    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />

    <b-modal
      id="delete-statuscode-modal"
      ref="delete-statuscode-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans("Are you sure you want to delete this statuscode?") }}</p>
    </b-modal>
  </div>
</template>

<script>
// import statuscodeOrderModel from "../../../models/orders/Statuscode.js";
import IconLinkPlus from "../../../components/IconLinkPlus.vue";
import IconLinkDelete from "../../../components/IconLinkDelete.vue";
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import { PIXEL_URL } from "@/constants";
import PillsStatuscode from "./PillsStatuscode.vue";
import { QuotationStatuscodeService } from "@/models/quotations/QuotationStatuscode";
import {
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_QUOTATION,
  STATUSCODE_TYPE_SICK_LEAVE,
  STATUSCODE_TYPE_INVOICE, STATUSCODE_TYPE_WORK_HOURS
} from "@/models/company/AbstractStatuscode";
import {LeaveStatuscodeService} from "@/models/company/LeaveStatuscode";
import {SickLeaveStatuscodeService} from "@/models/company/SickLeaveStatuscode";
import { InvoiceStatuscodeService } from "@/models/invoices/InvoiceStatuscode";
import {WorkHoursStatuscodeService} from "@/models/company/WorkHoursStatuscode";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  props: {
    list_type: {
      type: [String],
      default: STATUSCODE_TYPE_LEAVE_HOURS
    }
  },
  components: {
    IconLinkPlus,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    PillsStatuscode
  },
  data() {
    return {
      // type based variables
      titleAdd: null,
      linkAdd: null,
      linkEdit: null,
      linkAddAction: null,
      linkEditAction: null,
      statuscodeService: null,

      searchQuery: null,
      statuscodePk: null,
      isLoading: false,
      statuscodes: [],
      action_fields: [{ key: "id" }],
      fields: [
        { key: "statuscode", label: $trans("Statuscode"), thAttr: { width: "15%" } },
        { key: "preview", label: $trans("Preview") },
        { key: "type", label: $trans("Type") },
        { key: "description", label: $trans("Description") },
        { key: "actions", label: $trans("Actions"), thAttr: { width: "20%" } },
        { key: "icons", thAttr: { width: "15%" } }
      ],
      PIXEL_URL
    };
  },
  created() {
    this.linkAdd = `company-statuscodes-${this.list_type}-add`;
    this.linkEdit = `company-statuscodes-${this.list_type}-edit`;
    this.linkAddAction = `company-statuscodes-action-${this.list_type}-add`
    this.linkEditAction = `company-statuscodes-action-${this.list_type}-edit`

    switch (this.list_type) {
      // case "order":
      //   (this.titleAdd = $trans("New statuscode")),
      //     (this.statuscodeService = statuscodeOrderModel);
      //   this.fields = this.fieldsOrder;
      //   break;
      case STATUSCODE_TYPE_QUOTATION:
        this.statuscodeService = new QuotationStatuscodeService();
        break;
      case STATUSCODE_TYPE_LEAVE_HOURS:
        this.statuscodeService = new LeaveStatuscodeService();
        break;
      case STATUSCODE_TYPE_SICK_LEAVE:
        this.statuscodeService = new SickLeaveStatuscodeService();
        break;
      case STATUSCODE_TYPE_INVOICE:
        this.statuscodeService = new InvoiceStatuscodeService();
        break;
      case STATUSCODE_TYPE_WORK_HOURS:
        this.statuscodeService = new WorkHoursStatuscodeService();
        break;
      default:
        throw `unknown list_type: ${this.list_type}`;
    }

    this.statuscodeService.currentPage = this.$route.query.page || 1;
    this.loadData();
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs["search-modal"].hide();
      this.statuscodeService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    // delete
    showDeleteModal(id) {
      this.statuscodePk = id;
      this.$refs["delete-statuscode-modal"].show();
    },
    async doDelete() {
      try {
        await this.statuscodeService.delete(this.statuscodePk);
        infoToast(this.create, $trans("Deleted"), $trans("Statuscode has been deleted"));
        await this.loadData();
      } catch (error) {
        console.log("error deleting statuscodes", error);
        errorToast(this.create, $trans("Error deleting statuscode"));
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.statuscodeService.list();
        this.statuscodes = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching statuscodes", error);
        errorToast(this.create, $trans("Error loading statuscodes"));
        this.isLoading = false;
      }
    }
  }
};
</script>
<style scoped>
span.statuscode_type {
  font-style: italic;
}
.color_text {
  font-weight: bold;
  font-style: italic;
}
.subnav-pills {
  margin-bottom: 20px;
}
</style>
