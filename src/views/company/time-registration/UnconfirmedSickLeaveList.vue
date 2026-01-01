<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-check-fill"></b-icon>{{ $trans("Unconfirmed sick leave") }}</h3>
      </div>
    </header>
    <div class="panel overflow-auto">

      <SubNav />

      <b-table
        small
        id="leave-table"
        :busy="isLoading"
        :fields="fields"
        :items="leaves"
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
        <template #cell(full_name)="data">
          <BLink :to="{ name: 'leave-edit', params: { pk: data.item.id } }">{{
            data.item.full_name
          }}</BLink>
        </template>
        <template #cell(date)="data">
          <span v-if="!data.item.end_date">
            {{ data.item.start_date }}
          </span>
          <span v-else>
            {{ data.item.start_date }} - {{ data.item.end_date }}
          </span>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <BLink
              :title="$trans('Confirm')"
              @click="() => showConfirmModal(data.item.id)"
            >
              <b-icon-check-lg class="edit-icon"></b-icon-check-lg>
            </BLink>
          </div>
        </template>
      </b-table>
    </div>
    <Pagination v-if="!isLoading" :model="this.sickLeavesService" :model_name="$trans('Unconfirmed sick leave')" />
    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />
    <b-modal
      id="confirm-leave-modal"
      ref="confirm-leave-modal"
      v-bind:title="$trans('Mark leave as confirmed')"
      @ok="doConfirm"
    >
      <p class="my-4">{{ $trans("Are you sure you want to mark this sick leave as confirmed?") }}</p>
    </b-modal>
  </div>
</template>

<script>
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import SubNav from "./SubNav.vue";
import { SickLeavesService } from "@/models/company/SickLeave.js";
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
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    SubNav,
  },
  data() {
    return {
      sickLeavesService: new SickLeavesService(),
      searchQuery: null,
      leavePk: null,
      isLoading: false,
      leaves: [],
      fields: [
        { key: "user_full_name", label: $trans("User"), thAttr: { width: "15%" } },
        { key: "date", label: $trans("Date") },
        { key: "created_by_fullname", label: $trans("Created by") },
        { key: "created", label: $trans("Created") },
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
      this.sickLeavesService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    showConfirmModal(id) {
      this.leavePk = id;
      this.$refs["confirm-leave-modal"].show();
    },
    async doConfirm() {
       this.isLoading = true;
      try {
        await this.sickLeavesService.setAsConfirmed(this.leavePk);
        infoToast(create, $trans("Accepted"), $trans("Leave as been marked as confirmed"));
        await this.loadData();
      } catch (error) {
        this.isLoading = false;
        console.log("error confirming leave", error);
        errorToast(create, $trans("Error confirming sick leave"));
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.sickLeavesService.getUnconfirmedSickLeaves();
        this.leaves = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching unconfirmed sick leave request", error);
        errorToast(create, $trans("Error loading unconfirmed sick leave request"));
        this.isLoading = false;
      }
    }
  }
};
</script>
<style scoped>
</style>
