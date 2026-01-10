<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>{{ $trans("Leave") }}</h3>
      </div>
    </header>
    <div class="panel overflow-auto">
      <SubNav />
      <b-table
        small
        id="leave-table"
        :busy="isLoading"
        :fields="fields"
        :items="leaveRequests"
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
        <template #cell(date)="data">
          <span v-if="data.item.start_date == data.item.end_date">
            {{ data.item.start_date }} / {{ data.item.total_hours }}:{{ data.item.total_minutes }}
          </span>
          <span v-else>
            {{ data.item.start_date }} - {{ data.item.end_date }} / {{ data.item.total_hours }}:{{
              data.item.total_minutes
            }}
          </span>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <BLink
              :title="$trans('Accept')"
              @click="() => showAcceptModal(data.item.id)"
            >
              <IBiCheckLg class="edit-icon"></IBiCheckLg>
            </BLink>
            <BLink
              :title="$trans('Reject')"
              @click="() => showRejectModal(data.item.id)"
            >
              <IBiXLg class="edit-icon"></IBiXLg>
            </BLink>
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.leaveHoursService"
      :model_name="$trans('Leave requests')"
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
    <b-modal
      id="accept-leave-modal"
      ref="accept-leave-modal"
      v-bind:title="$trans('Accept request')"
      @ok="doAccept"
    >
      <p class="my-4">{{ $trans("Are you sure you want to accept this leave request?") }}</p>
    </b-modal>
    <b-modal
      id="reject-leave-modal"
      ref="reject-leave-modal"
      v-bind:title="$trans('Reject request')"
      @ok="doAccept"
    >
      <p class="my-4">{{ $trans("Are you sure you want to reject this leave request?") }}</p>
    </b-modal>
  </div>
</template>
<script>
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import SubNav from "./SubNav.vue";
import { UserLeaveHoursService } from "@/models/company/UserLeaveHours.js";
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
      default: "order"
    }
  },
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    SubNav
  },
  data() {
    return {
      statuscodeModel: null,
      leaveHoursService: new UserLeaveHoursService(),
      searchQuery: null,
      leavePk: null,
      isLoading: false,
      leaveRequests: [],
      fields: [
        { key: "full_name", label: $trans("User"), thAttr: { width: "15%" } },
        { key: "date", label: $trans("Date/hours") },
        { key: "leave_type_name", label: $trans("Leave type") },
        { key: "last_status_full", label: $trans("Status") },
        { key: "icons", thAttr: { width: "15%" } }
      ]
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs["search-modal"].hide();
      this.leaveHoursService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    // delete
    showAcceptModal(id) {
      this.leavePk = id;
      this.$refs["accept-leave-modal"].show();
    },
    async doAccept() {
      this.isLoading = true;
      try {
        await this.leaveHoursService.acceptLeave(this.leavePk);
        infoToast(this.create, $trans("Accepted"), $trans("Leave as been accepted"));
        await this.loadData();
      } catch (error) {
        this.isLoading = false;
        console.log("error accepting leave", error);
        errorToast(this.create, $trans("Error accepting leave"));
      }
    },
    showRejectModal(id) {
      this.leavePk = id;
      this.$refs["reject-leave-modal"].show();
    },
    async doReject() {
      this.isLoading = true;
      try {
        await this.leaveHoursService.doReject(this.leavePk);
        infoToast(this.create, $trans("Rejected"), $trans("Leave as been rejected"));
        this.loadData();
      } catch (error) {
        this.isLoading = false;
        console.log("error rejecting leave", error);
        errorToast(this.create, $trans("Error rejecting leave"));
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.leaveHoursService.getLeaveRequests();
        this.leaveRequests = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching leave requests", error);
        errorToast(this.create, $trans("Error loading leave requests"));
        this.isLoading = false;
      }
    }
  }
};
</script>
<style scoped>
.color_text {
  font-weight: bold;
  font-style: italic;
}
.subnav-pills {
  margin-bottom: 20px;
}
.edit-icon {
  margin-right: 20px;
}
</style>
